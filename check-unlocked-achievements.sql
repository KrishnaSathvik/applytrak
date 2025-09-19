-- Check what achievements are currently unlocked in the database
-- Run this in Supabase SQL Editor

-- First, show user application counts (from applications table)
SELECT 
    'User Application Counts' as section,
    user_id,
    COUNT(*) as application_count
FROM applications
GROUP BY user_id
ORDER BY application_count DESC;

-- Show all unlocked achievements by user
SELECT 
    'Unlocked Achievements' as section,
    ua.user_id,
    a.name as achievement_name,
    a.category,
    a.tier,
    a.requirements,
    ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
ORDER BY ua.user_id, ua.unlocked_at;

-- Check for problematic achievements (should not be unlocked with current counts)
SELECT 
    'Problematic Achievements' as section,
    ua.user_id,
    app_counts.application_count,
    a.name as achievement_name,
    a.requirements,
    ua.unlocked_at,
    CASE 
        WHEN a.name = 'Application Master' AND app_counts.application_count < 100 THEN '❌ Should NOT be unlocked (< 100 apps)'
        WHEN a.name = 'Job Search Legend' AND app_counts.application_count < 500 THEN '❌ Should NOT be unlocked (< 500 apps)'
        WHEN a.name = 'Legendary Job Seeker' AND app_counts.application_count < 1000 THEN '❌ Should NOT be unlocked (< 1000 apps)'
        WHEN a.name IN ('Streak Master', 'Streak Legend') THEN '❌ Should NOT be unlocked (no streak data)'
        ELSE '✅ OK'
    END as status
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
JOIN (
    SELECT user_id, COUNT(*) as application_count
    FROM applications
    GROUP BY user_id
) app_counts ON ua.user_id = app_counts.user_id
WHERE a.name IN (
    'Application Master',
    'Job Search Legend', 
    'Legendary Job Seeker',
    'Streak Master',
    'Streak Legend'
)
ORDER BY app_counts.application_count DESC, a.name;
