-- =====================================================
-- FIX XP AND LEVEL CALCULATION ISSUE
-- =====================================================

-- The problem: Level calculation is wrong!
-- Current formula: level = Math.floor(totalXP / 100) + 1
-- With 14,010 XP: level = Math.floor(14010 / 100) + 1 = 140 + 1 = 141

-- This is WRONG! Let's check what the actual XP should be:

-- 1. Check krishna's actual unlocked achievements and their XP
SELECT 
    'KRISHNA ACTUAL UNLOCKED' as test_name,
    a.id,
    a.name,
    a.category,
    a.tier,
    a.xp_reward,
    ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.xp_reward DESC;

-- 2. Calculate what krishna's XP should actually be
SELECT 
    'KRISHNA CORRECT XP' as test_name,
    COUNT(*) as unlocked_achievements,
    SUM(a.xp_reward) as correct_total_xp,
    'This should be the real XP amount' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 3. Check if there are duplicate achievements (same achievement unlocked multiple times)
SELECT 
    'DUPLICATE CHECK' as test_name,
    achievement_id,
    COUNT(*) as unlock_count,
    'If count > 1, there are duplicates!' as note
FROM user_achievements 
WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY achievement_id
HAVING COUNT(*) > 1;

-- 4. Check all achievements and their XP values to see if any have wrong XP
SELECT 
    'ALL ACHIEVEMENTS XP' as test_name,
    id,
    name,
    category,
    tier,
    xp_reward,
    CASE 
        WHEN xp_reward > 1000 THEN 'SUSPICIOUSLY HIGH XP!'
        WHEN xp_reward > 500 THEN 'Very high XP'
        WHEN xp_reward > 100 THEN 'High XP'
        ELSE 'Normal XP'
    END as xp_status
FROM achievements
ORDER BY xp_reward DESC;

-- 5. Calculate total possible XP from all achievements
SELECT 
    'TOTAL POSSIBLE XP' as test_name,
    COUNT(*) as total_achievements,
    SUM(xp_reward) as total_possible_xp,
    'This is the maximum XP anyone can get' as note
FROM achievements;
