-- ============================================================================
-- FIX USERS_BACKUP TABLE RLS
-- ============================================================================
-- This adds proper RLS policies for the users_backup table

-- ============================================================================
-- 1. ENABLE RLS ON USERS_BACKUP TABLE
-- ============================================================================

-- Enable RLS on users_backup table
ALTER TABLE public.users_backup ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ADD RLS POLICIES FOR USERS_BACKUP TABLE
-- ============================================================================

-- Only super admins can view backup data
CREATE POLICY "Super admins can view users backup" ON public.users_backup 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Only super admins can insert backup data
CREATE POLICY "Super admins can insert users backup" ON public.users_backup 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Only super admins can update backup data
CREATE POLICY "Super admins can update users backup" ON public.users_backup 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Only super admins can delete backup data
CREATE POLICY "Super admins can delete users backup" ON public.users_backup 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role = 'super_admin'
    )
);

-- ============================================================================
-- 3. VERIFY RLS STATUS
-- ============================================================================

DO $$
DECLARE
    rls_enabled boolean;
    policy_count integer;
BEGIN
    RAISE NOTICE '=== USERS_BACKUP RLS VERIFICATION ===';
    
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'users_backup' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users_backup' 
    AND schemaname = 'public';
    
    RAISE NOTICE 'users_backup RLS enabled: %', 
        CASE WHEN rls_enabled THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'users_backup policies count: %', policy_count;
    
    IF rls_enabled AND policy_count >= 4 THEN
        RAISE NOTICE '✅ users_backup table is now properly secured';
        RAISE NOTICE 'Only super admins can access backup data';
    ELSE
        RAISE NOTICE '❌ ERROR: users_backup table not properly secured!';
    END IF;
END $$;
