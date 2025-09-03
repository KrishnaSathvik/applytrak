-- Fix notification_preferences table and functionality
-- Run this in your Supabase SQL Editor

-- 1. Create notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    userid bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    error_notifications boolean DEFAULT true,
    success_notifications boolean DEFAULT true,
    info_notifications boolean DEFAULT true,
    quick_snooze boolean DEFAULT false,
    snooze_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
    CONSTRAINT notification_preferences_userid_unique UNIQUE (userid)
);

-- 2. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notification_preferences_userid ON notification_preferences(userid);

-- 3. Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;

-- 5. Create RLS policies
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (userid = current_user_id());

-- 6. Grant permissions
GRANT ALL ON notification_preferences TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;

-- 7. Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- 8. Create a function to safely upsert notification preferences
CREATE OR REPLACE FUNCTION public.upsert_notification_preferences(
    user_bigint bigint,
    quick_snooze_val boolean DEFAULT false,
    snooze_until_val timestamp with time zone DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Upsert notification preferences
    INSERT INTO public.notification_preferences (
        userid, 
        quick_snooze, 
        snooze_until, 
        created_at, 
        updated_at
    ) VALUES (
        user_bigint, 
        quick_snooze_val, 
        snooze_until_val, 
        NOW(), 
        NOW()
    )
    ON CONFLICT (userid) 
    DO UPDATE SET 
        quick_snooze = EXCLUDED.quick_snooze,
        snooze_until = EXCLUDED.snooze_until,
        updated_at = NOW();
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'message', 'Notification preferences updated successfully'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant permissions for the upsert function
GRANT EXECUTE ON FUNCTION public.upsert_notification_preferences(bigint, boolean, timestamp with time zone) TO authenticated;

-- 10. Create a function to get notification preferences
CREATE OR REPLACE FUNCTION public.get_notification_preferences(user_bigint bigint)
RETURNS json AS $$
DECLARE
    result json;
    prefs record;
BEGIN
    -- Get notification preferences
    SELECT * INTO prefs 
    FROM public.notification_preferences 
    WHERE userid = user_bigint;
    
    IF prefs IS NULL THEN
        -- Return default preferences if none exist
        result := json_build_object(
            'userid', user_bigint,
            'error_notifications', true,
            'success_notifications', true,
            'info_notifications', true,
            'quick_snooze', false,
            'snooze_until', NULL,
            'created_at', NULL,
            'updated_at', NULL
        );
    ELSE
        -- Return existing preferences
        result := json_build_object(
            'userid', prefs.userid,
            'error_notifications', prefs.error_notifications,
            'success_notifications', prefs.success_notifications,
            'info_notifications', prefs.info_notifications,
            'quick_snooze', prefs.quick_snooze,
            'snooze_until', prefs.snooze_until,
            'created_at', prefs.created_at,
            'updated_at', prefs.updated_at
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant permissions for the get function
GRANT EXECUTE ON FUNCTION public.get_notification_preferences(bigint) TO authenticated;
