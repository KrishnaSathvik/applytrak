-- Remove incorrectly unlocked achievements
-- Run this in Supabase SQL Editor

-- Remove achievements that shouldn't be unlocked based on current application count
DELETE FROM user_achievements 
WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'  -- Your user ID
AND achievement_id IN (
    'application-master',      -- Requires 100+ applications (you have 86)
    'job-search-legend',       -- Requires 500+ applications (you have 86)
    'legendary-job-seeker'     -- Requires 1000+ applications (you have 86)
);

-- Verify the removal
SELECT 
    'Remaining Achievements' as section,
    ua.user_id,
    u.email,
    a.name as achievement_name,
    a.category,
    a.tier,
    a.requirements,
    ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
JOIN users u ON ua.user_id = u.externalid
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'
ORDER BY ua.unlocked_at;
