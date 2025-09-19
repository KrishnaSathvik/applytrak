-- =====================================================
-- QUICK DATABASE TEST FOR ACHIEVEMENT SYSTEM
-- =====================================================
-- Run this in Supabase SQL Editor for a quick health check

-- 1. Check if all required tables exist
SELECT 
    'TABLE CHECK' as test,
    tablename,
    'EXISTS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('achievements', 'user_achievements', 'user_stats', 'users', 'applications')
ORDER BY tablename;

-- 2. Check if all required functions exist
SELECT 
    'FUNCTION CHECK' as test,
    routine_name,
    'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_achievements', 'get_user_stats', 'unlock_achievement')
ORDER BY routine_name;

-- 3. Count achievements by category
SELECT 
    'ACHIEVEMENT COUNT' as test,
    category,
    COUNT(*) as count
FROM achievements 
GROUP BY category
ORDER BY category;

-- 4. Check total users and applications
SELECT 
    'DATA COUNT' as test,
    'users' as table_name,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'DATA COUNT' as test,
    'applications' as table_name,
    COUNT(*) as count
FROM applications
UNION ALL
SELECT 
    'DATA COUNT' as test,
    'user_achievements' as table_name,
    COUNT(*) as count
FROM user_achievements;

-- 5. Test with a real user (replace with actual user UUID)
-- First, get a user UUID to test with
SELECT 
    'TEST USER' as test,
    externalid as user_uuid,
    email,
    'Use this UUID for testing' as note
FROM users 
LIMIT 1;

-- 6. Test the get_user_achievements function (uncomment and replace UUID)
-- SELECT * FROM get_user_achievements('REPLACE-WITH-ACTUAL-UUID'::uuid);

-- 7. Test the get_user_stats function (uncomment and replace UUID)  
-- SELECT * FROM get_user_stats('REPLACE-WITH-ACTUAL-UUID'::uuid);
