-- Complete fix for notification_preferences table and triggers
-- Run this in your Supabase SQL Editor

-- 1. Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- 2. Create the table with the correct structure
CREATE TABLE public.notification_preferences (
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

-- 3. Create indexes
CREATE INDEX idx_notification_preferences_userid ON notification_preferences(userid);

-- 4. Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

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

-- 7. Create the trigger function (with correct column name)
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the trigger
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- 9. Create the upsert function
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

-- 10. Grant permissions for the upsert function
GRANT EXECUTE ON FUNCTION public.upsert_notification_preferences(bigint, boolean, timestamp with time zone) TO authenticated;

-- 11. Test the function
SELECT 'Notification preferences table and functions created successfully' as status;
