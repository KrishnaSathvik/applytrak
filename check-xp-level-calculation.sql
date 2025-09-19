-- =====================================================
-- CHECK XP AND LEVEL CALCULATION
-- =====================================================

-- 1. Check all achievements and their XP values
SELECT 
    'ALL ACHIEVEMENTS XP' as test_name,
    id,
    name,
    category,
    tier,
    xp_reward,
    'Total possible XP from this achievement' as note
FROM achievements
ORDER BY xp_reward DESC;

-- 2. Calculate total possible XP from all achievements
SELECT 
    'TOTAL POSSIBLE XP' as test_name,
    COUNT(*) as total_achievements,
    SUM(xp_reward) as total_possible_xp,
    MIN(xp_reward) as min_xp,
    MAX(xp_reward) as max_xp,
    AVG(xp_reward) as avg_xp
FROM achievements;

-- 3. Check krishna's actual unlocked achievements and their XP
SELECT 
    'KRISHNA UNLOCKED XP' as test_name,
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

-- 4. Calculate krishna's expected XP from unlocked achievements
SELECT 
    'KRISHNA EXPECTED XP' as test_name,
    COUNT(*) as unlocked_achievements,
    SUM(a.xp_reward) as expected_total_xp,
    'This should match the total_xp in user_stats' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 5. Check level calculation logic
SELECT 
    'LEVEL CALCULATION' as test_name,
    'Level calculation should be based on XP' as note,
    'Check if level 141 is correct for 14,010 XP' as question,
    'Typical leveling: Level = sqrt(XP/100) or similar formula' as suggestion;

-- 6. Check if there are any duplicate achievements or incorrect XP
SELECT 
    'POTENTIAL ISSUES' as test_name,
    'Check for duplicate achievements' as check_1,
    'Check for incorrect XP values' as check_2,
    'Check for achievement unlocking bugs' as check_3,
    'Check for XP calculation errors' as check_4;
