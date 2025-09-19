-- =====================================================
-- FIX DUPLICATE ACHIEVEMENTS AND XP CALCULATION
-- =====================================================

-- The problem: Krishna has 14,010 XP but max possible is only 2,325 XP
-- This means there are duplicate achievements or XP calculation bugs

-- 1. Find duplicate achievements for Krishna
SELECT 
    'DUPLICATE ACHIEVEMENTS' as test_name,
    ua.achievement_id,
    a.name,
    a.xp_reward,
    COUNT(*) as unlock_count,
    COUNT(*) * a.xp_reward as total_xp_from_duplicates,
    'This achievement was unlocked multiple times!' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY ua.achievement_id, a.name, a.xp_reward
HAVING COUNT(*) > 1
ORDER BY total_xp_from_duplicates DESC;

-- 2. Calculate total XP from duplicates
WITH duplicate_xp AS (
    SELECT 
        ua.achievement_id,
        a.name,
        a.xp_reward,
        COUNT(*) as unlock_count,
        COUNT(*) * a.xp_reward as total_xp_from_duplicates
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
    GROUP BY ua.achievement_id, a.name, a.xp_reward
    HAVING COUNT(*) > 1
)
SELECT 
    'TOTAL XP FROM DUPLICATES' as test_name,
    SUM(total_xp_from_duplicates) as total_duplicate_xp,
    'This is how much extra XP from duplicates' as note
FROM duplicate_xp;

-- 3. Show all of Krishna's achievements with counts
SELECT 
    'ALL KRISHNA ACHIEVEMENTS' as test_name,
    ua.achievement_id,
    a.name,
    a.category,
    a.tier,
    a.xp_reward,
    COUNT(*) as unlock_count,
    COUNT(*) * a.xp_reward as total_xp,
    MIN(ua.unlocked_at) as first_unlocked,
    MAX(ua.unlocked_at) as last_unlocked
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY ua.achievement_id, a.name, a.category, a.tier, a.xp_reward
ORDER BY total_xp DESC;

-- 4. Calculate what Krishna's XP should be (without duplicates)
SELECT 
    'KRISHNA CORRECT XP' as test_name,
    COUNT(DISTINCT ua.achievement_id) as unique_achievements,
    SUM(a.xp_reward) as correct_total_xp,
    'This should be Krishnas real XP' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
AND ua.id IN (
    SELECT DISTINCT ON (achievement_id) id
    FROM user_achievements 
    WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
    ORDER BY achievement_id, created_at ASC
);

-- 5. Fix: Remove duplicate achievements (keep only the first one)
-- WARNING: This will delete duplicate achievements!
DELETE FROM user_achievements 
WHERE id NOT IN (
    SELECT DISTINCT ON (achievement_id) id
    FROM user_achievements 
    WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
    ORDER BY achievement_id, created_at ASC
)
AND user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 6. Verify the fix
SELECT 
    'AFTER FIX - KRISHNA XP' as test_name,
    COUNT(*) as total_achievements,
    SUM(a.xp_reward) as total_xp,
    'This should be the correct XP now' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;
