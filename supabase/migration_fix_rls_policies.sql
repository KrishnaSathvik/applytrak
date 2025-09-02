-- Fix RLS policies for user creation and management
-- This migration addresses the "new row violates row-level security policy for table 'users'" error

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Create a new INSERT policy that allows authenticated users to create their own records
-- This policy checks that the user is authenticated and the externalid matches their auth.uid()
CREATE POLICY "Users can insert own data" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = externalid::text
);

-- Also create a policy that allows the system to create user records during signup
-- This is needed for the initial user creation flow
CREATE POLICY "Allow user creation during signup" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Update the SELECT policy to be more flexible
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND (
        auth.uid()::text = externalid::text 
        OR isadmin = true
    )
);

-- Update the UPDATE policy to be more flexible
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND (
        auth.uid()::text = externalid::text 
        OR isadmin = true
    )
);

-- Add a policy for admin operations
CREATE POLICY "Admins can manage all users" ON public.users 
FOR ALL 
USING (isadmin = true);

-- Ensure the auth.uid() function is available
-- This is typically provided by Supabase, but let's make sure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auth.uid') THEN
        -- Create a fallback function if auth.uid() doesn't exist
        CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
        BEGIN
            RETURN current_setting('request.jwt.claims', true)::json->>'sub'::uuid;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;
END $$;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (externalid, email, display_name, createdat, updatedat)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to automatically create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the current_user_id function that the application needs
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS bigint AS $$
DECLARE
    user_id bigint;
BEGIN
    -- Get the user ID from the public.users table based on the current auth.uid()
    SELECT id INTO user_id 
    FROM public.users 
    WHERE externalid = auth.uid();
    
    RETURN user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to safely get or create user profile
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(
    user_email text,
    user_display_name text DEFAULT NULL,
    user_timezone text DEFAULT 'UTC',
    user_language text DEFAULT 'en'
)
RETURNS TABLE(
    id bigint,
    externalid uuid,
    email text,
    display_name text
) AS $$
DECLARE
    existing_user record;
    new_user record;
    auth_uid uuid;
BEGIN
    -- Get the current authenticated user's ID
    auth_uid := auth.uid();
    
    -- Check if user already exists
    SELECT * INTO existing_user 
    FROM public.users 
    WHERE email = user_email;
    
    IF existing_user IS NOT NULL THEN
        -- User exists, update externalid if needed
        IF existing_user.externalid IS NULL OR existing_user.externalid != auth_uid THEN
            UPDATE public.users 
            SET externalid = auth_uid, updatedat = NOW()
            WHERE id = existing_user.id;
            
            SELECT * INTO existing_user 
            FROM public.users 
            WHERE id = existing_user.id;
        END IF;
        
        RETURN QUERY SELECT 
            existing_user.id,
            existing_user.externalid,
            existing_user.email,
            existing_user.display_name;
    ELSE
        -- Create new user profile
        INSERT INTO public.users (
            externalid,
            email,
            display_name,
            timezone,
            language,
            createdat,
            updatedat
        ) VALUES (
            auth_uid,
            user_email,
            user_display_name,
            user_timezone,
            user_language,
            NOW(),
            NOW()
        ) RETURNING * INTO new_user;
        
        RETURN QUERY SELECT 
            new_user.id,
            new_user.externalid,
            new_user.email,
            new_user.display_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_profile(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
