-- ============================================================================
-- COMPLETE ADMIN REBUILD WITH AUTO ASSIGNMENT (FIXED)
-- ============================================================================
-- This does everything: rebuilds admin system + adds auto assignment
-- Uses CASCADE to handle dependencies properly

-- ============================================================================
-- 1. DROP ALL EXISTING ADMIN-RELATED POLICIES AND FUNCTIONS
-- ============================================================================

-- Drop all existing policies with CASCADE to handle dependencies
DROP POLICY IF EXISTS "Users can view own data" ON public.users CASCADE;
DROP POLICY IF EXISTS "Users can update own data" ON public.users CASCADE;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users CASCADE;
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users CASCADE;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Allow all authenticated users to view users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Allow all authenticated users to update users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Allow all authenticated users to insert users" ON public.users CASCADE;

-- Drop all policies on other tables that depend on current_user_id
DROP POLICY IF EXISTS "Users can view own applications" ON public.applications CASCADE;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications CASCADE;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications CASCADE;
DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications CASCADE;

DROP POLICY IF EXISTS "Users can view own goals" ON public.goals CASCADE;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals CASCADE;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals CASCADE;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals CASCADE;

DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events CASCADE;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events CASCADE;

DROP POLICY IF EXISTS "Users can view own user metrics" ON public.user_metrics CASCADE;
DROP POLICY IF EXISTS "Users can insert own user metrics" ON public.user_metrics CASCADE;
DROP POLICY IF EXISTS "Users can update own user metrics" ON public.user_metrics CASCADE;

DROP POLICY IF EXISTS "Users can view own user sessions" ON public.user_sessions CASCADE;
DROP POLICY IF EXISTS "Users can insert own user sessions" ON public.user_sessions CASCADE;

DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback CASCADE;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback CASCADE;

DROP POLICY IF EXISTS "Users can view own privacy settings" ON public.privacy_settings CASCADE;
DROP POLICY IF EXISTS "Users can insert own privacy settings" ON public.privacy_settings CASCADE;
DROP POLICY IF EXISTS "Users can update own privacy settings" ON public.privacy_settings CASCADE;

DROP POLICY IF EXISTS "Users can view own email preferences" ON public.email_preferences CASCADE;
DROP POLICY IF EXISTS "Users can insert own email preferences" ON public.email_preferences CASCADE;
DROP POLICY IF EXISTS "Users can update own email preferences" ON public.email_preferences CASCADE;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences CASCADE;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences CASCADE;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences CASCADE;

DROP POLICY IF EXISTS "Users can view own backups" ON public.backups CASCADE;
DROP POLICY IF EXISTS "Users can insert own backups" ON public.backups CASCADE;
DROP POLICY IF EXISTS "Users can update own backups" ON public.backups CASCADE;
DROP POLICY IF EXISTS "Users can delete own backups" ON public.backups CASCADE;

DROP POLICY IF EXISTS "Users can view own sync status" ON public.sync_status CASCADE;
DROP POLICY IF EXISTS "Users can insert own sync status" ON public.sync_status CASCADE;
DROP POLICY IF EXISTS "Users can update own sync status" ON public.sync_status CASCADE;

DROP POLICY IF EXISTS "Users can view own sync errors" ON public.sync_errors CASCADE;
DROP POLICY IF EXISTS "Users can insert own sync errors" ON public.sync_errors CASCADE;

-- Drop admin-related functions with CASCADE
DROP FUNCTION IF EXISTS public.current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_user_profile(text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.promote_to_admin(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.demote_admin(bigint) CASCADE;

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

-- ============================================================================
-- 5. CREATE CLEAN RLS POLICIES FOR USERS TABLE
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
-- 6. RECREATE RLS POLICIES FOR OTHER TABLES
-- ============================================================================

-- Applications table policies
CREATE POLICY "Users can view own applications" ON public.applications 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own applications" ON public.applications 
FOR INSERT 
WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own applications" ON public.applications 
FOR UPDATE 
USING (userid = current_user_id());

CREATE POLICY "Users can delete own applications" ON public.applications 
FOR DELETE 
USING (userid = current_user_id());

-- Goals table policies
CREATE POLICY "Users can view own goals" ON public.goals 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own goals" ON public.goals 
FOR INSERT 
WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own goals" ON public.goals 
FOR UPDATE 
USING (userid = current_user_id());

CREATE POLICY "Users can delete own goals" ON public.goals 
FOR DELETE 
USING (userid = current_user_id());

-- Analytics events table policies
CREATE POLICY "Users can view own analytics events" ON public.analytics_events 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own analytics events" ON public.analytics_events 
FOR INSERT 
WITH CHECK (userid = current_user_id());

-- User metrics table policies
CREATE POLICY "Users can view own user metrics" ON public.user_metrics 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own user metrics" ON public.user_metrics 
FOR INSERT 
WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own user metrics" ON public.user_metrics 
FOR UPDATE 
USING (userid = current_user_id());

-- User sessions table policies
CREATE POLICY "Users can view own user sessions" ON public.user_sessions 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own user sessions" ON public.user_sessions 
FOR INSERT 
WITH CHECK (userid = current_user_id());

-- Feedback table policies
CREATE POLICY "Users can view own feedback" ON public.feedback 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own feedback" ON public.feedback 
FOR INSERT 
WITH CHECK (userid = current_user_id());

-- Privacy settings table policies
CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings 
FOR INSERT 
WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings 
FOR UPDATE 
USING (userid = current_user_id());

-- Email preferences table policies
CREATE POLICY "Users can view own email preferences" ON public.email_preferences 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own email preferences" ON public.email_preferences 
FOR INSERT 
WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own email preferences" ON public.email_preferences 
FOR UPDATE 
USING (userid = current_user_id());

-- Notification preferences table policies
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences 
FOR INSERT 
WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences 
FOR UPDATE 
USING (userid = current_user_id());

-- Backups table policies
CREATE POLICY "Users can view own backups" ON public.backups 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own backups" ON public.backups 
FOR INSERT 
WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own backups" ON public.backups 
FOR UPDATE 
USING (userid = current_user_id());

CREATE POLICY "Users can delete own backups" ON public.backups 
FOR DELETE 
USING (userid = current_user_id());

-- Sync status table policies
CREATE POLICY "Users can view own sync status" ON public.sync_status 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own sync status" ON public.sync_status 
FOR INSERT 
WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own sync status" ON public.sync_status 
FOR UPDATE 
USING (userid = current_user_id());

-- Sync errors table policies
CREATE POLICY "Users can view own sync errors" ON public.sync_errors 
FOR SELECT 
USING (userid = current_user_id());

CREATE POLICY "Users can insert own sync errors" ON public.sync_errors 
FOR INSERT 
WITH CHECK (userid = current_user_id());

-- ============================================================================
-- 7. CREATE USER CREATION TRIGGER WITH AUTO ADMIN ASSIGNMENT
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
-- 8. UPDATE EXISTING USERS (IF ANY)
-- ============================================================================

-- Update existing users if they match admin emails
UPDATE public.users 
SET role = admin_emails.role, updatedat = NOW()
FROM public.admin_emails 
WHERE public.users.email = admin_emails.email;

-- ============================================================================
-- 9. CREATE ADMIN MANAGEMENT FUNCTIONS
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
-- 10. GRANT PERMISSIONS
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
-- 11. VERIFY SETUP
-- ============================================================================

DO $$
DECLARE
    admin_count integer;
    admin_record record;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.admin_emails;
    
    RAISE NOTICE '✅ Complete admin system rebuilt successfully!';
    RAISE NOTICE 'Admin emails configured: %', admin_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Admin emails:';
    FOR admin_record IN 
        SELECT email, role FROM public.admin_emails ORDER BY role, email
    LOOP
        RAISE NOTICE '- %: %', admin_record.email, admin_record.role;
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE 'Now when you sign up with these emails, you will automatically get admin privileges!';
    RAISE NOTICE 'No manual commands needed!';
    RAISE NOTICE '';
    RAISE NOTICE 'All RLS policies have been recreated for all tables.';
END $$;
