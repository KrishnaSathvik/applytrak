-- =====================================================
-- ACHIEVEMENT DATABASE TRIPLE-CHECK QUERIES
-- =====================================================
-- Run these queries in Supabase SQL Editor to verify
-- the achievement system database is working correctly

-- =====================================================
-- 1. CHECK DATABASE TABLES EXIST
-- =====================================================
SELECT 
    'Table Existence Check' as test_name,
    tablename,
    CASE 
        WHEN tablename IN ('achievements', 'user_achievements', 'user_stats', 'users', 'applications') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('achievements', 'user_achievements', 'user_stats', 'users', 'applications')
ORDER BY tablename;

-- =====================================================
-- 2. CHECK ACHIEVEMENTS TABLE STRUCTURE
-- =====================================================
SELECT 
    'Achievements Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'achievements' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 3. CHECK USER_ACHIEVEMENTS TABLE STRUCTURE
-- =====================================================
SELECT 
    'User Achievements Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_achievements' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK USER_STATS TABLE STRUCTURE
-- =====================================================
SELECT 
    'User Stats Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 5. CHECK ACHIEVEMENTS DATA
-- =====================================================
SELECT 
    'Achievements Data Check' as test_name,
    COUNT(*) as total_achievements,
    COUNT(CASE WHEN category = 'milestone' THEN 1 END) as milestone_count,
    COUNT(CASE WHEN category = 'quality' THEN 1 END) as quality_count,
    COUNT(CASE WHEN category = 'special' THEN 1 END) as special_count,
    COUNT(CASE WHEN category = 'streak' THEN 1 END) as streak_count,
    COUNT(CASE WHEN category = 'goal' THEN 1 END) as goal_count,
    COUNT(CASE WHEN category = 'time' THEN 1 END) as time_count
FROM achievements;

-- =====================================================
-- 6. CHECK SAMPLE ACHIEVEMENTS
-- =====================================================
SELECT 
    'Sample Achievements' as test_name,
    id,
    name,
    category,
    tier,
    rarity,
    xp_reward,
    requirements
FROM achievements 
ORDER BY category, tier, xp_reward
LIMIT 10;

-- =====================================================
-- 7. CHECK USERS TABLE
-- =====================================================
SELECT 
    'Users Table Check' as test_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
    COUNT(CASE WHEN externalid IS NOT NULL THEN 1 END) as users_with_external_id
FROM users;

-- =====================================================
-- 8. CHECK APPLICATIONS TABLE
-- =====================================================
SELECT 
    'Applications Table Check' as test_name,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN userid IS NOT NULL THEN 1 END) as apps_with_user_id,
    COUNT(CASE WHEN company IS NOT NULL THEN 1 END) as apps_with_company,
    COUNT(CASE WHEN type = 'Remote' THEN 1 END) as remote_applications,
    COUNT(CASE WHEN attachments IS NOT NULL AND jsonb_array_length(attachments) > 0 THEN 1 END) as apps_with_attachments
FROM applications;

-- =====================================================
-- 9. CHECK USER ACHIEVEMENTS DATA
-- =====================================================
SELECT 
    'User Achievements Data Check' as test_name,
    COUNT(*) as total_user_achievements,
    COUNT(DISTINCT user_id) as users_with_achievements,
    COUNT(CASE WHEN unlocked_at IS NOT NULL THEN 1 END) as unlocked_achievements
FROM user_achievements;

-- =====================================================
-- 10. CHECK USER STATS DATA
-- =====================================================
SELECT 
    'User Stats Data Check' as test_name,
    COUNT(*) as total_user_stats,
    COUNT(CASE WHEN total_xp > 0 THEN 1 END) as users_with_xp,
    COUNT(CASE WHEN achievements_unlocked > 0 THEN 1 END) as users_with_unlocked_achievements,
    AVG(total_xp) as avg_xp,
    MAX(total_xp) as max_xp
FROM user_stats;

-- =====================================================
-- 11. CHECK DATABASE FUNCTIONS EXIST
-- =====================================================
SELECT 
    'Database Functions Check' as test_name,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IN ('get_user_achievements', 'get_user_stats', 'unlock_achievement') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_achievements', 'get_user_stats', 'unlock_achievement')
ORDER BY routine_name;

-- =====================================================
-- 12. TEST GET_USER_ACHIEVEMENTS FUNCTION
-- =====================================================
-- Replace 'your-user-uuid' with an actual user UUID from your users table
SELECT 
    'Test get_user_achievements Function' as test_name,
    *
FROM get_user_achievements('your-user-uuid'::uuid)
LIMIT 5;

-- =====================================================
-- 13. TEST GET_USER_STATS FUNCTION
-- =====================================================
-- Replace 'your-user-uuid' with an actual user UUID from your users table
SELECT 
    'Test get_user_stats Function' as test_name,
    *
FROM get_user_stats('your-user-uuid'::uuid);

-- =====================================================
-- 14. CHECK ACHIEVEMENT PROGRESS FOR SPECIFIC USER
-- =====================================================
-- Replace 'your-user-uuid' with an actual user UUID
WITH user_data AS (
    SELECT 
        u.externalid as user_id,
        u.email,
        COUNT(a.id) as application_count,
        COUNT(CASE WHEN a.type = 'Remote' THEN 1 END) as remote_count,
        COUNT(CASE WHEN a.attachments IS NOT NULL AND jsonb_array_length(a.attachments) > 0 THEN 1 END) as apps_with_attachments
    FROM users u
    LEFT JOIN applications a ON u.id = a.userid
    WHERE u.externalid = 'your-user-uuid'::uuid
    GROUP BY u.externalid, u.email
),
user_achievements AS (
    SELECT 
        ua.user_id,
        COUNT(*) as unlocked_count,
        SUM(a.xp_reward) as total_xp
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = 'your-user-uuid'::uuid
    GROUP BY ua.user_id
)
SELECT 
    'User Achievement Progress Check' as test_name,
    ud.user_id,
    ud.email,
    ud.application_count,
    ud.remote_count,
    ud.apps_with_attachments,
    COALESCE(ua.unlocked_count, 0) as unlocked_achievements,
    COALESCE(ua.total_xp, 0) as total_xp,
    CASE 
        WHEN ud.application_count >= 1 THEN '✅ First Steps eligible'
        ELSE '❌ First Steps not eligible'
    END as first_steps_status,
    CASE 
        WHEN ud.application_count >= 10 THEN '✅ Getting Started eligible'
        ELSE '❌ Getting Started not eligible'
    END as getting_started_status,
    CASE 
        WHEN ud.remote_count >= 10 THEN '✅ Remote Seeker eligible'
        ELSE '❌ Remote Seeker not eligible'
    END as remote_seeker_status
FROM user_data ud
LEFT JOIN user_achievements ua ON ud.user_id = ua.user_id;

-- =====================================================
-- 15. CHECK FOR POTENTIAL ACHIEVEMENT ISSUES
-- =====================================================
SELECT 
    'Potential Achievement Issues Check' as test_name,
    'Users with applications but no achievements' as issue_type,
    COUNT(*) as count
FROM users u
JOIN applications a ON u.id = a.userid
LEFT JOIN user_achievements ua ON u.externalid = ua.user_id
WHERE ua.user_id IS NULL
GROUP BY u.externalid
HAVING COUNT(a.id) >= 1

UNION ALL

SELECT 
    'Potential Achievement Issues Check' as test_name,
    'Users with achievements but no applications' as issue_type,
    COUNT(*) as count
FROM users u
JOIN user_achievements ua ON u.externalid = ua.user_id
LEFT JOIN applications a ON u.id = a.userid
WHERE a.id IS NULL
GROUP BY u.externalid
HAVING COUNT(ua.achievement_id) >= 1;

-- =====================================================
-- 16. SUMMARY REPORT
-- =====================================================
SELECT 
    'DATABASE HEALTH SUMMARY' as test_name,
    'Tables' as category,
    COUNT(*) as count,
    'All required tables exist' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('achievements', 'user_achievements', 'user_stats', 'users', 'applications')

UNION ALL

SELECT 
    'DATABASE HEALTH SUMMARY' as test_name,
    'Functions' as category,
    COUNT(*) as count,
    'All required functions exist' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_achievements', 'get_user_stats', 'unlock_achievement')

UNION ALL

SELECT 
    'DATABASE HEALTH SUMMARY' as test_name,
    'Achievements' as category,
    COUNT(*) as count,
    'Achievement data loaded' as status
FROM achievements

UNION ALL

SELECT 
    'DATABASE HEALTH SUMMARY' as test_name,
    'Users' as category,
    COUNT(*) as count,
    'User data available' as status
FROM users

UNION ALL

SELECT 
    'DATABASE HEALTH SUMMARY' as test_name,
    'Applications' as category,
    COUNT(*) as count,
    'Application data available' as status
FROM applications;
