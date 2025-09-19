-- Delete any user_stats records with suspiciously high XP
-- This will clean up any corrupted data

-- First, show what we're about to delete
SELECT 
    'Records to be deleted' as action,
    user_id,
    total_xp,
    current_level,
    achievements_unlocked,
    last_updated
FROM user_stats
WHERE total_xp > 1000 OR achievements_unlocked > 20
ORDER BY total_xp DESC;

-- Delete records with suspiciously high XP or achievement counts
DELETE FROM user_stats 
WHERE total_xp > 1000 OR achievements_unlocked > 20;

-- Show what's left
SELECT 
    'Remaining records' as action,
    user_id,
    total_xp,
    current_level,
    achievements_unlocked,
    last_updated
FROM user_stats
ORDER BY last_updated DESC;

-- Count remaining records
SELECT 
    'Final count' as action,
    COUNT(*) as record_count
FROM user_stats;

-- If Krishna's record was deleted, recreate it with correct values
INSERT INTO user_stats (user_id, total_xp, achievements_unlocked, current_level, last_updated)
SELECT 
    'c8e38372-50fa-49b5-a07d-5d00df292ec5',
    500,
    11,
    4,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM user_stats 
    WHERE user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5'
);

-- Final verification
SELECT 
    'Final state' as action,
    user_id,
    total_xp,
    current_level,
    achievements_unlocked,
    last_updated
FROM user_stats
ORDER BY last_updated DESC;
