-- Simple fix for Krishna's user_stats
-- Avoid complex joins that cause type casting issues

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

-- Clean up any orphaned data (delete records where user doesn't exist)
-- First check what orphaned data exists
SELECT 
    'Orphaned user_stats' as issue_type,
    us.user_id,
    us.total_xp,
    us.achievements_unlocked
FROM user_stats us
WHERE us.user_id NOT IN (
    SELECT id::uuid FROM users WHERE id IS NOT NULL
);

-- Delete orphaned user_stats (if any)
DELETE FROM user_stats 
WHERE user_id NOT IN (
    SELECT id::uuid FROM users WHERE id IS NOT NULL
);

-- Delete orphaned user_achievements (if any)
DELETE FROM user_achievements 
WHERE user_id NOT IN (
    SELECT id::uuid FROM users WHERE id IS NOT NULL
);

-- Final verification
SELECT 
    'Final user_stats' as data_type,
    COUNT(*) as total_records
FROM user_stats;
