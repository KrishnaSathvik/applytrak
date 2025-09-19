-- =====================================================
-- CHECK KRISHNA'S UNLOCKED ACHIEVEMENTS AND XP
-- =====================================================

-- 1. Show all achievements Krishna has unlocked with details
SELECT 
    'KRISHNA UNLOCKED ACHIEVEMENTS' as test_name,
    ua.achievement_id,
    a.name,
    a.category,
    a.tier,
    a.rarity,
    a.xp_reward,
    ua.unlocked_at,
    'Individual achievement details' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.xp_reward DESC, a.name;

-- 2. Calculate XP by category
SELECT 
    'XP BY CATEGORY' as test_name,
    a.category,
    COUNT(*) as achievements_unlocked,
    SUM(a.xp_reward) as category_xp,
    'XP breakdown by category' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.category
ORDER BY category_xp DESC;

-- 3. Calculate XP by tier
SELECT 
    'XP BY TIER' as test_name,
    a.tier,
    COUNT(*) as achievements_unlocked,
    SUM(a.xp_reward) as tier_xp,
    'XP breakdown by tier' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.tier
ORDER BY tier_xp DESC;

-- 4. Total summary
SELECT 
    'KRISHNA SUMMARY' as test_name,
    COUNT(*) as total_achievements_unlocked,
    SUM(a.xp_reward) as total_xp,
    MIN(a.xp_reward) as min_xp,
    MAX(a.xp_reward) as max_xp,
    AVG(a.xp_reward) as avg_xp,
    'Complete summary of Krishna achievements' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 5. Show what achievements Krishna is missing
SELECT 
    'MISSING ACHIEVEMENTS' as test_name,
    a.id,
    a.name,
    a.category,
    a.tier,
    a.xp_reward,
    'Achievements Krishna has not unlocked yet' as note
FROM achievements a
WHERE a.id NOT IN (
    SELECT achievement_id 
    FROM user_achievements 
    WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
)
ORDER BY a.xp_reward DESC;

-- 6. Calculate level with new formula
SELECT 
    'LEVEL CALCULATION' as test_name,
    SUM(a.xp_reward) as total_xp,
    FLOOR(SQRT(SUM(a.xp_reward) / 50)) + 1 as calculated_level,
    'Level = FLOOR(SQRT(XP/50)) + 1' as formula,
    'New level calculation formula' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;
