-- =====================================================
-- KRISHNA'S ACHIEVEMENTS BREAKDOWN
-- =====================================================

-- 1. Show all achievements Krishna has unlocked with details
SELECT 
    a.name,
    a.category,
    a.tier,
    a.xp_reward,
    ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.xp_reward DESC, a.name;

-- 2. XP breakdown by category
SELECT 
    a.category,
    COUNT(*) as achievements_unlocked,
    SUM(a.xp_reward) as category_xp
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.category
ORDER BY category_xp DESC;

-- 3. XP breakdown by tier
SELECT 
    a.tier,
    COUNT(*) as achievements_unlocked,
    SUM(a.xp_reward) as tier_xp
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.tier
ORDER BY tier_xp DESC;
