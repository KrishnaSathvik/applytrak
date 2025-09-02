-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to send weekly goals emails to all users with preferences enabled
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
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := jsonb_build_object(
                'email', user_record.email,
                'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1))
            )
        ) INTO response;
        
        -- Log the result (optional)
        RAISE NOTICE 'Weekly goals email sent to %: %', user_record.email, response;
    END LOOP;
END;
$$;

-- Create a function to send weekly tips emails to all users with preferences enabled
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
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := jsonb_build_object(
                'email', user_record.email,
                'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1))
            )
        ) INTO response;
        
        -- Log the result (optional)
        RAISE NOTICE 'Weekly tips email sent to %: %', user_record.email, response;
    END LOOP;
END;
$$;

-- Create a function to send monthly analytics emails to all users with preferences enabled
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
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := jsonb_build_object(
                'email', user_record.email,
                'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1))
            )
        ) INTO response;
        
        -- Log the result (optional)
        RAISE NOTICE 'Monthly analytics email sent to %: %', user_record.email, response;
    END LOOP;
END;
$$;

-- Create a function to send inactivity reminder emails to users who haven't been active
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
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                    'email', user_record.email,
                    'name', COALESCE(user_record.display_name, split_part(user_record.email, '@', 1)),
                    'daysInactive', days_inactive
                )
            ) INTO response;
            
            -- Log the result (optional)
            RAISE NOTICE 'Inactivity reminder email sent to % (% days inactive): %', user_record.email, days_inactive, response;
        END IF;
    END LOOP;
END;
$$;

-- Schedule weekly goals emails every Sunday at 9 AM UTC
SELECT cron.schedule(
    'weekly-goals-email',
    '0 9 * * 0', -- Every Sunday at 9 AM UTC
    'SELECT send_weekly_goals_emails();'
);

-- Schedule weekly tips emails every Wednesday at 10 AM UTC
SELECT cron.schedule(
    'weekly-tips-email',
    '0 10 * * 3', -- Every Wednesday at 10 AM UTC
    'SELECT send_weekly_tips_emails();'
);

-- Schedule monthly analytics emails on the 1st of every month at 8 AM UTC
SELECT cron.schedule(
    'monthly-analytics-email',
    '0 8 1 * *', -- 1st of every month at 8 AM UTC
    'SELECT send_monthly_analytics_emails();'
);

-- Schedule inactivity reminder emails daily at 11 AM UTC
SELECT cron.schedule(
    'inactivity-reminder-email',
    '0 11 * * *', -- Every day at 11 AM UTC
    'SELECT send_inactivity_reminder_emails();'
);

-- Create a function to check for milestones and send milestone emails
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
        -- Count applications for this user
        SELECT COUNT(*) INTO app_count
        FROM applications
        WHERE userid = user_record.id;
        
        -- Count interviews for this user
        SELECT COUNT(*) INTO interview_count
        FROM applications
        WHERE userid = user_record.id
        AND status IN ('Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected');
        
        -- Check for milestone achievements (every 10 applications, every 5 interviews)
        IF app_count > 0 AND app_count % 10 = 0 THEN
            -- Send milestone email for applications
            SELECT net.http_post(
                url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/milestone-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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
        
        IF interview_count > 0 AND interview_count % 5 = 0 THEN
            -- Send milestone email for interviews
            SELECT net.http_post(
                url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/milestone-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_weekly_goals_emails() TO postgres;
GRANT EXECUTE ON FUNCTION send_weekly_tips_emails() TO postgres;
GRANT EXECUTE ON FUNCTION send_monthly_analytics_emails() TO postgres;
GRANT EXECUTE ON FUNCTION send_inactivity_reminder_emails() TO postgres;
GRANT EXECUTE ON FUNCTION check_and_send_milestone_emails() TO postgres;
