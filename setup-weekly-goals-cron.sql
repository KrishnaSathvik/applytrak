-- Setup Weekly Goals Email Cron Job
-- This will run every Sunday at 9:00 AM UTC

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing weekly-goals-email job if it exists
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

-- Verify the job was created
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE jobname = 'weekly-goals-email';
