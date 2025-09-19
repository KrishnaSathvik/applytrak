-- Enable Email Scheduling for ApplyTrak
-- This script sets up automated email triggers using pg_cron

-- First, check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If not enabled, enable it (requires superuser privileges)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Check current timezone
SELECT current_setting('timezone');

-- =====================================================
-- 1. WEEKLY GOALS EMAIL (Sundays 9 AM UTC)
-- =====================================================
-- Remove existing schedule if it exists
SELECT cron.unschedule('weekly-goals-email');

-- Create function to send weekly goals emails
CREATE OR REPLACE FUNCTION send_weekly_goals_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    response jsonb;
BEGIN
    -- Get all users who have weekly goals emails enabled
    FOR user_record IN 
        SELECT u.id, u.email, u.display_name, u.externalid
        FROM users u
        JOIN email_preferences ep ON u.id = ep.userid
        WHERE ep.weekly_goals = true
        AND u.email IS NOT NULL
        AND u.email != ''
    LOOP
        -- Call the weekly goals email function
        SELECT net.http_post(
            url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/weekly-goals-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'email', user_record.email,
                'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1))
            )
        ) INTO response;
        
        RAISE NOTICE 'Weekly goals email sent to %: %', user_record.email, response;
    END LOOP;
END;
$$;

-- Schedule weekly goals emails every Sunday at 9 AM UTC
SELECT cron.schedule(
    'weekly-goals-email',
    '0 9 * * 0', -- Every Sunday at 9 AM UTC
    'SELECT send_weekly_goals_emails();'
);

-- =====================================================
-- 2. WEEKLY TIPS EMAIL (Wednesdays 10 AM UTC)
-- =====================================================
-- Remove existing schedule if it exists
SELECT cron.unschedule('weekly-tips-email');

-- Create function to send weekly tips emails
CREATE OR REPLACE FUNCTION send_weekly_tips_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    response jsonb;
BEGIN
    -- Get all users who have weekly tips emails enabled
    FOR user_record IN 
        SELECT u.id, u.email, u.display_name, u.externalid
        FROM users u
        JOIN email_preferences ep ON u.id = ep.userid
        WHERE ep.weekly_tips = true
        AND u.email IS NOT NULL
        AND u.email != ''
    LOOP
        -- Call the weekly tips email function
        SELECT net.http_post(
            url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/weekly-tips-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'email', user_record.email,
                'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1))
            )
        ) INTO response;
        
        RAISE NOTICE 'Weekly tips email sent to %: %', user_record.email, response;
    END LOOP;
END;
$$;

-- Schedule weekly tips emails every Wednesday at 10 AM UTC
SELECT cron.schedule(
    'weekly-tips-email',
    '0 10 * * 3', -- Every Wednesday at 10 AM UTC
    'SELECT send_weekly_tips_emails();'
);

-- =====================================================
-- 3. MONTHLY ANALYTICS EMAIL (1st of month 8 AM UTC)
-- =====================================================
-- Remove existing schedule if it exists
SELECT cron.unschedule('monthly-analytics-email');

-- Create function to send monthly analytics emails
CREATE OR REPLACE FUNCTION send_monthly_analytics_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    response jsonb;
BEGIN
    -- Get all users who have monthly analytics emails enabled
    FOR user_record IN 
        SELECT u.id, u.email, u.display_name, u.externalid
        FROM users u
        JOIN email_preferences ep ON u.id = ep.userid
        WHERE ep.monthly_analytics = true
        AND u.email IS NOT NULL
        AND u.email != ''
    LOOP
        -- Call the monthly analytics email function
        SELECT net.http_post(
            url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/monthly-analytics-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'email', user_record.email,
                'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1))
            )
        ) INTO response;
        
        RAISE NOTICE 'Monthly analytics email sent to %: %', user_record.email, response;
    END LOOP;
END;
$$;

-- Schedule monthly analytics emails on the 1st of every month at 8 AM UTC
SELECT cron.schedule(
    'monthly-analytics-email',
    '0 8 1 * *', -- 1st of every month at 8 AM UTC
    'SELECT send_monthly_analytics_emails();'
);

-- =====================================================
-- 4. INACTIVITY REMINDER EMAIL (Daily 11 AM UTC)
-- =====================================================
-- Remove existing schedule if it exists
SELECT cron.unschedule('inactivity-reminder-email');

-- Create function to send inactivity reminder emails
CREATE OR REPLACE FUNCTION send_inactivity_reminder_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    response jsonb;
    days_inactive INTEGER;
BEGIN
    -- Get users who haven't been active for 7+ days and have inactivity reminders enabled
    FOR user_record IN 
        SELECT u.id, u.email, u.display_name, u.externalid, u.updated_at
        FROM users u
        JOIN email_preferences ep ON u.id = ep.userid
        WHERE ep.inactivity_reminders = true
        AND u.email IS NOT NULL
        AND u.email != ''
        AND u.updated_at < NOW() - INTERVAL '7 days'
    LOOP
        -- Calculate days inactive
        days_inactive := EXTRACT(DAYS FROM (NOW() - user_record.updated_at));
        
        -- Only send reminders at specific intervals (7, 14, 30 days)
        IF days_inactive IN (7, 14, 30) THEN
            -- Call the inactivity reminder email function
            SELECT net.http_post(
                url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/inactivity-reminder-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json'
                ),
                body := jsonb_build_object(
                    'email', user_record.email,
                    'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1)),
                    'daysInactive', days_inactive
                )
            ) INTO response;
            
            RAISE NOTICE 'Inactivity reminder email sent to % (% days inactive): %', user_record.email, days_inactive, response;
        END IF;
    END LOOP;
END;
$$;

-- Schedule inactivity reminder emails daily at 11 AM UTC
SELECT cron.schedule(
    'inactivity-reminder-email',
    '0 11 * * *', -- Every day at 11 AM UTC
    'SELECT send_inactivity_reminder_emails();'
);

-- =====================================================
-- 5. MILESTONE CHECK EMAIL (Daily 12 PM UTC)
-- =====================================================
-- Remove existing schedule if it exists
SELECT cron.unschedule('milestone-check-email');

-- Create function to check for milestones and send milestone emails
CREATE OR REPLACE FUNCTION check_and_send_milestone_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    app_count INTEGER;
    interview_count INTEGER;
    response jsonb;
BEGIN
    -- Get all users who have milestone emails enabled
    FOR user_record IN 
        SELECT u.id, u.email, u.display_name, u.externalid
        FROM users u
        JOIN email_preferences ep ON u.id = ep.userid
        WHERE ep.milestone_emails = true
        AND u.email IS NOT NULL
        AND u.email != ''
    LOOP
        -- Count applications
        SELECT COUNT(*) INTO app_count
        FROM applications 
        WHERE userid = user_record.id;
        
        -- Count interviews
        SELECT COUNT(*) INTO interview_count
        FROM applications 
        WHERE userid = user_record.id 
        AND status = 'Interview Scheduled';
        
        -- Check for application milestones (100, 500, 1000)
        IF app_count > 0 AND app_count % 100 = 0 THEN
            -- Send milestone email for applications
            SELECT net.http_post(
                url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/milestone-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json'
                ),
                body := jsonb_build_object(
                    'email', user_record.email,
                    'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1)),
                    'milestoneType', 'applications',
                    'milestoneValue', app_count
                )
            ) INTO response;
            
            RAISE NOTICE 'Milestone email sent to % for % applications: %', user_record.email, app_count, response;
        END IF;
        
        -- Check for interview milestones (every 5 interviews)
        IF interview_count > 0 AND interview_count % 5 = 0 THEN
            -- Send milestone email for interviews
            SELECT net.http_post(
                url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/milestone-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json'
                ),
                body := jsonb_build_object(
                    'email', user_record.email,
                    'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1)),
                    'milestoneType', 'interviews',
                    'milestoneValue', interview_count
                )
            ) INTO response;
            
            RAISE NOTICE 'Milestone email sent to % for % interviews: %', user_record.email, interview_count, response;
        END IF;
    END LOOP;
END;
$$;

-- Schedule milestone check every day at 12 PM UTC
SELECT cron.schedule(
    'milestone-check-email',
    '0 12 * * *', -- Every day at 12 PM UTC
    'SELECT check_and_send_milestone_emails();'
);

-- =====================================================
-- 6. WEEKLY ACHIEVEMENT SUMMARY EMAIL (Sundays 2 PM UTC)
-- =====================================================
-- Remove existing schedule if it exists
SELECT cron.unschedule('weekly-achievement-summary-email');

-- Create function to send weekly achievement summary emails
CREATE OR REPLACE FUNCTION send_weekly_achievement_summary_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    response jsonb;
BEGIN
    -- Get all users who have achievement emails enabled
    FOR user_record IN 
        SELECT u.id, u.email, u.display_name, u.externalid
        FROM users u
        JOIN email_preferences ep ON u.id = ep.userid
        WHERE ep.achievement_emails = true
        AND u.email IS NOT NULL
        AND u.email != ''
    LOOP
        -- Call the weekly achievement summary email function
        SELECT net.http_post(
            url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/weekly-achievement-summary-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'email', user_record.email,
                'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1))
            )
        ) INTO response;
        
        RAISE NOTICE 'Weekly achievement summary email sent to %: %', user_record.email, response;
    END LOOP;
END;
$$;

-- Schedule weekly achievement summary emails every Sunday at 2 PM UTC
SELECT cron.schedule(
    'weekly-achievement-summary-email',
    '0 14 * * 0', -- Every Sunday at 2 PM UTC
    'SELECT send_weekly_achievement_summary_emails();'
);

-- =====================================================
-- 7. FOLLOW-UP REMINDER EMAIL (Daily 3 PM UTC)
-- =====================================================
-- Remove existing schedule if it exists
SELECT cron.unschedule('followup-reminder-email');

-- Create function to send follow-up reminder emails
CREATE OR REPLACE FUNCTION send_followup_reminder_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    response jsonb;
    pending_followups INTEGER;
BEGIN
    -- Get users who have follow-up reminders enabled and have pending follow-ups
    FOR user_record IN 
        SELECT u.id, u.email, u.display_name, u.externalid
        FROM users u
        JOIN email_preferences ep ON u.id = ep.userid
        WHERE ep.followup_reminders = true
        AND u.email IS NOT NULL
        AND u.email != ''
    LOOP
        -- Check if user has pending follow-ups (applications older than 7 days)
        SELECT COUNT(*) INTO pending_followups
        FROM applications 
        WHERE userid = user_record.id
        AND status = 'Applied'
        AND dateApplied < NOW() - INTERVAL '7 days';
        
        -- Only send if there are pending follow-ups
        IF pending_followups > 0 THEN
            -- Call the follow-up reminder email function
            SELECT net.http_post(
                url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/followup-reminder-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json'
                ),
                body := jsonb_build_object(
                    'email', user_record.email,
                    'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1))
                )
            ) INTO response;
            
            RAISE NOTICE 'Follow-up reminder email sent to % (% pending): %', user_record.email, pending_followups, response;
        END IF;
    END LOOP;
END;
$$;

-- Schedule follow-up reminder emails daily at 3 PM UTC
SELECT cron.schedule(
    'followup-reminder-email',
    '0 15 * * *', -- Every day at 3 PM UTC
    'SELECT send_followup_reminder_emails();'
);

-- =====================================================
-- VERIFY SCHEDULES ARE CREATED
-- =====================================================
-- Show all scheduled jobs
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job 
ORDER BY jobid;

-- Show current timezone
SELECT current_setting('timezone');

-- Show current time
SELECT NOW() as current_time_utc;
