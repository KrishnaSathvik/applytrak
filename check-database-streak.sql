-- =====================================================
-- DATABASE STREAK DIAGNOSTIC QUERIES
-- =====================================================
-- Run these queries in the Supabase SQL Editor to diagnose streak issues

-- 1. Check if user_metrics table exists and has streak columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_metrics' 
    AND column_name IN ('daily_streak', 'longest_streak', 'last_application_date', 'streak_start_date')
ORDER BY table_name, column_name;

-- 2. Check all tables in the database
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Check if applications table exists and has data
SELECT 
    COUNT(*) as total_applications,
    COUNT(DISTINCT userid) as unique_users,
    MIN("dateApplied") as earliest_application,
    MAX("dateApplied") as latest_application
FROM applications;

-- 4. Check user_metrics table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_metrics'
ORDER BY ordinal_position;

-- 5. Check if streak functions exist
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%streak%'
    AND routine_schema = 'public';

-- 6. Check current user_metrics data (if table exists)
SELECT 
    userid,
    daily_streak,
    longest_streak,
    last_application_date,
    streak_start_date,
    applications_count
FROM user_metrics 
LIMIT 10;

-- 7. Check applications by user to see if we have data to calculate streaks
SELECT 
    userid,
    COUNT(*) as application_count,
    MIN("dateApplied") as first_application,
    MAX("dateApplied") as last_application,
    ARRAY_AGG(DISTINCT "dateApplied" ORDER BY "dateApplied" DESC) as application_dates
FROM applications 
GROUP BY userid 
ORDER BY application_count DESC
LIMIT 5;

-- 8. Test streak calculation manually for a specific user
-- Replace 'USER_ID_HERE' with an actual user ID from the applications table
WITH user_apps AS (
    SELECT DISTINCT "dateApplied"::DATE as app_date
    FROM applications 
    WHERE userid = (SELECT userid FROM applications LIMIT 1) -- Replace with actual user ID
    ORDER BY app_date DESC
),
streak_calc AS (
    SELECT 
        app_date,
        LAG(app_date) OVER (ORDER BY app_date DESC) as prev_date,
        CASE 
            WHEN LAG(app_date) OVER (ORDER BY app_date DESC) = app_date + INTERVAL '1 day' 
            THEN 1 
            ELSE 0 
        END as is_consecutive
    FROM user_apps
)
SELECT 
    app_date,
    prev_date,
    is_consecutive,
    SUM(is_consecutive) OVER (ORDER BY app_date DESC) + 1 as current_streak
FROM streak_calc
ORDER BY app_date DESC
LIMIT 10;
