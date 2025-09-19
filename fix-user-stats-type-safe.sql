-- Fix user_stats with proper type casting
-- Handle UUID vs BIGINT mismatch between tables

-- First, let's check the data types
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'user_stats', 'user_achievements')
AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;

-- Check which users exist in each table (with proper casting)
SELECT 'Users in users table' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Users in user_stats table' as table_name, COUNT(*) as count FROM user_stats
UNION ALL
SELECT 'Users in user_achievements table' as table_name, COUNT(*) as count FROM user_achievements;

-- Check for orphaned data with proper type casting
SELECT 
    'Orphaned user_stats' as issue_type,
    us.user_id::text,
    us.total_xp,
    us.achievements_unlocked,
    us.current_level
FROM user_stats us
LEFT JOIN users u ON us.user_id::text = u.id::text
WHERE u.id IS NULL;

SELECT 
    'Orphaned user_achievements' as issue_type,
    ua.user_id::text,
    COUNT(*) as achievement_count
FROM user_achievements ua
LEFT JOIN users u ON ua.user_id::text = u.id::text
WHERE u.id IS NULL
GROUP BY ua.user_id;

-- Check Krishna's actual data (assuming Krishna's user_id is the UUID)
SELECT 
    'Krishna actual achievements' as check_type,
    COUNT(*) as unlocked_count,
    SUM(a.xp_reward) as total_xp
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'c8e38372-50fa-49b5-a07d-5d00df292ec5';

-- Clean up orphaned data first (with proper casting)
DELETE FROM user_stats 
WHERE user_id::text NOT IN (SELECT id::text FROM users);

DELETE FROM user_achievements 
WHERE user_id::text NOT IN (SELECT id::text FROM users);

-- Create a safe recalculate function with proper type handling
CREATE OR REPLACE FUNCTION recalculate_user_stats_type_safe(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_xp_calculated INTEGER;
    achievements_count INTEGER;
    new_level INTEGER;
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists (with proper casting)
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE id::text = user_uuid::text
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'User % does not exist in users table, skipping', user_uuid;
        RETURN FALSE;
    END IF;
    
    -- Calculate actual XP and achievement count from user_achievements
    SELECT 
        COALESCE(SUM(a.xp_reward), 0),
        COUNT(*)
    INTO total_xp_calculated, achievements_count
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = user_uuid;
    
    -- Calculate level (100 XP per level)
    new_level := FLOOR(total_xp_calculated / 100) + 1;
    
    -- Update user_stats with correct values
    INSERT INTO user_stats (user_id, total_xp, achievements_unlocked, current_level)
    VALUES (user_uuid, total_xp_calculated, achievements_count, new_level)
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = total_xp_calculated,
        achievements_unlocked = achievements_count,
        current_level = new_level,
        last_updated = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate stats for Krishna only (the valid user)
SELECT recalculate_user_stats_type_safe('c8e38372-50fa-49b5-a07d-5d00df292ec5');

-- Verify the fix with proper type casting
SELECT 
    us.user_id::text as user_id,
    u.email,
    us.total_xp,
    us.current_level,
    us.achievements_unlocked,
    us.last_updated,
    COUNT(ua.achievement_id) as actual_unlocked_count
FROM user_stats us
LEFT JOIN users u ON us.user_id::text = u.id::text
LEFT JOIN user_achievements ua ON us.user_id = ua.user_id
GROUP BY us.user_id, u.email, us.total_xp, us.current_level, us.achievements_unlocked, us.last_updated
ORDER BY us.last_updated DESC;
