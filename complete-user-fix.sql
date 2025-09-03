-- Complete User Fix
-- This will fix the user creation issue and ensure everything works

-- Step 1: Check current state
SELECT 'Current Auth State:' as step;
SELECT 
    auth.uid() as auth_uid,
    auth.uid()::text as auth_uid_text,
    auth.email() as auth_email;

-- Step 2: Check existing users
SELECT 'Existing Users:' as step;
SELECT id, externalid, email, display_name, createdat 
FROM users 
ORDER BY createdat DESC;

-- Step 3: Check if your user exists
SELECT 'Your User Check:' as step;
SELECT id, externalid, email, display_name 
FROM users 
WHERE externalid = auth.uid();

-- Step 4: Create user if missing (this will work even if user exists)
INSERT INTO users (externalid, email, display_name, createdat, updatedat)
SELECT 
    auth.uid(),
    auth.email(),
    COALESCE(
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'full_name',
        split_part(auth.email(), '@', 1)
    ),
    NOW(),
    NOW()
ON CONFLICT (externalid) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    updatedat = NOW();

-- Step 5: Verify user creation
SELECT 'User Created/Updated:' as step;
SELECT id, externalid, email, display_name, createdat, updatedat
FROM users 
WHERE externalid = auth.uid();

-- Step 6: Test current_user_id function
SELECT 'Testing current_user_id:' as step;
SELECT current_user_id() as user_id;

-- Step 7: Create notification preferences if missing
INSERT INTO notification_preferences (userid, created_at, updated_at)
SELECT 
    current_user_id(),
    NOW(),
    NOW()
WHERE current_user_id() IS NOT NULL 
ON CONFLICT (userid) DO NOTHING;

-- Step 8: Verify notification preferences
SELECT 'Notification Preferences:' as step;
SELECT * FROM notification_preferences WHERE userid = current_user_id();

-- Step 9: Test the cleanup function (just check if it exists)
SELECT 'Testing cleanup function:' as step;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'cleanup_user_data';

-- Step 10: Final verification
SELECT 'Final Status:' as step;
SELECT 
    'User ID: ' || current_user_id() as status,
    'Auth UID: ' || auth.uid()::text as auth_status,
    'Email: ' || auth.email() as email_status;
