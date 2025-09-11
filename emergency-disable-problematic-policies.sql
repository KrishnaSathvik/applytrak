-- ============================================================================
-- EMERGENCY FIX: DISABLE PROBLEMATIC POLICIES
-- ============================================================================
-- This is a quick fix to immediately resolve the infinite recursion error
-- by temporarily disabling the problematic admin policies.

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Keep only the basic user policies that don't cause recursion
-- (These should already exist, but we'll ensure they're correct)

-- Ensure basic user policies exist and are correct
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid()::text = externalid::text
    );

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid()::text = externalid::text
    );

DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid()::text = externalid::text
    );

-- Allow user creation during signup
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
CREATE POLICY "Allow user creation during signup" ON public.users
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Verify the fix
SELECT 
    'Emergency fix applied - problematic admin policies removed' as status,
    COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Show remaining policies
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;
