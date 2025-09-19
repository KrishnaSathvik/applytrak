-- =====================================================
-- KRISHNA'S UNLOCKED ACHIEVEMENT NAMES
-- =====================================================

-- Show all achievements Krishna has unlocked with names and details
SELECT 
    a.name as achievement_name,
    a.category,
    a.tier,
    a.rarity,
    a.xp_reward,
    ua.unlocked_at,
    'Achievement unlocked by Krishna' as note
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.xp_reward DESC, a.name;

-- Summary by category
SELECT 
    a.category,
    COUNT(*) as achievements_count,
    STRING_AGG(a.name, ', ') as achievement_names,
    SUM(a.xp_reward) as category_xp
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.category
ORDER BY category_xp DESC;
