-- Fix database functions and permissions
-- Run this in your Supabase SQL Editor

-- Update the cleanup_user_data function to handle missing tables gracefully
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

-- Ensure the notification_preferences table exists with proper structure
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notification_preferences_userid ON notification_preferences(userid);

-- Create RLS policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;

-- Create new policies
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (userid = current_user_id());

-- Grant permissions
GRANT ALL ON notification_preferences TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notification_preferences_id_seq TO authenticated;

-- Ensure cleanup_user_data function has proper permissions
GRANT EXECUTE ON FUNCTION public.cleanup_user_data(bigint) TO authenticated;

-- Create update_user_display_name function if it doesn't exist
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

-- Grant permissions for update_user_display_name
GRANT EXECUTE ON FUNCTION public.update_user_display_name(text, text) TO authenticated;
