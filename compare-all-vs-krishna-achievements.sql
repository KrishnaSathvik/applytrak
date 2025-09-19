-- =====================================================
-- COMPARE ALL ACHIEVEMENTS VS KRISHNA'S UNLOCKED
-- =====================================================

-- 1. All achievements in database with unlock status for Krishna
SELECT 
    a.id,
    a.name,
    a.category,
    a.tier,
    a.rarity,
    a.xp_reward,
    CASE 
        WHEN ua.user_id IS NOT NULL THEN 'UNLOCKED'
        ELSE 'LOCKED'
    END as krishna_status,
    ua.unlocked_at,
    'All achievements with Krishna unlock status' as note
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
    AND ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.xp_reward DESC, a.name;

-- 2. Summary by category - All vs Krishna
SELECT 
    a.category,
    COUNT(*) as total_achievements,
    COUNT(ua.user_id) as krishna_unlocked,
    COUNT(*) - COUNT(ua.user_id) as krishna_locked,
    SUM(a.xp_reward) as total_category_xp,
    COALESCE(SUM(CASE WHEN ua.user_id IS NOT NULL THEN a.xp_reward ELSE 0 END), 0) as krishna_category_xp,
    ROUND((COUNT(ua.user_id)::numeric / COUNT(*) * 100), 1) as krishna_completion_percentage
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
    AND ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.category
ORDER BY krishna_completion_percentage DESC;

-- 3. Summary by tier - All vs Krishna
SELECT 
    a.tier,
    COUNT(*) as total_achievements,
    COUNT(ua.user_id) as krishna_unlocked,
    COUNT(*) - COUNT(ua.user_id) as krishna_locked,
    SUM(a.xp_reward) as total_tier_xp,
    COALESCE(SUM(CASE WHEN ua.user_id IS NOT NULL THEN a.xp_reward ELSE 0 END), 0) as krishna_tier_xp,
    ROUND((COUNT(ua.user_id)::numeric / COUNT(*) * 100), 1) as krishna_completion_percentage
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
    AND ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.tier
ORDER BY krishna_completion_percentage DESC;

-- 4. Overall summary
SELECT 
    'OVERALL SUMMARY' as summary_type,
    COUNT(*) as total_achievements,
    COUNT(ua.user_id) as krishna_unlocked,
    COUNT(*) - COUNT(ua.user_id) as krishna_locked,
    SUM(a.xp_reward) as total_possible_xp,
    COALESCE(SUM(CASE WHEN ua.user_id IS NOT NULL THEN a.xp_reward ELSE 0 END), 0) as krishna_total_xp,
    ROUND((COUNT(ua.user_id)::numeric / COUNT(*) * 100), 1) as krishna_completion_percentage,
    'Complete comparison summary' as note
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
    AND ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 5. Krishna's missing achievements (highest XP first)
SELECT 
    'MISSING ACHIEVEMENTS' as status,
    a.name,
    a.category,
    a.tier,
    a.xp_reward,
    'Achievements Krishna has not unlocked yet' as note
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
    AND ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
WHERE ua.user_id IS NULL
ORDER BY a.xp_reward DESC, a.name;
