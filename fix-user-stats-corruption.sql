-- Fix corrupted user_stats data
-- The user_stats table shows incorrect XP and level data

-- First, let's see what we have
SELECT 
    us.user_id,
    u.email,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked,
    us.last_updated,
    COUNT(ua.achievement_id) as actual_unlocked_count
FROM user_stats us
LEFT JOIN users u ON us.user_id = u.id
LEFT JOIN user_achievements ua ON us.user_id = ua.user_id AND ua.unlocked_at IS NOT NULL
GROUP BY us.user_id, u.email, us.total_xp, us.current_level, us.achievements_unlocked, us.last_updated
ORDER BY us.last_updated DESC;

-- Check Krishna's actual achievements
SELECT 
    'Krishna Actual Achievements' as check_type,
    COUNT(*) as unlocked_count,
    SUM(a.xp_reward) as total_xp
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5' 
AND ua.unlocked_at IS NOT NULL;

-- Check the other user's actual achievements  
SELECT 
    'Other User Actual Achievements' as check_type,
    COUNT(*) as unlocked_count,
    SUM(a.xp_reward) as total_xp
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bfc8b8a8c'
AND ua.unlocked_at IS NOT NULL;

-- Fix Krishna's user_stats (should be 11 achievements, 500 XP, level 4)
UPDATE user_stats 
SET 
    total_xp = 500,
    current_level = 4,
    achievements_unlocked = 11,
    last_updated = NOW()
WHERE user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5';

-- Fix the other user's user_stats (should be 0 achievements, 0 XP, level 1)
UPDATE user_stats 
SET 
    total_xp = 0,
    current_level = 1,
    achievements_unlocked = 0,
    last_updated = NOW()
WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bfc8b8a8c';

-- Verify the fixes
SELECT 
    us.user_id,
    u.email,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked,
    us.last_updated
FROM user_stats us
LEFT JOIN users u ON us.user_id = u.id
ORDER BY us.last_updated DESC;
