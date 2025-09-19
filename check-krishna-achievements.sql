-- =====================================================
-- CHECK KRISHNA'S SPECIFIC ACHIEVEMENTS AND XP
-- =====================================================
-- User: krishnasathvikm@gmail.com
-- UUID: 4485394f-5d84-4c2e-a77b-0f4bf34b302b

-- 1. Show all achievements krishna has unlocked
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
ORDER BY a.xp_reward DESC, a.tier, a.name;

-- 2. Count achievements by category
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

-- 3. Count achievements by tier
SELECT 
    'ACHIEVEMENTS BY TIER' as test_name,
    a.tier,
    COUNT(*) as unlocked_count,
    SUM(a.xp_reward) as tier_xp,
    STRING_AGG(a.name, ', ') as achievement_names
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
GROUP BY a.tier
ORDER BY tier_xp DESC;

-- 4. Total XP verification
SELECT 
    'TOTAL XP VERIFICATION' as test_name,
    COUNT(*) as total_achievements,
    SUM(a.xp_reward) as total_xp_calculated,
    MIN(a.xp_reward) as min_xp,
    MAX(a.xp_reward) as max_xp,
    AVG(a.xp_reward) as avg_xp
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 5. Show all available achievements vs unlocked
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

-- 6. Check if krishna should have more achievements based on 86 apps
SELECT 
    'ELIGIBILITY CHECK' as test_name,
    'Applications: 86' as metric,
    CASE 
        WHEN 86 >= 1 THEN '✅ First Steps (1+ apps)'
        ELSE '❌ First Steps'
    END as first_steps,
    CASE 
        WHEN 86 >= 10 THEN '✅ Getting Started (10+ apps)'
        ELSE '❌ Getting Started'
    END as getting_started,
    CASE 
        WHEN 86 >= 50 THEN '✅ Job Hunter (50+ apps)'
        ELSE '❌ Job Hunter'
    END as job_hunter,
    CASE 
        WHEN 86 >= 100 THEN '✅ Application Master (100+ apps)'
        ELSE '❌ Application Master'
    END as application_master,
    CASE 
        WHEN 86 >= 500 THEN '✅ Job Search Legend (500+ apps)'
        ELSE '❌ Job Search Legend'
    END as job_search_legend,
    CASE 
        WHEN 86 >= 1000 THEN '✅ Legendary Job Seeker (1000+ apps)'
        ELSE '❌ Legendary Job Seeker'
    END as legendary_job_seeker;
