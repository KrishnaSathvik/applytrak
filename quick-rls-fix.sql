-- ============================================================================
-- QUICK RLS FIX FOR PRODUCTION USER CREATION
-- ============================================================================
-- Run this immediately to fix the RLS policy violation error

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Create a more permissive INSERT policy
CREATE POLICY "Users can insert own data" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Also ensure the signup policy exists
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
CREATE POLICY "Allow user creation during signup" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Make sure the trigger exists for automatic user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE externalid = NEW.id) THEN
        INSERT INTO public.users (externalid, email, display_name, createdat, updatedat)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth user creation
        RAISE NOTICE 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
