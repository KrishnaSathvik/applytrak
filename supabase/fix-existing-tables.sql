-- Fix Existing Tables
-- This script fixes the existing tables that already exist

-- Step 1: Add missing columns to admin_emails if they don't exist
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS template_name text;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS body_html text;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS body_text text;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS email_type text;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS created_by bigint;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS last_sent_at timestamp with time zone;
ALTER TABLE public.admin_emails ADD COLUMN IF NOT EXISTS send_count integer DEFAULT 0;

-- Step 2: Add missing columns to notification_preferences if they don't exist
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS userid bigint;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS weekly_reminders boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS milestone_alerts boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS goal_reminders boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS application_updates boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS marketing_emails boolean DEFAULT false;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Step 3: Add isadmin column to users if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS isadmin boolean DEFAULT false;

-- Step 4: Create sequences if they don't exist
CREATE SEQUENCE IF NOT EXISTS admin_emails_id_seq;
CREATE SEQUENCE IF NOT EXISTS notification_preferences_id_seq;

-- Step 5: Set default values for id columns
UPDATE public.admin_emails SET id = nextval('admin_emails_id_seq') WHERE id IS NULL;
UPDATE public.notification_preferences SET id = nextval('notification_preferences_id_seq') WHERE id IS NULL;

-- Step 6: Set sequence ownership
ALTER SEQUENCE admin_emails_id_seq OWNED BY public.admin_emails.id;
ALTER SEQUENCE notification_preferences_id_seq OWNED BY public.notification_preferences.id;

-- Step 7: Insert default data if tables are empty
INSERT INTO public.notification_preferences (userid, created_at, updated_at)
SELECT id, now(), now()
FROM public.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences 
    WHERE userid = users.id
);

INSERT INTO public.admin_emails (template_name, subject, body_html, body_text, email_type, created_at, updated_at)
VALUES 
    ('welcome', 'Welcome to ApplyTrak!', '<h1>Welcome to ApplyTrak!</h1><p>Start tracking your job applications today.</p>', 'Welcome to ApplyTrak! Start tracking your job applications today.', 'welcome', now(), now()),
    ('milestone', 'Congratulations on Your Milestone!', '<h1>Congratulations!</h1><p>You''ve reached a new milestone in your job search journey.</p>', 'Congratulations! You''ve reached a new milestone in your job search journey.', 'milestone', now(), now()),
    ('weekly', 'Your Weekly Job Search Update', '<h1>Weekly Update</h1><p>Here''s your weekly job search progress.</p>', 'Weekly Update: Here''s your weekly job search progress.', 'weekly', now(), now())
ON CONFLICT DO NOTHING;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Existing tables fixed successfully!';
    RAISE NOTICE 'admin_emails: Columns added';
    RAISE NOTICE 'notification_preferences: Columns added';
    RAISE NOTICE 'users: isadmin column added';
    RAISE NOTICE 'Sequences: Created and linked';
    RAISE NOTICE 'Default data: Inserted';
END $$;
