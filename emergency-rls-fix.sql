-- ============================================================================
-- EMERGENCY RLS FIX - MOST PERMISSIVE POLICIES
-- ============================================================================
-- This creates the most permissive policies possible to fix permission denied errors

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create extremely permissive policies
CREATE POLICY "Allow all authenticated users to view users" ON public.users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users to update users" ON public.users 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users to insert users" ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Temporarily disable RLS to test (COMMENT OUT AFTER TESTING)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public';
    
    RAISE NOTICE 'Created % policies on users table', policy_count;
    RAISE NOTICE 'RLS policies should now allow all authenticated users';
END $$;
