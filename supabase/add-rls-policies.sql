-- Add RLS Policies for Missing Tables
-- Run this AFTER running minimal-tables.sql

-- Add RLS policies for notification_preferences
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
        
    RAISE NOTICE 'notification_preferences policies created successfully';
END $$;

-- Add RLS policies for admin_emails
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
        
    RAISE NOTICE 'admin_emails policies created successfully';
END $$;

-- Update cleanup function
DROP FUNCTION IF EXISTS public.cleanup_user_data(bigint);
CREATE FUNCTION public.cleanup_user_data(user_bigint bigint)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.cleanup_user_data(bigint) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_emails TO authenticated;

-- Add comments
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences and settings';
COMMENT ON TABLE public.admin_emails IS 'Admin email templates and management';
COMMENT ON COLUMN public.notification_preferences.userid IS 'Reference to users table';
COMMENT ON COLUMN public.admin_emails.template_name IS 'Unique name for the email template';
COMMENT ON COLUMN public.admin_emails.email_type IS 'Type of email: welcome, milestone, weekly, monthly, admin';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'RLS policies added successfully!';
    RAISE NOTICE 'notification_preferences policies: Ready';
    RAISE NOTICE 'admin_emails policies: Ready';
    RAISE NOTICE 'Cleanup function: Updated';
    RAISE NOTICE 'Permissions: Granted';
END $$;
