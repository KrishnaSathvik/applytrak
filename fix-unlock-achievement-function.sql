-- Fix the unlock_achievement function to prevent duplicate counting
-- The current function increments achievements_unlocked even for already unlocked achievements

CREATE OR REPLACE FUNCTION unlock_achievement(user_uuid UUID, achievement_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    achievement_xp INTEGER;
    current_xp INTEGER;
    new_level INTEGER;
    achievement_already_unlocked BOOLEAN;
BEGIN
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

-- Also create a function to recalculate user stats from scratch
CREATE OR REPLACE FUNCTION recalculate_user_stats(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_xp_calculated INTEGER;
    achievements_count INTEGER;
    new_level INTEGER;
BEGIN
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

-- Recalculate stats for both users
SELECT recalculate_user_stats('c8e38372-50fa-49b5-a07d-5d00df292ec5');
SELECT recalculate_user_stats('4485394f-5d84-4c2e-a77b-0f4bfc8b8a8c');

-- Verify the fixes
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
LEFT JOIN user_achievements ua ON us.user_id = ua.user_id
GROUP BY us.user_id, u.email, us.total_xp, us.current_level, us.achievements_unlocked, us.last_updated
ORDER BY us.last_updated DESC;
