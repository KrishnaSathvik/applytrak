-- ============================================================================
-- CLEAN ADMIN SYSTEM REBUILD
-- ============================================================================
-- This completely rebuilds the admin system to be clean and secure
-- Admins are regular users with special privileges, no hardcoded emails

-- ============================================================================
-- 1. DROP ALL EXISTING ADMIN-RELATED POLICIES AND FUNCTIONS
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Allow all authenticated users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow all authenticated users to update users" ON public.users;
DROP POLICY IF EXISTS "Allow all authenticated users to insert users" ON public.users;

-- Drop admin-related functions
DROP FUNCTION IF EXISTS public.current_user_id();
DROP FUNCTION IF EXISTS public.get_or_create_user_profile(text, text, text, text);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- 2. CLEAN UP USERS TABLE
-- ============================================================================

-- Remove the buggy admin columns and add proper role system
ALTER TABLE public.users DROP COLUMN IF EXISTS isadmin;
ALTER TABLE public.users DROP COLUMN IF EXISTS adminpermissions;

-- Add proper role system
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}';

-- ============================================================================
-- 3. CREATE CLEAN RLS POLICIES
-- ============================================================================

-- Policy 1: Users can view their own data
CREATE POLICY "Users can view own data" ON public.users 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND (
        externalid = auth.uid()
        OR externalid::text = auth.uid()::text
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- Policy 2: Users can update their own data
CREATE POLICY "Users can update own data" ON public.users 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND (
        externalid = auth.uid()
        OR externalid::text = auth.uid()::text
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- Policy 3: Users can insert their own data
CREATE POLICY "Users can insert own data" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Policy 4: Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Policy 5: Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- 4. CREATE CLEAN HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user ID
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS bigint AS $$
DECLARE
    user_id bigint;
    auth_uuid uuid;
BEGIN
    auth_uuid := auth.uid();
    
    IF auth_uuid IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT id INTO user_id 
    FROM public.users 
    WHERE externalid = auth_uuid
    OR externalid::text = auth_uuid::text
    OR email = (SELECT email FROM auth.users WHERE id = auth_uuid)
    LIMIT 1;
    
    RETURN user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
    user_role text;
    auth_uuid uuid;
BEGIN
    auth_uuid := auth.uid();
    
    IF auth_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    SELECT role INTO user_role
    FROM public.users 
    WHERE externalid = auth_uuid
    OR externalid::text = auth_uuid::text
    OR email = (SELECT email FROM auth.users WHERE id = auth_uuid)
    LIMIT 1;
    
    RETURN user_role IN ('admin', 'super_admin');
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
    user_role text;
    auth_uuid uuid;
BEGIN
    auth_uuid := auth.uid();
    
    IF auth_uuid IS NULL THEN
        RETURN 'user';
    END IF;
    
    SELECT role INTO user_role
    FROM public.users 
    WHERE externalid = auth_uuid
    OR externalid::text = auth_uuid::text
    OR email = (SELECT email FROM auth.users WHERE id = auth_uuid)
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'user');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_email text,
    user_display_name text DEFAULT NULL,
    user_timezone text DEFAULT 'UTC',
    user_language text DEFAULT 'en'
)
RETURNS TABLE(
    id bigint,
    externalid uuid,
    email text,
    display_name text,
    role text
) AS $$
DECLARE
    new_user record;
    auth_uid uuid;
BEGIN
    auth_uid := auth.uid();
    
    IF auth_uid IS NULL THEN
        RAISE EXCEPTION 'No authenticated user';
    END IF;
    
    INSERT INTO public.users (
        externalid,
        email,
        display_name,
        timezone,
        language,
        role,
        createdat,
        updatedat
    ) VALUES (
        auth_uid,
        user_email,
        user_display_name,
        user_timezone,
        user_language,
        'user', -- Default role is 'user'
        NOW(),
        NOW()
    ) RETURNING * INTO new_user;
    
    RETURN QUERY SELECT 
        new_user.id,
        new_user.externalid,
        new_user.email,
        new_user.display_name,
        new_user.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CREATE USER CREATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE externalid = NEW.id) THEN
        INSERT INTO public.users (externalid, email, display_name, role, createdat, updatedat)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            'user', -- Default role
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. CREATE ADMIN MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to promote user to admin (only super_admin can do this)
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id bigint)
RETURNS boolean AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is super_admin
    current_user_role := public.get_user_role();
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can promote users to admin';
    END IF;
    
    -- Update user role
    UPDATE public.users 
    SET role = 'admin', updatedat = NOW()
    WHERE id = target_user_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin to user (only super_admin can do this)
CREATE OR REPLACE FUNCTION public.demote_admin(target_user_id bigint)
RETURNS boolean AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is super_admin
    current_user_role := public.get_user_role();
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can demote users';
    END IF;
    
    -- Update user role
    UPDATE public.users 
    SET role = 'user', updatedat = NOW()
    WHERE id = target_user_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_admin(bigint) TO authenticated;

GRANT EXECUTE ON FUNCTION public.current_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.demote_admin(bigint) TO service_role;

-- ============================================================================
-- 8. CREATE INITIAL SUPER ADMIN
-- ============================================================================

-- This will be run after you create your account
-- You'll need to manually promote yourself to super_admin
DO $$
BEGIN
    RAISE NOTICE 'Clean admin system created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Sign up with your email (krishnasathvikm@gmail.com)';
    RAISE NOTICE '2. Run: UPDATE public.users SET role = ''super_admin'' WHERE email = ''krishnasathvikm@gmail.com'';';
    RAISE NOTICE '3. Sign up with applytrak@gmail.com';
    RAISE NOTICE '4. Promote applytrak@gmail.com to admin using the promote_to_admin function';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin roles:';
    RAISE NOTICE '- user: Regular user (default)';
    RAISE NOTICE '- admin: Can view all users and manage applications';
    RAISE NOTICE '- super_admin: Can promote/demote users and full admin access';
END $$;
