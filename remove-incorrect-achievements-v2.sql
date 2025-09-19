-- Remove incorrectly unlocked achievements (using actual achievement names)
-- Run this in Supabase SQL Editor

-- Remove achievements that shouldn't be unlocked based on current application count
DELETE FROM user_achievements 
WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'  -- Your user ID
AND achievement_id IN (
    SELECT id FROM achievements 
    WHERE name IN (
        'Application Master',      -- Requires 100+ applications (you have 86)
        'Job Search Legend',       -- Requires 500+ applications (you have 86)
        'Legendary Job Seeker',    -- Requires 1000+ applications (you have 86)
        'Dedicated'                -- Requires 30-day streak (no streak data)
    )
);

-- Verify the removal
SELECT 
    'Remaining Achievements After Cleanup' as section,
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
