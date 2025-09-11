-- ============================================================================
-- FIX INSERT POLICIES
-- ============================================================================
-- Fix the INSERT policies that have null qual conditions

-- Fix the admin insert policy
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT 
    WITH CHECK (is_admin_user());

-- Fix the user creation during signup policy
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
CREATE POLICY "Allow user creation during signup" ON public.users
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Fix the users can insert own data policy
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid()::text = externalid::text
    );

-- Verify the fix
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
AND cmd = 'INSERT'
ORDER BY policyname;
