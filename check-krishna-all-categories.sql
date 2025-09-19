-- =====================================================
-- CHECK KRISHNA'S ACHIEVEMENTS BY ALL CATEGORIES
-- =====================================================
-- User: krishnasathvikm@gmail.com
-- UUID: 4485394f-5d84-4c2e-a77b-0f4bf34b302b

-- 1. Show all achievements krishna has unlocked with categories
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
    'Unlocked' as status
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.category, a.xp_reward DESC;

-- 2. Count achievements by category (unlocked vs total)
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

-- 3. Show what achievements exist in each category
SELECT 
    'ALL ACHIEVEMENTS BY CATEGORY' as test_name,
    a.category,
    a.name,
    a.description,
    a.tier,
    a.xp_reward,
    CASE 
        WHEN ua.user_id IS NOT NULL THEN '✅ UNLOCKED'
        ELSE '❌ LOCKED'
    END as status
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
    AND ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.category, a.tier, a.xp_reward DESC;

-- 4. Check what krishna should have based on his data
SELECT 
    'EXPECTED ACHIEVEMENTS' as test_name,
    'Based on 86 applications' as metric,
    'Should have:' as expected,
    'First Steps, Getting Started, Job Hunter' as milestone_achievements,
    'Profile completion, Time streaks, Quality achievements' as other_achievements,
    'Total: ~11 achievements with ~500 XP' as summary;
