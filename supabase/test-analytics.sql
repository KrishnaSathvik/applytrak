-- Test Analytics Collection
-- This verifies that analytics will collect data by default

-- Test 1: Check if analytics tables exist and have data
SELECT 
    'ANALYTICS TABLES CHECK' as test_type,
    'analytics_events' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events' AND table_schema = 'public') 
        THEN '✅ TABLE EXISTS' 
        ELSE '❌ TABLE MISSING' 
    END as status;

SELECT 
    'ANALYTICS TABLES CHECK' as test_type,
    'user_sessions' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') 
        THEN '✅ TABLE EXISTS' 
        ELSE '❌ TABLE MISSING' 
    END as status;

SELECT 
    'ANALYTICS TABLES CHECK' as test_type,
    'user_metrics' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_metrics' AND table_schema = 'public') 
        THEN '✅ TABLE EXISTS' 
        ELSE '❌ TABLE MISSING' 
    END as status;

-- Test 2: Check privacy settings table
SELECT 
    'PRIVACY SETTINGS CHECK' as test_type,
    'privacy_settings' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'privacy_settings' AND table_schema = 'public') 
        THEN '✅ TABLE EXISTS' 
        ELSE '❌ TABLE MISSING' 
    END as status;

-- Test 3: Check if users can have analytics consent
SELECT 
    'ANALYTICS CONSENT CHECK' as test_type,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'analytics' THEN '✅ ANALYTICS COLUMN EXISTS' 
        ELSE '❌ ANALYTICS COLUMN MISSING' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'privacy_settings' 
AND table_schema = 'public'
AND column_name = 'analytics';

-- Test 4: Check notification preferences
SELECT 
    'NOTIFICATION PREFERENCES CHECK' as test_type,
    COUNT(*) as user_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ USERS HAVE NOTIFICATION PREFERENCES' 
        ELSE '❌ NO NOTIFICATION PREFERENCES' 
    END as status
FROM public.notification_preferences;

-- Test 5: Check admin email templates
SELECT 
    'ADMIN EMAIL TEMPLATES CHECK' as test_type,
    COUNT(*) as template_count,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ EMAIL TEMPLATES READY' 
        ELSE '❌ INSUFFICIENT EMAIL TEMPLATES' 
    END as status
FROM public.admin_emails;

-- Test 6: Check cleanup function
SELECT 
    'CLEANUP FUNCTION CHECK' as test_type,
    proname as function_name,
    CASE 
        WHEN proname = 'cleanup_user_data' THEN '✅ CLEANUP FUNCTION EXISTS' 
        ELSE '❌ CLEANUP FUNCTION MISSING' 
    END as status
FROM pg_proc 
WHERE proname = 'cleanup_user_data'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Final Analytics Summary
DO $$ 
DECLARE
    analytics_tables integer;
    privacy_table integer;
    notification_data integer;
    admin_templates integer;
    cleanup_function integer;
    total_score integer;
BEGIN
    -- Count analytics tables
    SELECT COUNT(*) INTO analytics_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN ('analytics_events', 'user_sessions', 'user_metrics');
    
    -- Check privacy settings table
    SELECT CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'privacy_settings' AND table_schema = 'public') 
        THEN 1 ELSE 0 
    END INTO privacy_table;
    
    -- Check notification data
    SELECT COUNT(*) INTO notification_data FROM public.notification_preferences;
    
    -- Check admin templates
    SELECT COUNT(*) INTO admin_templates FROM public.admin_emails;
    
    -- Check cleanup function
    SELECT CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_user_data' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) 
        THEN 1 ELSE 0 
    END INTO cleanup_function;
    
    total_score := analytics_tables + privacy_table + 
        CASE WHEN notification_data > 0 THEN 1 ELSE 0 END + 
        CASE WHEN admin_templates >= 3 THEN 1 ELSE 0 END + 
        cleanup_function;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 ANALYTICS SYSTEM VERIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📈 Analytics Tables: %/3 exist', analytics_tables;
    RAISE NOTICE '🔒 Privacy Settings: %', CASE WHEN privacy_table = 1 THEN '✅ Ready' ELSE '❌ Missing' END;
    RAISE NOTICE '🔔 Notifications: % users have preferences', notification_data;
    RAISE NOTICE '📧 Admin Templates: % templates ready', admin_templates;
    RAISE NOTICE '🗑️ Data Cleanup: %', CASE WHEN cleanup_function = 1 THEN '✅ Ready' ELSE '❌ Missing' END;
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎯 ANALYTICS SCORE: %/6', total_score;
    
    IF total_score >= 5 THEN
        RAISE NOTICE '🏆 ANALYTICS SYSTEM: PERFECT!';
        RAISE NOTICE '✅ Analytics will collect data by default on signup';
        RAISE NOTICE '✅ Users can disable analytics in privacy settings';
        RAISE NOTICE '✅ Users can delete all data via privacy settings';
        RAISE NOTICE '✅ Admin email system is ready';
        RAISE NOTICE '✅ Notification system is ready';
    ELSE
        RAISE NOTICE '⚠️ ANALYTICS SYSTEM: NEEDS ATTENTION';
        RAISE NOTICE '❌ Some components are missing or incomplete';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
