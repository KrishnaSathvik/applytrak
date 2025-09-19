-- Check exactly what's in user_stats table
-- See all records with full details

-- Show all user_stats records with full details
SELECT 
    'user_stats details' as table_name,
    user_id,
    total_xp,
    current_level,
    achievements_unlocked,
    last_updated
FROM user_stats
ORDER BY last_updated DESC;

-- Check if Krishna's record exists and what it shows
SELECT 
    'Krishna record' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM user_stats WHERE user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as status,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked
FROM user_stats us
WHERE us.user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5';

-- Check if the problematic record exists
SELECT 
    'Problematic record' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM user_stats WHERE user_id = '4485394f-5d84-4c2e-a77b-0f4bfc8b8a8c') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as status,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked
FROM user_stats us
WHERE us.user_id = '4485394f-5d84-4c2e-a77b-0f4bfc8b8a8c';

-- Show all user_ids in user_stats
SELECT 
    'All user_ids in user_stats' as check_type,
    user_id,
    total_xp,
    achievements_unlocked
FROM user_stats
ORDER BY total_xp DESC;

-- Count records by XP level to see if there are any high XP records
SELECT 
    'XP distribution' as check_type,
    CASE 
        WHEN total_xp = 0 THEN '0 XP'
        WHEN total_xp < 100 THEN '1-99 XP'
        WHEN total_xp < 500 THEN '100-499 XP'
        WHEN total_xp < 1000 THEN '500-999 XP'
        WHEN total_xp < 5000 THEN '1000-4999 XP'
        ELSE '5000+ XP'
    END as xp_range,
    COUNT(*) as record_count
FROM user_stats
GROUP BY 
    CASE 
        WHEN total_xp = 0 THEN '0 XP'
        WHEN total_xp < 100 THEN '1-99 XP'
        WHEN total_xp < 500 THEN '100-499 XP'
        WHEN total_xp < 1000 THEN '500-999 XP'
        WHEN total_xp < 5000 THEN '1000-4999 XP'
        ELSE '5000+ XP'
    END
ORDER BY MIN(total_xp);
