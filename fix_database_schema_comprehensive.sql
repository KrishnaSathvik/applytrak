-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA FIX
-- ============================================================================
-- This script fixes all database schema issues including:
-- 1. is_admin vs isadmin column inconsistencies
-- 2. RLS policies that reference wrong column names
-- 3. Functions that use incorrect column names
-- 4. Any remaining schema inconsistencies

-- ============================================================================
-- 1. CHECK CURRENT SCHEMA
-- ============================================================================

-- Check what columns actually exist in the users table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY column_name;

-- Check for any functions that might reference is_admin
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_definition LIKE '%is_admin%' 
AND routine_schema = 'public';

-- Check for any policies that might reference is_admin
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE qual LIKE '%is_admin%' OR qual LIKE '%isadmin%';

-- ============================================================================
-- 2. FIX CURRENT_USER_ID FUNCTION
-- ============================================================================

-- Drop the existing function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS current_user_id() CASCADE;

-- Recreate the current_user_id function with correct column name
CREATE FUNCTION current_user_id()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id INTEGER;
BEGIN
    -- Get the current user's database ID
    SELECT id INTO user_id
    FROM users
    WHERE externalid::uuid = auth.uid()
    LIMIT 1;
    
    RETURN user_id;
END;
$$;

-- ============================================================================
-- 3. FIX RLS POLICIES
-- ============================================================================

-- Drop all existing policies that might have issues
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;

-- Recreate policies with correct column references
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (externalid = auth.uid()::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (externalid = auth.uid()::text);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (externalid = auth.uid()::text);

-- Admin policies (if needed)
CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid = auth.uid()::text 
            AND email IN ('krishnasathvikm@gmail.com', 'admin@applytrak.com')
        )
    );

CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid = auth.uid()::text 
            AND email IN ('krishnasathvikm@gmail.com', 'admin@applytrak.com')
        )
    );

-- ============================================================================
-- 4. FIX APPLICATIONS TABLE POLICIES
-- ============================================================================

-- Drop and recreate applications policies
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;
DROP POLICY IF EXISTS "Admin can view all applications" ON applications;
DROP POLICY IF EXISTS "Admin can update all applications" ON applications;

-- Recreate applications policies
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own applications" ON applications
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (userid = current_user_id());

CREATE POLICY "Users can delete own applications" ON applications
    FOR DELETE USING (userid = current_user_id());

-- Admin policies for applications
CREATE POLICY "Admin can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid = auth.uid()::text 
            AND email IN ('krishnasathvikm@gmail.com', 'admin@applytrak.com')
        )
    );

CREATE POLICY "Admin can update all applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid = auth.uid()::text 
            AND email IN ('krishnasathvikm@gmail.com', 'admin@applytrak.com')
        )
    );

-- ============================================================================
-- 5. FIX OTHER TABLE POLICIES
-- ============================================================================

-- Goals table policies
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own goals" ON goals
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own goals" ON goals
    FOR UPDATE USING (userid = current_user_id());

CREATE POLICY "Users can delete own goals" ON goals
    FOR DELETE USING (userid = current_user_id());

-- Feedback table policies
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;

CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own feedback" ON feedback
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (userid = current_user_id());

-- Analytics events table policies
DROP POLICY IF EXISTS "Users can view own analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_events;

CREATE POLICY "Users can view own analytics" ON analytics_events
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own analytics" ON analytics_events
    FOR INSERT WITH CHECK (userid = current_user_id());

-- ============================================================================
-- 6. VERIFY FIXES
-- ============================================================================

-- Check that all policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test the current_user_id function
SELECT current_user_id() as test_user_id;

-- Check for any remaining is_admin references
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_definition LIKE '%is_admin%' 
AND routine_schema = 'public';

-- ============================================================================
-- 7. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Ensure the current_user_id function is accessible
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO anon;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Database schema fix completed successfully!';
    RAISE NOTICE 'All RLS policies have been recreated with correct column references.';
    RAISE NOTICE 'The current_user_id function has been fixed.';
    RAISE NOTICE 'Please test the application to ensure everything works correctly.';
END $$;
