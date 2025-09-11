-- ============================================================================
-- COMPREHENSIVE ADMIN SYSTEM VERIFICATION
-- ============================================================================
-- Run this to verify everything is working correctly

-- ============================================================================
-- 1. CHECK ADMIN EMAILS ARE CONFIGURED
-- ============================================================================

DO $$
DECLARE
    admin_count integer;
    admin_record record;
BEGIN
    RAISE NOTICE '=== ADMIN EMAILS VERIFICATION ===';
    
    SELECT COUNT(*) INTO admin_count FROM public.admin_emails;
    RAISE NOTICE 'Total admin emails configured: %', admin_count;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Admin emails list:';
    FOR admin_record IN 
        SELECT email, role, created_at FROM public.admin_emails ORDER BY role, email
    LOOP
        RAISE NOTICE '- %: % (added: %)', admin_record.email, admin_record.role, admin_record.created_at;
    END LOOP;
    
    IF admin_count = 0 THEN
        RAISE NOTICE '❌ ERROR: No admin emails configured!';
    ELSE
        RAISE NOTICE '✅ Admin emails configured correctly';
    END IF;
END $$;

-- ============================================================================
-- 2. CHECK USERS TABLE STRUCTURE
-- ============================================================================

DO $$
DECLARE
    has_role_column boolean;
    has_permissions_column boolean;
    role_check_exists boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== USERS TABLE STRUCTURE VERIFICATION ===';
    
    -- Check if role column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) INTO has_role_column;
    
    -- Check if permissions column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'permissions'
        AND table_schema = 'public'
    ) INTO has_permissions_column;
    
    -- Check if role check constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%role%'
        AND constraint_schema = 'public'
    ) INTO role_check_exists;
    
    RAISE NOTICE 'Role column exists: %', has_role_column;
    RAISE NOTICE 'Permissions column exists: %', has_permissions_column;
    RAISE NOTICE 'Role check constraint exists: %', role_check_exists;
    
    IF has_role_column AND has_permissions_column AND role_check_exists THEN
        RAISE NOTICE '✅ Users table structure is correct';
    ELSE
        RAISE NOTICE '❌ ERROR: Users table structure is incomplete!';
    END IF;
END $$;

-- ============================================================================
-- 3. CHECK RLS POLICIES ON USERS TABLE
-- ============================================================================

DO $$
DECLARE
    policy_count integer;
    policy_record record;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== USERS TABLE RLS POLICIES VERIFICATION ===';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public';
    
    RAISE NOTICE 'Total policies on users table: %', policy_count;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Users table policies:';
    FOR policy_record IN 
        SELECT policyname, cmd, roles 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '- %: % (roles: %)', policy_record.policyname, policy_record.cmd, policy_record.roles;
    END LOOP;
    
    IF policy_count >= 5 THEN
        RAISE NOTICE '✅ Users table has sufficient RLS policies';
    ELSE
        RAISE NOTICE '❌ ERROR: Users table missing RLS policies!';
    END IF;
END $$;

-- ============================================================================
-- 4. CHECK RLS POLICIES ON ALL OTHER TABLES
-- ============================================================================

DO $$
DECLARE
    table_record record;
    policy_count integer;
    total_tables integer := 0;
    tables_with_policies integer := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ALL TABLES RLS POLICIES VERIFICATION ===';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'applications', 'goals', 'analytics_events', 'user_metrics', 
            'user_sessions', 'feedback', 'privacy_settings', 'email_preferences',
            'notification_preferences', 'backups', 'sync_status', 'sync_errors'
        )
        ORDER BY table_name
    LOOP
        total_tables := total_tables + 1;
        
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = table_record.table_name AND schemaname = 'public';
        
        RAISE NOTICE '%: % policies', table_record.table_name, policy_count;
        
        IF policy_count > 0 THEN
            tables_with_policies := tables_with_policies + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Tables with policies: %/%', tables_with_policies, total_tables;
    
    IF tables_with_policies = total_tables THEN
        RAISE NOTICE '✅ All tables have RLS policies';
    ELSE
        RAISE NOTICE '❌ ERROR: Some tables missing RLS policies!';
    END IF;
END $$;

-- ============================================================================
-- 5. CHECK HELPER FUNCTIONS
-- ============================================================================

DO $$
DECLARE
    function_count integer;
    function_record record;
    required_functions text[] := ARRAY[
        'current_user_id', 'is_admin', 'get_user_role', 
        'handle_new_user', 'add_admin_email', 'remove_admin_email'
    ];
    missing_functions text[] := ARRAY[]::text[];
    func_name text;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== HELPER FUNCTIONS VERIFICATION ===';
    
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE proname IN (SELECT unnest(required_functions))
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE 'Required functions found: %/%', function_count, array_length(required_functions, 1);
    
    RAISE NOTICE '';
    RAISE NOTICE 'Available functions:';
    FOR function_record IN 
        SELECT proname, prokind
        FROM pg_proc 
        WHERE proname IN (SELECT unnest(required_functions))
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY proname
    LOOP
        RAISE NOTICE '- % (%)', function_record.proname, 
            CASE function_record.prokind 
                WHEN 'f' THEN 'function' 
                WHEN 'p' THEN 'procedure' 
                ELSE 'other' 
            END;
    END LOOP;
    
    -- Check for missing functions
    FOREACH func_name IN ARRAY required_functions
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = func_name 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ) THEN
            missing_functions := array_append(missing_functions, func_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) IS NULL THEN
        RAISE NOTICE '✅ All required functions are available';
    ELSE
        RAISE NOTICE '❌ ERROR: Missing functions: %', array_to_string(missing_functions, ', ');
    END IF;
END $$;

-- ============================================================================
-- 6. CHECK TRIGGER
-- ============================================================================

DO $$
DECLARE
    trigger_exists boolean;
    trigger_record record;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TRIGGER VERIFICATION ===';
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth'))
    ) INTO trigger_exists;
    
    RAISE NOTICE 'Auto-assignment trigger exists: %', trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✅ Auto-assignment trigger is active';
    ELSE
        RAISE NOTICE '❌ ERROR: Auto-assignment trigger is missing!';
    END IF;
END $$;

-- ============================================================================
-- 7. TEST ROLE ASSIGNMENT (DRY RUN)
-- ============================================================================

DO $$
DECLARE
    test_email text;
    expected_role text;
    actual_role text;
    test_passed boolean := true;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ROLE ASSIGNMENT TEST (DRY RUN) ===';
    
    -- Test super_admin email
    test_email := 'krishnasathvikm@gmail.com';
    expected_role := 'super_admin';
    
    SELECT role INTO actual_role
    FROM public.admin_emails 
    WHERE email = test_email;
    
    RAISE NOTICE 'Test: % should be %', test_email, expected_role;
    RAISE NOTICE 'Actual: %', COALESCE(actual_role, 'NOT FOUND');
    
    IF actual_role = expected_role THEN
        RAISE NOTICE '✅ % role assignment correct', test_email;
    ELSE
        RAISE NOTICE '❌ ERROR: % role assignment incorrect!', test_email;
        test_passed := false;
    END IF;
    
    -- Test admin email
    test_email := 'applytrak@gmail.com';
    expected_role := 'admin';
    
    SELECT role INTO actual_role
    FROM public.admin_emails 
    WHERE email = test_email;
    
    RAISE NOTICE 'Test: % should be %', test_email, expected_role;
    RAISE NOTICE 'Actual: %', COALESCE(actual_role, 'NOT FOUND');
    
    IF actual_role = expected_role THEN
        RAISE NOTICE '✅ % role assignment correct', test_email;
    ELSE
        RAISE NOTICE '❌ ERROR: % role assignment incorrect!', test_email;
        test_passed := false;
    END IF;
    
    IF test_passed THEN
        RAISE NOTICE '✅ All role assignments are correct';
    ELSE
        RAISE NOTICE '❌ ERROR: Some role assignments are incorrect!';
    END IF;
END $$;

-- ============================================================================
-- 8. FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL VERIFICATION SUMMARY ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Admin system verification complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Sign up with krishnasathvikm@gmail.com (should become super_admin)';
    RAISE NOTICE '2. Sign up with applytrak@gmail.com (should become admin)';
    RAISE NOTICE '3. Test creating applications and using admin features';
    RAISE NOTICE '4. Verify RLS policies work by checking data access';
    RAISE NOTICE '';
    RAISE NOTICE 'If any errors were shown above, please fix them before testing.';
END $$;
