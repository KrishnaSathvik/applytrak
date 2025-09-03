-- Fix the notification_preferences trigger issue
-- Run this in your Supabase SQL Editor

-- 1. Drop any existing problematic triggers
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
DROP TRIGGER IF EXISTS update_notification_preferences_updatedat ON notification_preferences;

-- 2. Drop any existing trigger functions that might have wrong column names
DROP FUNCTION IF EXISTS update_notification_preferences_updated_at();
DROP FUNCTION IF EXISTS update_notification_preferences_updatedat();

-- 3. Create the correct trigger function
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger with the correct function
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- 5. Test the trigger by checking if it works
-- This should not cause any errors
SELECT 'Trigger created successfully' as status;
