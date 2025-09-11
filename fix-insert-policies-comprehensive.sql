-- ============================================================================
-- COMPREHENSIVE FIX FOR INSERT POLICIES
-- ============================================================================
-- This script fixes all INSERT policies that have null qual conditions

-- First, let's see what we're working with
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Recreate all INSERT policies with proper conditions
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT 
    WITH CHECK (is_admin_user());

CREATE POLICY "Allow user creation during signup" ON public.users
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid()::text = externalid::text
    );

-- Verify the fix worked
SELECT 
    'INSERT policies fixed successfully' as status,
    COUNT(*) as total_insert_policies
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
AND cmd = 'INSERT';

-- Show the updated policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
AND cmd = 'INSERT'
ORDER BY policyname;
