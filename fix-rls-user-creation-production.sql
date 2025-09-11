-- ============================================================================
-- COMPREHENSIVE RLS FIX FOR USER CREATION IN PRODUCTION
-- ============================================================================
-- This script fixes the "new row violates row-level security policy for table 'users'" error
-- that occurs in production when users try to sign up or create accounts.

-- ============================================================================
-- 1. DROP ALL EXISTING USER POLICIES
-- ============================================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- ============================================================================
-- 2. CREATE FLEXIBLE RLS POLICIES
-- ============================================================================

-- Policy 1: Allow authenticated users to view their own data
CREATE POLICY "Users can view own data" ON public.users 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND (
        auth.uid()::text = externalid::text 
        OR externalid = auth.uid()
        OR isadmin = true
    )
);

-- Policy 2: Allow authenticated users to update their own data
CREATE POLICY "Users can update own data" ON public.users 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND (
        auth.uid()::text = externalid::text 
        OR externalid = auth.uid()
        OR isadmin = true
    )
);

-- Policy 3: Allow authenticated users to insert their own data
-- This is the most permissive policy for user creation
CREATE POLICY "Users can insert own data" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (
        auth.uid()::text = externalid::text 
        OR externalid = auth.uid()
        OR externalid IS NULL  -- Allow NULL externalid during creation
    )
);

-- Policy 4: Allow user creation during signup (most permissive)
CREATE POLICY "Allow user creation during signup" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Policy 5: Admin policies
CREATE POLICY "Admins can manage all users" ON public.users 
FOR ALL 
USING (
    auth.uid() IS NOT NULL 
    AND (
        isadmin = true 
        OR email IN ('krishnasathvikm@gmail.com', 'applytrak@gmail.com')
    )
);

-- ============================================================================
-- 3. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to safely get or create user profile
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
    
    -- Check if user already exists by email
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

-- Function to get current user ID
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

-- ============================================================================
-- 4. CREATE TRIGGER FOR AUTOMATIC USER CREATION
-- ============================================================================

-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Debug: Log the auth user ID
    RAISE NOTICE 'Creating user profile for auth user ID: %', NEW.id;
    
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
        RAISE NOTICE 'User profile created successfully for auth user ID: %', NEW.id;
    ELSE
        RAISE NOTICE 'User profile already exists for auth user ID: %', NEW.id;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user profile for auth user ID %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to automatically create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_profile(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Grant permissions to service role
GRANT EXECUTE ON FUNCTION public.current_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_profile(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================================================
-- 6. VERIFY POLICIES
-- ============================================================================

-- Check that all policies are created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public';
    
    IF policy_count < 5 THEN
        RAISE EXCEPTION 'Expected at least 5 policies on users table, found %', policy_count;
    END IF;
    
    RAISE NOTICE 'Successfully created % policies on users table', policy_count;
END $$;

-- ============================================================================
-- 7. TEST USER CREATION (OPTIONAL)
-- ============================================================================

-- This section can be uncommented for testing
/*
DO $$
DECLARE
    test_user_id uuid;
    test_email text;
BEGIN
    -- Create a test user (this would normally be done by Supabase Auth)
    test_user_id := gen_random_uuid();
    test_email := 'test@example.com';
    
    -- Test the get_or_create_user_profile function
    PERFORM public.get_or_create_user_profile(test_email, 'Test User');
    
    RAISE NOTICE 'Test user creation completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test user creation failed: %', SQLERRM;
END $$;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS fix completed successfully!';
    RAISE NOTICE 'The following policies have been created:';
    RAISE NOTICE '1. Users can view own data';
    RAISE NOTICE '2. Users can update own data';
    RAISE NOTICE '3. Users can insert own data';
    RAISE NOTICE '4. Allow user creation during signup';
    RAISE NOTICE '5. Admins can manage all users';
    RAISE NOTICE '';
    RAISE NOTICE 'User creation should now work in production!';
END $$;
