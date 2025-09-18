-- Recreate Tables with Correct Structure
-- This will drop and recreate the tables with the proper schema

-- Step 1: Drop existing tables (they have wrong structure)
DROP TABLE IF EXISTS public.admin_emails CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;

-- Step 2: Create sequences
CREATE SEQUENCE IF NOT EXISTS notification_preferences_id_seq;
CREATE SEQUENCE IF NOT EXISTS admin_emails_id_seq;

-- Step 3: Create notification_preferences table with correct structure
CREATE TABLE public.notification_preferences (
    id bigint NOT NULL DEFAULT nextval('notification_preferences_id_seq'::regclass),
    userid bigint NOT NULL,
    push_notifications boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    weekly_reminders boolean DEFAULT true,
    milestone_alerts boolean DEFAULT true,
    goal_reminders boolean DEFAULT true,
    application_updates boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
    CONSTRAINT notification_preferences_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT notification_preferences_userid_unique UNIQUE (userid)
);

-- Step 4: Create admin_emails table with correct structure
CREATE TABLE public.admin_emails (
    id bigint NOT NULL DEFAULT nextval('admin_emails_id_seq'::regclass),
    template_name text NOT NULL,
    subject text NOT NULL,
    body_html text,
    body_text text,
    email_type text NOT NULL CHECK (email_type = ANY (ARRAY['welcome'::text, 'milestone'::text, 'weekly'::text, 'monthly'::text, 'admin'::text])),
    is_active boolean DEFAULT true,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_sent_at timestamp with time zone,
    send_count integer DEFAULT 0,
    CONSTRAINT admin_emails_pkey PRIMARY KEY (id),
    CONSTRAINT admin_emails_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Step 5: Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Step 6: Add isadmin column to users if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS isadmin boolean DEFAULT false;

-- Step 7: Set sequence ownership
ALTER SEQUENCE notification_preferences_id_seq OWNED BY public.notification_preferences.id;
ALTER SEQUENCE admin_emails_id_seq OWNED BY public.admin_emails.id;

-- Step 8: Insert default notification preferences for existing users
INSERT INTO public.notification_preferences (userid, created_at, updated_at)
SELECT id, now(), now()
FROM public.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences 
    WHERE userid = users.id
);

-- Step 9: Insert default admin email templates
INSERT INTO public.admin_emails (template_name, subject, body_html, body_text, email_type, created_at, updated_at)
VALUES 
    ('welcome', 'Welcome to ApplyTrak!', '<h1>Welcome to ApplyTrak!</h1><p>Start tracking your job applications today.</p>', 'Welcome to ApplyTrak! Start tracking your job applications today.', 'welcome', now(), now()),
    ('milestone', 'Congratulations on Your Milestone!', '<h1>Congratulations!</h1><p>You''ve reached a new milestone in your job search journey.</p>', 'Congratulations! You''ve reached a new milestone in your job search journey.', 'milestone', now(), now()),
    ('weekly', 'Your Weekly Job Search Update', '<h1>Weekly Update</h1><p>Here''s your weekly job search progress.</p>', 'Weekly Update: Here''s your weekly job search progress.', 'weekly', now(), now())
ON CONFLICT DO NOTHING;

-- Step 10: Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_userid ON public.notification_preferences(userid);
CREATE INDEX IF NOT EXISTS idx_admin_emails_type ON public.admin_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_admin_emails_active ON public.admin_emails(is_active);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Tables recreated with correct structure!';
    RAISE NOTICE 'notification_preferences: Recreated with proper columns';
    RAISE NOTICE 'admin_emails: Recreated with proper columns';
    RAISE NOTICE 'Default data: Inserted';
    RAISE NOTICE 'Indexes: Created';
    RAISE NOTICE 'Ready for RLS policies!';
END $$;
