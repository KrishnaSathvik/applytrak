-- =====================================================
-- MANUAL STREAK COLUMNS ADDITION
-- =====================================================
-- Run this in Supabase SQL Editor to add streak columns manually

-- 1. Add streak columns to user_metrics table (if it exists)
ALTER TABLE user_metrics 
ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_application_date DATE,
ADD COLUMN IF NOT EXISTS streak_start_date DATE;

-- 2. Create a simple streak calculation function
CREATE OR REPLACE FUNCTION calculate_daily_streak(user_id_param BIGINT)
RETURNS INTEGER AS $$
DECLARE
    app_dates DATE[];
    current_streak INTEGER := 0;
    i INTEGER;
    current_date DATE;
    prev_date DATE;
BEGIN
    -- Get all application dates for the user, sorted by date (most recent first)
    SELECT ARRAY_AGG(DISTINCT "dateApplied"::DATE ORDER BY "dateApplied"::DATE DESC)
    INTO app_dates
    FROM applications 
    WHERE userid = user_id_param;
    
    -- If no applications, return 0
    IF app_dates IS NULL OR array_length(app_dates, 1) = 0 THEN
        RETURN 0;
    END IF;
    
    -- Start with the most recent date
    current_date := app_dates[1];
    current_streak := 1;
    
    -- Count consecutive days backwards
    FOR i IN 2..array_length(app_dates, 1) LOOP
        prev_date := app_dates[i];
        
        -- Check if this date is exactly 1 day before the current date
        IF prev_date = (current_date - INTERVAL '1 day')::DATE THEN
            current_streak := current_streak + 1;
            current_date := prev_date;
        ELSE
            -- Streak broken
            EXIT;
        END IF;
    END LOOP;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- 3. Test the function with a specific user
-- Replace USER_ID with an actual user ID from your applications table
SELECT calculate_daily_streak(1); -- Replace 1 with actual user ID

-- 4. Update all users' daily streaks
UPDATE user_metrics 
SET daily_streak = calculate_daily_streak(userid)
WHERE userid IN (SELECT DISTINCT userid FROM applications);

-- 5. Check the results
SELECT 
    userid,
    daily_streak,
    applications_count,
    last_application_date
FROM user_metrics 
WHERE daily_streak > 0
ORDER BY daily_streak DESC;
