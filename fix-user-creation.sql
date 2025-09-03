-- Fix User Creation Issue
-- This will ensure your user record exists in the database

-- 1. First, let's see what we have
SELECT 
    auth.uid() as auth_uid,
    auth.uid()::text as auth_uid_text,
    auth.email() as auth_email;

-- 2. Check if user exists
SELECT id, externalid, email, display_name 
FROM users 
WHERE externalid = auth.uid()::text;

-- 3. If no user exists, create one manually
INSERT INTO users (externalid, email, display_name, createdat, updatedat)
SELECT 
    auth.uid()::text,
    auth.email(),
    COALESCE(auth.jwt() ->> 'full_name', split_part(auth.email(), '@', 1)),
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE externalid = auth.uid()::text
);

-- 4. Verify the user was created
SELECT id, externalid, email, display_name, createdat
FROM users 
WHERE externalid = auth.uid()::text;

-- 5. Test current_user_id function again
SELECT current_user_id() as user_id;

-- 6. Create notification preferences record if it doesn't exist
INSERT INTO notification_preferences (userid, created_at, updated_at)
SELECT 
    current_user_id(),
    NOW(),
    NOW()
WHERE current_user_id() IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM notification_preferences WHERE userid = current_user_id()
);

-- 7. Verify notification preferences were created
SELECT * FROM notification_preferences WHERE userid = current_user_id();
