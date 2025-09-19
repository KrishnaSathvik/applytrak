-- =====================================================
-- ADD STREAK COLUMNS TO USER_METRICS TABLE
-- =====================================================
-- This migration adds streak tracking columns to the user_metrics table
-- to support streak-based achievements

-- 1. Add streak columns to user_metrics table
ALTER TABLE user_metrics 
ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_application_date DATE,
ADD COLUMN IF NOT EXISTS streak_start_date DATE;

-- 2. Create function to calculate and update user streak
CREATE OR REPLACE FUNCTION calculate_user_streak(user_id_param BIGINT)
RETURNS TABLE(
    daily_streak INTEGER,
    longest_streak INTEGER,
    last_application_date DATE,
    streak_start_date DATE
) AS $$
DECLARE
    app_dates DATE[];
    current_streak INTEGER := 0;
    max_streak INTEGER := 0;
    temp_streak INTEGER := 0;
    last_app_date DATE;
    streak_start DATE;
    i INTEGER;
    prev_date DATE;
BEGIN
    -- Get all application dates for the user, sorted by date (most recent first)
    SELECT ARRAY_AGG(DISTINCT "dateApplied"::DATE ORDER BY "dateApplied"::DATE DESC)
    INTO app_dates
    FROM applications 
    WHERE userid = user_id_param;
    
    -- If no applications, return zeros
    IF app_dates IS NULL OR array_length(app_dates, 1) = 0 THEN
        RETURN QUERY SELECT 0, 0, NULL::DATE, NULL::DATE;
        RETURN;
    END IF;
    
    last_app_date := app_dates[1];
    
    -- Calculate current streak (consecutive days from most recent application)
    current_streak := 1;
    streak_start := last_app_date;
    
    FOR i IN 2..array_length(app_dates, 1) LOOP
        prev_date := app_dates[i];
        
        -- Check if this date is exactly 1 day before the previous date
        IF prev_date = (last_app_date - INTERVAL '1 day')::DATE THEN
            current_streak := current_streak + 1;
            streak_start := prev_date;
        ELSE
            -- Streak broken, start counting from this date
            current_streak := 1;
            streak_start := prev_date;
        END IF;
        
        last_app_date := prev_date;
    END LOOP;
    
    -- Calculate longest streak
    temp_streak := 1;
    max_streak := 1;
    
    FOR i IN 2..array_length(app_dates, 1) LOOP
        IF app_dates[i] = (app_dates[i-1] - INTERVAL '1 day')::DATE THEN
            temp_streak := temp_streak + 1;
            max_streak := GREATEST(max_streak, temp_streak);
        ELSE
            temp_streak := 1;
        END IF;
    END LOOP;
    
    -- Update user_metrics with calculated values
    INSERT INTO user_metrics (userid, daily_streak, longest_streak, last_application_date, streak_start_date)
    VALUES (user_id_param, current_streak, max_streak, last_app_date, streak_start)
    ON CONFLICT (userid) 
    DO UPDATE SET 
        daily_streak = EXCLUDED.daily_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_application_date = EXCLUDED.last_application_date,
        streak_start_date = EXCLUDED.streak_start_date,
        updated_at = NOW();
    
    -- Return the calculated values
    RETURN QUERY SELECT current_streak, max_streak, last_app_date, streak_start;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to update streak for all users
CREATE OR REPLACE FUNCTION update_all_user_streaks()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through all users and update their streaks
    FOR user_record IN 
        SELECT id FROM users
    LOOP
        PERFORM calculate_user_streak(user_record.id);
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically update streak when applications are added/updated
CREATE OR REPLACE FUNCTION update_user_streak_trigger()
RETURNS TRIGGER AS $$
DECLARE
    user_id_param BIGINT;
BEGIN
    -- Get the user ID from the application
    user_id_param := COALESCE(NEW.userid, OLD.userid);
    
    -- Update the user's streak
    PERFORM calculate_user_streak(user_id_param);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for applications table
DROP TRIGGER IF EXISTS update_streak_on_application_change ON applications;
CREATE TRIGGER update_streak_on_application_change
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak_trigger();

-- 5. Update existing users' streaks
SELECT update_all_user_streaks();

-- 6. Add comments
COMMENT ON COLUMN user_metrics.daily_streak IS 'Current consecutive days of applications';
COMMENT ON COLUMN user_metrics.longest_streak IS 'Longest consecutive days of applications ever achieved';
COMMENT ON COLUMN user_metrics.last_application_date IS 'Date of most recent application';
COMMENT ON COLUMN user_metrics.streak_start_date IS 'Date when current streak started';

COMMENT ON FUNCTION calculate_user_streak(BIGINT) IS 'Calculate and update streak data for a user';
COMMENT ON FUNCTION update_all_user_streaks() IS 'Update streak data for all users';
COMMENT ON FUNCTION update_user_streak_trigger() IS 'Trigger function to update streak when applications change';
