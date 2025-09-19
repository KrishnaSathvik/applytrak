-- =====================================================
-- OPTIMIZED EMAIL SCHEDULING SETUP
-- 5 Essential Templates with Smart Scheduling
-- =====================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- 1. WEEKLY GOALS EMAIL (Enhanced Weekly Digest)
-- =====================================================
-- Schedule: Every Sunday at 9:00 AM UTC
-- Purpose: Comprehensive weekly digest with all insights

-- Drop existing job if it exists
SELECT cron.unschedule('weekly-goals-email');

-- Schedule weekly goals email
SELECT cron.schedule(
    'weekly-goals-email',
    '0 9 * * 0', -- Every Sunday at 9:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/weekly-goals-email',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
            body := json_build_object(
                'email', users.email,
                'name', users.name
            )::text
        )
    FROM users
    WHERE users.email IS NOT NULL
    AND users.email_verified = true
    AND users.id IN (
        SELECT DISTINCT userid 
        FROM goals 
        WHERE weekly_goal > 0
    );
    $$
);

-- =====================================================
-- 2. ACHIEVEMENT UNLOCKED EMAIL
-- =====================================================
-- Schedule: On-demand (triggered by achievement unlock)
-- Purpose: Instant gratification when user unlocks achievement

-- Create trigger function for achievement unlocks
CREATE OR REPLACE FUNCTION trigger_achievement_unlocked_email()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Get user details
    SELECT email, name INTO user_email, user_name
    FROM users
    WHERE id = NEW.user_id;
    
    -- Get achievement details
    PERFORM
        net.http_post(
            url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/achievement-unlocked-email',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
            body := json_build_object(
                'email', user_email,
                'name', user_name,
                'achievement_id', NEW.achievement_id,
                'user_id', NEW.user_id
            )::text
        )
    FROM achievements
    WHERE id = NEW.achievement_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS achievement_unlocked_email_trigger ON user_achievements;
CREATE TRIGGER achievement_unlocked_email_trigger
    AFTER INSERT ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_achievement_unlocked_email();

-- =====================================================
-- 3. INTERVIEW SCHEDULED EMAIL
-- =====================================================
-- Schedule: On-demand (triggered by status change)
-- Purpose: Celebrate interview milestone

-- Create trigger function for interview scheduled
CREATE OR REPLACE FUNCTION trigger_interview_scheduled_email()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Only trigger if status changed to 'Interview Scheduled'
    IF NEW.status = 'Interview Scheduled' AND (OLD.status IS NULL OR OLD.status != 'Interview Scheduled') THEN
        -- Get user details
        SELECT email, name INTO user_email, user_name
        FROM users
        WHERE id = NEW.userid;
        
        -- Send interview scheduled email
        PERFORM
            net.http_post(
                url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/interview-scheduled-email',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
                body := json_build_object(
                    'email', user_email,
                    'name', user_name,
                    'application_id', NEW.id,
                    'company', NEW.company,
                    'position', NEW.position,
                    'interview_date', NEW.interviewDate
                )::text
            );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS interview_scheduled_email_trigger ON applications;
CREATE TRIGGER interview_scheduled_email_trigger
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_interview_scheduled_email();

-- =====================================================
-- 4. OFFER RECEIVED EMAIL
-- =====================================================
-- Schedule: On-demand (triggered by status change)
-- Purpose: Celebrate offer milestone

-- Create trigger function for offer received
CREATE OR REPLACE FUNCTION trigger_offer_received_email()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Only trigger if status changed to 'Offer Received'
    IF NEW.status = 'Offer Received' AND (OLD.status IS NULL OR OLD.status != 'Offer Received') THEN
        -- Get user details
        SELECT email, name INTO user_email, user_name
        FROM users
        WHERE id = NEW.userid;
        
        -- Send offer received email
        PERFORM
            net.http_post(
                url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/offer-received-email',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
                body := json_build_object(
                    'email', user_email,
                    'name', user_name,
                    'application_id', NEW.id,
                    'company', NEW.company,
                    'position', NEW.position,
                    'offer_date', NEW.updatedAt
                )::text
            );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS offer_received_email_trigger ON applications;
CREATE TRIGGER offer_received_email_trigger
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_offer_received_email();

-- =====================================================
-- 5. WELCOME EMAIL
-- =====================================================
-- Schedule: On-demand (triggered by user signup)
-- Purpose: Welcome new users

-- Create trigger function for welcome email
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Send welcome email for new users
    PERFORM
        net.http_post(
            url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/welcome-email',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
            body := json_build_object(
                'email', NEW.email,
                'name', NEW.name
            )::text
        );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS welcome_email_trigger ON users;
CREATE TRIGGER welcome_email_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_welcome_email();

-- =====================================================
-- SCHEDULING SUMMARY
-- =====================================================

-- View all scheduled jobs
SELECT 
    jobname,
    schedule,
    command,
    active,
    jobid
FROM cron.job
ORDER BY jobname;

-- View all triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%email%'
ORDER BY trigger_name;

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- Test weekly goals email manually
-- SELECT
--     net.http_post(
--         url := 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/weekly-goals-email',
--         headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
--         body := json_build_object(
--             'email', 'krishnasathvikm@gmail.com',
--             'name', 'Krishna'
--         )::text
--     );

-- =====================================================
-- MONITORING QUERIES
-- =====================================================

-- Check email sending history (if you have a logs table)
-- SELECT 
--     function_name,
--     created_at,
--     status,
--     email
-- FROM email_logs
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Check user email preferences
-- SELECT 
--     u.email,
--     u.name,
--     ep.weekly_goals_enabled,
--     ep.achievement_notifications_enabled,
--     ep.milestone_notifications_enabled
-- FROM users u
-- LEFT JOIN email_preferences ep ON u.id = ep.user_id
-- WHERE u.email_verified = true;

-- =====================================================
-- OPTIMIZATION NOTES
-- =====================================================

/*
OPTIMIZED EMAIL STRATEGY:

1. WEEKLY GOALS EMAIL (Enhanced Weekly Digest)
   - When: Every Sunday 9 AM UTC
   - Content: Goal progress + achievements + tips + follow-ups + analytics
   - Frequency: 1x per week
   - Audience: All users with weekly goals enabled

2. ACHIEVEMENT UNLOCKED EMAIL
   - When: On-demand (achievement unlock)
   - Content: Achievement details + XP + celebration
   - Frequency: As needed
   - Audience: User who unlocked achievement

3. INTERVIEW SCHEDULED EMAIL
   - When: On-demand (status change)
   - Content: Interview details + preparation tips
   - Frequency: As needed
   - Audience: User with interview scheduled

4. OFFER RECEIVED EMAIL
   - When: On-demand (status change)
   - Content: Offer details + celebration
   - Frequency: As needed
   - Audience: User who received offer

5. WELCOME EMAIL
   - When: On-demand (user signup)
   - Content: Welcome + onboarding + features
   - Frequency: 1x per user
   - Audience: New users

BENEFITS:
- Reduced from 13 templates to 5 essential ones
- Maximum 1-2 emails per week per user
- No email fatigue
- Higher engagement rates
- Comprehensive weekly digest
- Instant gratification for milestones
- Automated triggers for important events
*/
