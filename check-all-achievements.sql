-- =====================================================
-- CHECK ALL ACHIEVEMENTS IN DATABASE
-- =====================================================

-- Show all achievements with their XP values
SELECT 
    'ALL ACHIEVEMENTS' as test_name,
    id,
    name,
    description,
    category,
    tier,
    rarity,
    xp_reward,
    created_at
FROM achievements
ORDER BY category, tier, xp_reward DESC;

-- Count achievements by category
SELECT 
    'ACHIEVEMENTS BY CATEGORY' as test_name,
    category,
    COUNT(*) as total_count,
    SUM(xp_reward) as total_xp,
    STRING_AGG(name, ', ') as achievement_names
FROM achievements
GROUP BY category
ORDER BY total_xp DESC;

-- Count achievements by tier
SELECT 
    'ACHIEVEMENTS BY TIER' as test_name,
    tier,
    COUNT(*) as total_count,
    SUM(xp_reward) as total_xp,
    STRING_AGG(name, ', ') as achievement_names
FROM achievements
GROUP BY tier
ORDER BY total_xp DESC;

-- Total achievements summary
SELECT 
    'TOTAL ACHIEVEMENTS SUMMARY' as test_name,
    COUNT(*) as total_achievements,
    SUM(xp_reward) as total_possible_xp,
    MIN(xp_reward) as min_xp,
    MAX(xp_reward) as max_xp,
    AVG(xp_reward) as avg_xp
FROM achievements;
