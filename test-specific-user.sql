-- =====================================================
-- TEST SPECIFIC USER: krishnasathvikm@gmail.com (86 apps)
-- =====================================================
-- UUID: 4485394f-5d84-4c2e-a77b-0f4bf34b302b

-- 1. Check user data
SELECT 
    'USER DATA CHECK' as test_name,
    externalid as user_uuid,
    email,
    display_name,
    createdat,
    'User exists' as status
FROM users 
WHERE externalid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 2. Check user's applications
SELECT 
    'USER APPLICATIONS' as test_name,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN type = 'Remote' THEN 1 END) as remote_applications,
    COUNT(CASE WHEN attachments IS NOT NULL AND jsonb_array_length(attachments) > 0 THEN 1 END) as apps_with_attachments,
    COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as apps_with_notes
FROM applications a
JOIN users u ON a.userid = u.id
WHERE u.externalid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 3. Check user's current achievements
SELECT 
    'USER ACHIEVEMENTS' as test_name,
    COUNT(*) as unlocked_achievements,
    SUM(a.xp_reward) as total_xp,
    STRING_AGG(a.name, ', ') as achievement_names
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 4. Check user's stats
SELECT 
    'USER STATS' as test_name,
    total_xp,
    achievements_unlocked,
    current_level,
    daily_streak,
    longest_streak,
    last_application_date,
    streak_start_date,
    last_updated,
    created_at
FROM user_stats 
WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 5. Test streak calculation function
SELECT 
    'STREAK CALCULATION TEST' as test_name,
    daily_streak,
    longest_streak,
    last_application_date,
    streak_start_date
FROM calculate_user_streak('4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid);

-- 6. Test get_user_achievements function
SELECT 
    'FUNCTION TEST: get_user_achievements' as test_name,
    achievement_id,
    name,
    category,
    tier,
    rarity,
    xp_reward,
    is_unlocked,
    unlocked_at
FROM get_user_achievements('4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid)
ORDER BY category, tier, xp_reward;

-- 6. Test get_user_stats function
SELECT 
    'FUNCTION TEST: get_user_stats' as test_name,
    *
FROM get_user_stats('4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid);

-- 7. Check achievement eligibility based on current data
WITH user_data AS (
    SELECT 
        u.externalid as user_id,
        u.email,
        COUNT(a.id) as application_count,
        COUNT(CASE WHEN a.type = 'Remote' THEN 1 END) as remote_count,
        COUNT(CASE WHEN a.attachments IS NOT NULL AND jsonb_array_length(a.attachments) > 0 THEN 1 END) as apps_with_attachments,
        COUNT(CASE WHEN a.notes IS NOT NULL AND a.notes != '' THEN 1 END) as apps_with_notes
    FROM users u
    LEFT JOIN applications a ON u.id = a.userid
    WHERE u.externalid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
    GROUP BY u.externalid, u.email
)
SELECT 
    'ACHIEVEMENT ELIGIBILITY CHECK' as test_name,
    ud.user_id,
    ud.email,
    ud.application_count,
    ud.remote_count,
    ud.apps_with_attachments,
    ud.apps_with_notes,
    -- Check specific achievements
    CASE 
        WHEN ud.application_count >= 1 THEN '✅ ELIGIBLE'
        ELSE '❌ NOT ELIGIBLE'
    END as first_steps_status,
    CASE 
        WHEN ud.application_count >= 10 THEN '✅ ELIGIBLE'
        ELSE '❌ NOT ELIGIBLE'
    END as getting_started_status,
    CASE 
        WHEN ud.application_count >= 50 THEN '✅ ELIGIBLE'
        ELSE '❌ NOT ELIGIBLE'
    END as job_hunter_status,
    CASE 
        WHEN ud.remote_count >= 10 THEN '✅ ELIGIBLE'
        ELSE '❌ NOT ELIGIBLE'
    END as remote_seeker_status,
    CASE 
        WHEN ud.apps_with_attachments >= 10 THEN '✅ ELIGIBLE'
        ELSE '❌ NOT ELIGIBLE'
    END as resume_optimizer_status,
    CASE 
        WHEN ud.apps_with_notes >= 10 THEN '✅ ELIGIBLE'
        ELSE '❌ NOT ELIGIBLE'
    END as note_taker_status
FROM user_data ud;

-- 8. Check for missing achievements (should be unlocked but aren't)
WITH user_data AS (
    SELECT 
        u.externalid as user_id,
        COUNT(a.id) as application_count,
        COUNT(CASE WHEN a.type = 'Remote' THEN 1 END) as remote_count,
        COUNT(CASE WHEN a.attachments IS NOT NULL AND jsonb_array_length(a.attachments) > 0 THEN 1 END) as apps_with_attachments,
        COUNT(CASE WHEN a.notes IS NOT NULL AND a.notes != '' THEN 1 END) as apps_with_notes
    FROM users u
    LEFT JOIN applications a ON u.id = a.userid
    WHERE u.externalid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
    GROUP BY u.externalid
),
unlocked_achievements AS (
    SELECT achievement_id
    FROM user_achievements
    WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
)
SELECT 
    'MISSING ACHIEVEMENTS CHECK' as test_name,
    a.id,
    a.name,
    a.category,
    a.requirements,
    'Should be unlocked but is not' as issue
FROM achievements a
CROSS JOIN user_data ud
LEFT JOIN unlocked_achievements ua ON a.id = ua.achievement_id
WHERE ua.achievement_id IS NULL
AND (
    -- First Steps: 1 application
    (a.id = 'first_steps' AND ud.application_count >= 1)
    OR
    -- Getting Started: 10 applications
    (a.id = 'getting_started' AND ud.application_count >= 10)
    OR
    -- Job Hunter: 50 applications
    (a.id = 'job_hunter' AND ud.application_count >= 50)
    OR
    -- Remote Seeker: 10 remote applications
    (a.id = 'remote_seeker' AND ud.remote_count >= 10)
    OR
    -- Resume Optimizer: 10 applications with attachments
    (a.id = 'resume_optimizer' AND ud.apps_with_attachments >= 10)
    OR
    -- Note Taker: 10 applications with notes
    (a.id = 'note_taker' AND ud.apps_with_notes >= 10)
);

-- 9. Summary report for this user
SELECT 
    'USER SUMMARY REPORT' as test_name,
    'krishnasathvikm@gmail.com' as email,
    '4485394f-5d84-4c2e-a77b-0f4bf34b302b' as user_uuid,
    (SELECT COUNT(*) FROM applications a JOIN users u ON a.userid = u.id WHERE u.externalid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid) as total_applications,
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid) as unlocked_achievements,
    (SELECT COALESCE(SUM(a.xp_reward), 0) FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid) as total_xp,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_achievements WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid) > 0 
        THEN '✅ HAS ACHIEVEMENTS'
        ELSE '❌ NO ACHIEVEMENTS'
    END as achievement_status;
