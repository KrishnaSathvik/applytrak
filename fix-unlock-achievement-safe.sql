-- Safe fix for the unlock_achievement function
-- This version checks if user exists and prevents duplicate counting

CREATE OR REPLACE FUNCTION unlock_achievement(user_uuid UUID, achievement_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    achievement_xp INTEGER;
    current_xp INTEGER;
    new_level INTEGER;
    achievement_already_unlocked BOOLEAN;
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = user_uuid) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'User % does not exist in users table', user_uuid;
        RETURN FALSE;
    END IF;
    
    -- Check if achievement exists
    IF NOT EXISTS(SELECT 1 FROM achievements WHERE id = achievement_id_param) THEN
        RAISE NOTICE 'Achievement % does not exist', achievement_id_param;
        RETURN FALSE;
    END IF;
    
    -- Check if achievement is already unlocked
    SELECT EXISTS(
        SELECT 1 FROM user_achievements 
        WHERE user_id = user_uuid AND achievement_id = achievement_id_param
    ) INTO achievement_already_unlocked;
    
    -- If already unlocked, return true but don't update stats
    IF achievement_already_unlocked THEN
        RETURN TRUE;
    END IF;
    
    -- Get achievement XP reward
    SELECT xp_reward INTO achievement_xp FROM achievements WHERE id = achievement_id_param;
    
    -- Insert user achievement (ignore if already exists)
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (user_uuid, achievement_id_param)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Update user stats (only if achievement wasn't already unlocked)
    INSERT INTO user_stats (user_id, total_xp, achievements_unlocked, current_level)
    VALUES (user_uuid, achievement_xp, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = user_stats.total_xp + achievement_xp,
        achievements_unlocked = user_stats.achievements_unlocked + 1,
        last_updated = NOW();
    
    -- Calculate new level based on total XP
    SELECT total_xp INTO current_xp FROM user_stats WHERE user_id = user_uuid;
    new_level := FLOOR(current_xp / 100) + 1; -- 100 XP per level
    
    UPDATE user_stats SET current_level = new_level WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with Krishna's user ID
SELECT unlock_achievement('c8e38372-50fa-49b5-a07d-5d00df292ec5', 'first_application');
