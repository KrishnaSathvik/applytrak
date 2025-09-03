-- Manual User Creation
-- Run this in Supabase SQL Editor to manually create your user record

-- Step 1: First, let's see what users exist
SELECT 'Existing Users:' as step;
SELECT id, externalid, email, display_name, createdat 
FROM users 
ORDER BY id DESC;

-- Step 2: Get your auth user ID from the auth.users table
SELECT 'Auth Users:' as step;
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;

-- Step 3: Manually create your user record
-- Replace 'your-auth-user-id-here' with the actual UUID from step 2
-- Replace 'your-email@example.com' with your actual email

INSERT INTO users (externalid, email, display_name, createdat, updatedat)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        split_part(au.email, '@', 1)
    ),
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.email = 'your-email@example.com'  -- Replace with your actual email
AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.externalid = au.id
);

-- Step 4: Verify the user was created
SELECT 'User Created:' as step;
SELECT id, externalid, email, display_name, createdat
FROM users 
WHERE email = 'your-email@example.com';  -- Replace with your actual email

-- Step 5: Create notification preferences for the user
INSERT INTO notification_preferences (userid, created_at, updated_at)
SELECT 
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'your-email@example.com'  -- Replace with your actual email
ON CONFLICT (userid) DO NOTHING;

-- Step 6: Verify notification preferences
SELECT 'Notification Preferences:' as step;
SELECT np.*
FROM notification_preferences np
JOIN users u ON u.id = np.userid
WHERE u.email = 'your-email@example.com';  -- Replace with your actual email

-- Step 7: Test the current_user_id function (this will still return null from SQL context)
SELECT 'Current User ID Test:' as step;
SELECT current_user_id() as user_id;
