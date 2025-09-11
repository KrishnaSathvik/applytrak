-- ============================================================================
-- CREATE TEST USER FOR EMAIL TESTING
-- ============================================================================
-- This script creates a test user to test the email preferences function

-- First, let's check what's in the users table
SELECT 
    'Current users table:' as info,
    COUNT(*) as user_count
FROM users;

-- Check if there are any users in auth.users
SELECT 
    'Auth users count:' as info,
    COUNT(*) as auth_user_count
FROM auth.users;

-- Create a test user in the users table
INSERT INTO users (
    id,
    externalid,
    email,
    display_name,
    createdat,
    updatedat,
    isadmin
) VALUES (
    1,
    '4485394f-5d84-4c2e-a77b-0f4bf34b302k'::uuid,
    'krishnasathvikm@gmail.com',
    'Krishna',
    NOW(),
    NOW(),
    true
) ON CONFLICT (id) DO UPDATE SET
    externalid = EXCLUDED.externalid,
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    updatedat = NOW();

-- Verify the user was created
SELECT 
    'Test user created:' as info,
    id,
    email,
    externalid,
    display_name,
    isadmin
FROM users 
WHERE id = 1;

-- Test the email preferences URL generation
SELECT 
    'Email preferences URL:' as info,
    'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/email-preferences?eid=' || externalid as preferences_url
FROM users 
WHERE id = 1;
