-- Final fix for Krishna's user_stats
-- No type casting - just fix the data directly

-- First, let's see Krishna's current data
SELECT 
    'Current user_stats' as data_type,
    us.user_id,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked,
    us.last_updated
FROM user_stats us
WHERE us.user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5';

-- Check Krishna's actual achievements
SELECT 
    'Actual achievements' as data_type,
    COUNT(*) as unlocked_count,
    SUM(a.xp_reward) as total_xp
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5';

-- List Krishna's unlocked achievements
SELECT 
    a.name,
    a.xp_reward,
    ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5'
ORDER BY ua.unlocked_at;

-- Fix Krishna's user_stats with correct values
UPDATE user_stats 
SET 
    total_xp = 500,
    current_level = 4,
    achievements_unlocked = 11,
    last_updated = NOW()
WHERE user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5';

-- Verify the fix
SELECT 
    'Fixed user_stats' as data_type,
    us.user_id,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked,
    us.last_updated
FROM user_stats us
WHERE us.user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5';

-- Check what other user_stats records exist
SELECT 
    'All user_stats records' as data_type,
    us.user_id,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked
FROM user_stats us
ORDER BY us.last_updated DESC;

-- If there are other corrupted records, we can delete them manually
-- But let's first see what we have
SELECT 
    'Total user_stats records' as data_type,
    COUNT(*) as count
FROM user_stats;
