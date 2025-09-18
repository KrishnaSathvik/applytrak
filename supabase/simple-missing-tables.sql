-- Simple Missing Tables Implementation
-- This file creates the missing tables step by step

-- Step 1: Create sequences
CREATE SEQUENCE IF NOT EXISTS notification_preferences_id_seq;
CREATE SEQUENCE IF NOT EXISTS admin_emails_id_seq;

-- Step 2: Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
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

-- Step 3: Create admin_emails table
CREATE TABLE IF NOT EXISTS public.admin_emails (
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

-- Step 4: Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Step 5: Add isadmin column if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS isadmin boolean DEFAULT false;

-- Step 6: Create simple policies for notification_preferences
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
    DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
    DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
    DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;
    
    -- Create new policies
    CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
        FOR SELECT USING (
            auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
        );

    CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
        FOR INSERT WITH CHECK (
            auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
        );

    CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
        FOR UPDATE USING (
            auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
        );

    CREATE POLICY "Users can delete own notification preferences" ON public.notification_preferences
        FOR DELETE USING (
            auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
        );
END $$;

-- Step 7: Create simple policies for admin_emails
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Admins can view admin emails" ON public.admin_emails;
    DROP POLICY IF EXISTS "Admins can insert admin emails" ON public.admin_emails;
    DROP POLICY IF EXISTS "Admins can update admin emails" ON public.admin_emails;
    DROP POLICY IF EXISTS "Admins can delete admin emails" ON public.admin_emails;
    
    -- Create new policies
    CREATE POLICY "Admins can view admin emails" ON public.admin_emails
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE externalid = auth.uid() 
                AND isadmin = true
            )
        );

    CREATE POLICY "Admins can insert admin emails" ON public.admin_emails
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE externalid = auth.uid() 
                AND isadmin = true
            )
        );

    CREATE POLICY "Admins can update admin emails" ON public.admin_emails
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE externalid = auth.uid() 
                AND isadmin = true
            )
        );

    CREATE POLICY "Admins can delete admin emails" ON public.admin_emails
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE externalid = auth.uid() 
                AND isadmin = true
            )
        );
END $$;

-- Step 8: Set sequence ownership
ALTER SEQUENCE notification_preferences_id_seq OWNED BY public.notification_preferences.id;
ALTER SEQUENCE admin_emails_id_seq OWNED BY public.admin_emails.id;

-- Step 9: Insert default notification preferences for existing users
INSERT INTO public.notification_preferences (userid, created_at, updated_at)
SELECT id, now(), now()
FROM public.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences 
    WHERE userid = users.id
);

-- Step 10: Insert default admin email templates
INSERT INTO public.admin_emails (template_name, subject, body_html, body_text, email_type, created_at, updated_at)
VALUES 
    ('welcome', 'Welcome to ApplyTrak!', '<h1>Welcome to ApplyTrak!</h1><p>Start tracking your job applications today.</p>', 'Welcome to ApplyTrak! Start tracking your job applications today.', 'welcome', now(), now()),
    ('milestone', 'Congratulations on Your Milestone!', '<h1>Congratulations!</h1><p>You''ve reached a new milestone in your job search journey.</p>', 'Congratulations! You''ve reached a new milestone in your job search journey.', 'milestone', now(), now()),
    ('weekly', 'Your Weekly Job Search Update', '<h1>Weekly Update</h1><p>Here''s your weekly job search progress.</p>', 'Weekly Update: Here''s your weekly job search progress.', 'weekly', now(), now())
ON CONFLICT DO NOTHING;

-- Step 11: Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_userid ON public.notification_preferences(userid);
CREATE INDEX IF NOT EXISTS idx_admin_emails_type ON public.admin_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_admin_emails_active ON public.admin_emails(is_active);

-- Step 12: Update cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_user_data(user_bigint bigint)
RETURNS void AS $$
BEGIN
    -- Delete from all user-related tables
    DELETE FROM public.notification_preferences WHERE userid = user_bigint;
    DELETE FROM public.email_preferences WHERE userid = user_bigint;
    DELETE FROM public.privacy_settings WHERE userid = user_bigint;
    DELETE FROM public.feedback WHERE userid = user_bigint;
    DELETE FROM public.applications WHERE userid = user_bigint;
    DELETE FROM public.goals WHERE userid = user_bigint;
    
    -- Try to delete from optional tables (ignore if they don't exist)
    BEGIN
        DELETE FROM public.backups WHERE userid = user_bigint;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue
    END;
    
    BEGIN
        DELETE FROM public.analytics_events WHERE userid = user_bigint;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue
    END;
    
    BEGIN
        DELETE FROM public.user_sessions WHERE userid = user_bigint;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue
    END;
    
    BEGIN
        DELETE FROM public.user_metrics WHERE userid = user_bigint;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue
    END;
    
    BEGIN
        DELETE FROM public.sync_errors WHERE userid = user_bigint;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue
    END;
    
    BEGIN
        DELETE FROM public.sync_status WHERE userid = user_bigint;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue
    END;
    
    -- Finally delete the user record
    DELETE FROM public.users WHERE id = user_bigint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Grant permissions
GRANT EXECUTE ON FUNCTION public.cleanup_user_data(bigint) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_emails TO authenticated;

-- Step 14: Add comments
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences and settings';
COMMENT ON TABLE public.admin_emails IS 'Admin email templates and management';
COMMENT ON COLUMN public.notification_preferences.userid IS 'Reference to users table';
COMMENT ON COLUMN public.admin_emails.template_name IS 'Unique name for the email template';
COMMENT ON COLUMN public.admin_emails.email_type IS 'Type of email: welcome, milestone, weekly, monthly, admin';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Missing tables created successfully!';
    RAISE NOTICE 'notification_preferences table: Ready';
    RAISE NOTICE 'admin_emails table: Ready';
    RAISE NOTICE 'RLS policies: Created';
    RAISE NOTICE 'Default data: Inserted';
    RAISE NOTICE 'Cleanup function: Updated';
END $$;
