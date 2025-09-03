-- Comprehensive Database Fix
-- Run this in your Supabase SQL Editor to fix all issues

-- 1. Create notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    error_notifications BOOLEAN DEFAULT true,
    success_notifications BOOLEAN DEFAULT true,
    info_notifications BOOLEAN DEFAULT true,
    quick_snooze BOOLEAN DEFAULT false,
    snooze_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(userid)
);

-- 2. Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_userid ON notification_preferences(userid);

-- 3. Enable RLS for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;

-- 5. Create RLS policies for notification_preferences
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (userid = current_user_id());

-- 6. Grant permissions for notification_preferences
GRANT ALL ON notification_preferences TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notification_preferences_id_seq TO authenticated;

-- 7. Fix the cleanup_user_data function
CREATE OR REPLACE FUNCTION public.cleanup_user_data(user_bigint bigint)
RETURNS boolean AS $$
BEGIN
    -- Delete all user data in the correct order (respecting foreign keys)
    -- Only delete from tables that actually exist
    DELETE FROM public.analytics_events WHERE userid = user_bigint;
    DELETE FROM public.user_metrics WHERE userid = user_bigint;
    DELETE FROM public.user_sessions WHERE userid = user_bigint;
    DELETE FROM public.feedback WHERE userid = user_bigint;
    DELETE FROM public.applications WHERE userid = user_bigint;
    DELETE FROM public.goals WHERE userid = user_bigint;
    DELETE FROM public.privacy_settings WHERE userid = user_bigint;
    DELETE FROM public.email_preferences WHERE userid = user_bigint;
    DELETE FROM public.notification_preferences WHERE userid = user_bigint;
    
    -- Try to delete from optional tables (ignore if they don't exist)
    BEGIN
        DELETE FROM public.backups WHERE userid = user_bigint;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue
    END;
    
    BEGIN
        DELETE FROM public.admin_audit_log WHERE userid = user_bigint;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, continue
    END;
    
    -- Finally delete the user record
    DELETE FROM public.users WHERE id = user_bigint;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions for cleanup_user_data
GRANT EXECUTE ON FUNCTION public.cleanup_user_data(bigint) TO authenticated;

-- 9. Create/update the current_user_id function
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id INTEGER;
BEGIN
    -- Get the current user's database ID
    SELECT id INTO user_id
    FROM public.users
    WHERE externalid = auth.uid();
    
    RETURN user_id;
END;
$$;

-- 10. Grant permissions for current_user_id
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO anon;

-- 11. Create update_user_display_name function
CREATE OR REPLACE FUNCTION public.update_user_display_name(
    user_external_id text,
    new_display_name text
)
RETURNS boolean AS $$
BEGIN
    UPDATE public.users 
    SET display_name = new_display_name, updated_at = NOW()
    WHERE externalid = user_external_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant permissions for update_user_display_name
GRANT EXECUTE ON FUNCTION public.update_user_display_name(text, text) TO authenticated;

-- 13. Ensure all necessary tables have proper permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON applications TO authenticated;
GRANT ALL ON goals TO authenticated;
GRANT ALL ON analytics_events TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON user_metrics TO authenticated;
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON privacy_settings TO authenticated;
GRANT ALL ON email_preferences TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;

-- 14. Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 15. Create update trigger for notification_preferences
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to notification_preferences
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
