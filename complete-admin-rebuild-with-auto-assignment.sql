-- ============================================================================
-- COMPLETE ADMIN REBUILD WITH AUTO ASSIGNMENT
-- ============================================================================
-- This does everything: rebuilds admin system + adds auto assignment

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
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.promote_to_admin(bigint);
DROP FUNCTION IF EXISTS public.demote_admin(bigint);

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
-- 3. CREATE ADMIN EMAIL LIST
-- ============================================================================

-- Create a table to store admin emails
CREATE TABLE IF NOT EXISTS public.admin_emails (
    email text PRIMARY KEY,
    role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
    created_at timestamp with time zone DEFAULT NOW()
);

-- Insert your admin emails
INSERT INTO public.admin_emails (email, role) VALUES 
    ('krishnasathvikm@gmail.com', 'super_admin'),
    ('applytrak@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET 
    role = EXCLUDED.role,
    created_at = NOW();

-- ============================================================================
-- 4. CREATE CLEAN RLS POLICIES
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
-- 5. CREATE CLEAN HELPER FUNCTIONS
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

-- ============================================================================
-- 6. CREATE USER CREATION TRIGGER WITH AUTO ADMIN ASSIGNMENT
-- ============================================================================

-- Create new trigger that automatically assigns admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role text := 'user';
    admin_email_record record;
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE externalid = NEW.id) THEN
        
        -- Check if this email should be an admin
        SELECT role INTO admin_email_record
        FROM public.admin_emails 
        WHERE email = NEW.email;
        
        -- Set role based on admin email list
        IF admin_email_record IS NOT NULL THEN
            user_role := admin_email_record.role;
        END IF;
        
        -- Insert user with appropriate role
        INSERT INTO public.users (externalid, email, display_name, role, createdat, updatedat)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            user_role,
            NOW(),
            NOW()
        );
        
        -- Log the role assignment
        IF user_role != 'user' THEN
            RAISE NOTICE 'User % assigned role: %', NEW.email, user_role;
        END IF;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. UPDATE EXISTING USERS (IF ANY)
-- ============================================================================

-- Update existing users if they match admin emails
UPDATE public.users 
SET role = admin_emails.role, updatedat = NOW()
FROM public.admin_emails 
WHERE public.users.email = admin_emails.email;

-- ============================================================================
-- 8. CREATE ADMIN MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to add new admin emails (for future use)
CREATE OR REPLACE FUNCTION public.add_admin_email(
    admin_email text,
    admin_role text DEFAULT 'admin'
)
RETURNS boolean AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is super_admin
    current_user_role := public.get_user_role();
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can add admin emails';
    END IF;
    
    -- Validate role
    IF admin_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be admin or super_admin';
    END IF;
    
    -- Insert or update admin email
    INSERT INTO public.admin_emails (email, role) 
    VALUES (admin_email, admin_role)
    ON CONFLICT (email) DO UPDATE SET 
        role = EXCLUDED.role,
        created_at = NOW();
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin emails
CREATE OR REPLACE FUNCTION public.remove_admin_email(admin_email text)
RETURNS boolean AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is super_admin
    current_user_role := public.get_user_role();
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can remove admin emails';
    END IF;
    
    -- Remove from admin emails list
    DELETE FROM public.admin_emails WHERE email = admin_email;
    
    -- Demote the user if they exist
    UPDATE public.users 
    SET role = 'user', updatedat = NOW()
    WHERE email = admin_email;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_admin_email(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin_email(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.current_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.add_admin_email(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_admin_email(text) TO service_role;

-- ============================================================================
-- 10. VERIFY SETUP
-- ============================================================================

DO $$
DECLARE
    admin_count integer;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.admin_emails;
    
    RAISE NOTICE '✅ Complete admin system rebuilt successfully!';
    RAISE NOTICE 'Admin emails configured: %', admin_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Admin emails:';
    FOR admin_count IN 
        SELECT email, role FROM public.admin_emails ORDER BY role, email
    LOOP
        RAISE NOTICE '- %: %', admin_count, (SELECT role FROM public.admin_emails WHERE email = admin_count);
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE 'Now when you sign up with these emails, you will automatically get admin privileges!';
    RAISE NOTICE 'No manual commands needed!';
END $$;
