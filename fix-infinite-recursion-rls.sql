-- ============================================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================================================
-- This script fixes the infinite recursion error in the users table RLS policies
-- The issue occurs when admin policies query the users table within their conditions,
-- creating a circular reference that causes infinite recursion.

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTION FOR ADMIN CHECK
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;

-- Create a security definer function to check admin status
-- This function bypasses RLS and can safely check admin status
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    is_admin BOOLEAN := FALSE;
BEGIN
    -- Get the current user's email from auth.users (not our users table)
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Check if the email is in the admin list
    IF user_email IN ('krishnasathvikm@gmail.com', 'applytrak@gmail.com') THEN
        is_admin := TRUE;
    END IF;
    
    RETURN is_admin;
END;
$$;

-- ============================================================================
-- 2. DROP ALL EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;

-- ============================================================================
-- 3. CREATE NEW NON-RECURSIVE POLICIES
-- ============================================================================

-- Basic user policies (no admin checks to avoid recursion)
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid()::text = externalid::text
    );

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid()::text = externalid::text
    );

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid()::text = externalid::text
    );

-- Allow user creation during signup (more permissive for initial setup)
CREATE POLICY "Allow user creation during signup" ON public.users
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Admin policies using the security definer function
-- Drop any existing admin policies first
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT 
    USING (is_admin_user());

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE 
    USING (is_admin_user());

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT 
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE 
    USING (is_admin_user());

-- ============================================================================
-- 4. VERIFY THE FIX
-- ============================================================================

-- Test that the function works without recursion
SELECT 
    'Admin check function created successfully' as status,
    is_admin_user() as current_user_is_admin;

-- Show all policies on the users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================================
-- 5. ADDITIONAL SAFETY MEASURES
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Infinite recursion fix completed successfully!';
    RAISE NOTICE 'The users table RLS policies have been updated to prevent circular references.';
    RAISE NOTICE 'Admin status is now checked using a security definer function that bypasses RLS.';
END $$;
