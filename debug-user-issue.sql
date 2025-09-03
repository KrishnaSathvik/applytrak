-- Debug User Issue
-- Run this to understand why current_user_id() returns null

-- 1. Check what auth.uid() returns
SELECT auth.uid() as auth_uid;

-- 2. Check what users exist in the database
SELECT id, externalid, email, display_name, createdat 
FROM users 
ORDER BY createdat DESC;

-- 3. Check if there's a user with your external ID
SELECT id, externalid, email, display_name 
FROM users 
WHERE externalid = auth.uid()::text;

-- 4. Check the current user's auth data
SELECT 
    auth.uid() as auth_uid,
    auth.uid()::text as auth_uid_text,
    auth.email() as auth_email;

-- 5. Check if there are any users at all
SELECT COUNT(*) as total_users FROM users;

-- 6. Check the users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
