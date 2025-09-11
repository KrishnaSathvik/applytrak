-- ============================================================================
-- TEST EMAIL VERIFICATION FLOW
-- ============================================================================
-- This script helps test and debug the email verification process

-- 1. Check current auth configuration
SELECT 
    'Auth Configuration:' as test_type,
    'enable_signup' as setting,
    enable_signup as value
FROM auth.config
UNION ALL
SELECT 
    'Auth Configuration:',
    'enable_confirmations',
    enable_confirmations
FROM auth.config
UNION ALL
SELECT 
    'Auth Configuration:',
    'site_url',
    site_url
FROM auth.config;

-- 2. Check recent user activity
SELECT 
    'Recent Users:' as test_type,
    id::text as user_id,
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Pending Confirmation'
    END as status,
    created_at::text as created
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if welcome email function exists and is accessible
SELECT 
    'Function Check:' as test_type,
    routine_name as function_name,
    routine_type as type,
    'Available' as status
FROM information_schema.routines 
WHERE routine_name LIKE '%welcome%' 
AND routine_schema = 'public';

-- 4. Test the welcome email function directly (if you have a test user)
-- Uncomment and modify the email below to test
/*
SELECT 
    'Testing Welcome Email:' as test_type,
    'Sending to test user' as action,
    'Check function logs' as result;
*/

-- 5. Check for any email-related errors in the system
SELECT 
    'Error Check:' as test_type,
    'No direct error logging available' as note,
    'Check Supabase Dashboard logs' as recommendation;

-- 6. Verify the users table structure
SELECT 
    'Table Structure:' as test_type,
    column_name as column,
    data_type as type,
    is_nullable as nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('email', 'externalid', 'createdat', 'updatedat', 'isadmin')
ORDER BY column_name;

-- 7. Check if there are any RLS policies blocking email verification
SELECT 
    'RLS Policies:' as test_type,
    policyname as policy_name,
    cmd as command,
    permissive as is_permissive
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;
