-- Simple User Fix - Handles UUID type properly
-- Run this in Supabase SQL Editor

-- Step 1: Check what we have
SELECT 'Auth Info:' as step;
SELECT 
    auth.uid() as auth_uid,
    auth.email() as auth_email;

-- Step 2: Check existing users
SELECT 'Existing Users:' as step;
SELECT id, externalid, email, display_name 
FROM users 
ORDER BY id DESC;

-- Step 3: Create/update user record (handles UUID properly)
INSERT INTO users (externalid, email, display_name, createdat, updatedat)
VALUES (
    auth.uid(),
    auth.email(),
    COALESCE(
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'full_name',
        split_part(auth.email(), '@', 1)
    ),
    NOW(),
    NOW()
)
ON CONFLICT (externalid) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    updatedat = NOW();

-- Step 4: Verify user exists
SELECT 'User Record:' as step;
SELECT id, externalid, email, display_name 
FROM users 
WHERE externalid = auth.uid();

-- Step 5: Test current_user_id function
SELECT 'Current User ID:' as step;
SELECT current_user_id() as user_id;

-- Step 6: Create notification preferences
INSERT INTO notification_preferences (userid, created_at, updated_at)
VALUES (
    current_user_id(),
    NOW(),
    NOW()
)
ON CONFLICT (userid) DO NOTHING;

-- Step 7: Verify notification preferences
SELECT 'Notification Preferences:' as step;
SELECT * FROM notification_preferences WHERE userid = current_user_id();

-- Step 8: Final status
SELECT 'Final Status:' as step;
SELECT 
    CASE 
        WHEN current_user_id() IS NOT NULL THEN 'SUCCESS: User ID = ' || current_user_id()
        ELSE 'ERROR: User ID is still null'
    END as status;
