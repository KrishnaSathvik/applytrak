-- =====================================================
-- TEST KRISHNA'S ACHIEVEMENTS (CORRECT SCHEMA)
-- =====================================================
-- User: krishnasathvikm@gmail.com
-- UUID: 4485394f-5d84-4c2e-a77b-0f4bf34b302b

-- 1. Check krishna's current user stats
SELECT 
    'KRISHNA USER STATS' as test_name,
    us.id,
    us.user_id,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked,
    us.daily_streak,
    us.longest_streak,
    us.last_application_date,
    us.streak_start_date,
    us.last_updated,
    us.created_at
FROM user_stats us
WHERE us.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 2. Check krishna's unlocked achievements
SELECT 
    'KRISHNA UNLOCKED ACHIEVEMENTS' as test_name,
    a.id as achievement_id,
    a.name,
    a.description,
    a.category,
    a.tier,
    a.rarity,
    a.xp_reward,
    ua.unlocked_at,
    '✅ UNLOCKED' as status
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.category, a.xp_reward DESC;

-- 3. Count krishna's achievements by category
SELECT 
    'ACHIEVEMENTS BY CATEGORY' as test_name,
    a.category,
    COUNT(*) as unlocked_count,
    SUM(a.xp_reward) as category_xp,
    STRING_AGG(a.name, ', ') as achievement_names
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.category
ORDER BY category_xp DESC;

-- 4. Check what achievements exist vs what krishna has
SELECT 
    'ALL ACHIEVEMENTS STATUS' as test_name,
    a.id,
    a.name,
    a.category,
    a.tier,
    a.xp_reward,
    CASE 
        WHEN ua.user_id IS NOT NULL THEN '✅ UNLOCKED'
        ELSE '❌ LOCKED'
    END as status,
    ua.unlocked_at
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
    AND ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.category, a.tier, a.xp_reward DESC;

-- 5. Summary of krishna's achievement progress
SELECT 
    'ACHIEVEMENT SUMMARY' as test_name,
    'Krishna has:' as summary,
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid) as unlocked_achievements,
    (SELECT COUNT(*) FROM achievements) as total_achievements,
    (SELECT total_xp FROM user_stats WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid) as total_xp,
    (SELECT current_level FROM user_stats WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid) as current_level,
    (SELECT daily_streak FROM user_stats WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid) as daily_streak;
