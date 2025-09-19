-- Clean up orphaned data without type casting
-- Just delete records that we know are problematic

-- Check what's in user_stats
SELECT 
    'user_stats records' as table_name,
    user_id,
    total_xp,
    achievements_unlocked,
    current_level
FROM user_stats
ORDER BY last_updated DESC;

-- Check what's in user_achievements  
SELECT 
    'user_achievements records' as table_name,
    user_id,
    COUNT(*) as achievement_count
FROM user_achievements
GROUP BY user_id
ORDER BY achievement_count DESC;

-- Delete the problematic record with the high XP (if it exists)
-- This is the record showing 14,010 XP and 104 achievements
DELETE FROM user_stats 
WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bfc8b8a8c';

-- Delete any user_achievements for that same user
DELETE FROM user_achievements 
WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bfc8b8a8c';

-- Verify cleanup
SELECT 
    'After cleanup - user_stats' as table_name,
    COUNT(*) as record_count
FROM user_stats;

SELECT 
    'After cleanup - user_achievements' as table_name,
    COUNT(*) as record_count
FROM user_achievements;

-- Show final state
SELECT 
    'Final user_stats' as table_name,
    user_id,
    total_xp,
    achievements_unlocked,
    current_level,
    last_updated
FROM user_stats
ORDER BY last_updated DESC;
