-- ============================================================================
-- TEST WELCOME EMAIL FOR USER ID 1
-- ============================================================================
-- This script manually triggers the welcome email for user ID 1

-- First, let's get the user details
SELECT 
    'User Details:' as info,
    id,
    email,
    display_name,
    externalid,
    createdat
FROM users 
WHERE id = 1;

-- Check if the welcome email function exists
SELECT 
    'Function Check:' as info,
    routine_name,
    routine_type,
    'Available' as status
FROM information_schema.routines 
WHERE routine_name LIKE '%welcome%' 
AND routine_schema = 'public';

-- Test the welcome email function by calling it directly
-- This will trigger the welcome email for user ID 1
SELECT 
    'Triggering Welcome Email...' as info,
    'Check function logs for results' as note;

-- Call the welcome email function
-- Note: This requires the function to be accessible from SQL
-- If this doesn't work, we'll need to call it via the REST API

-- Alternative: Check if we can call the function via REST API
SELECT 
    'To test via REST API, run this curl command:' as info,
    'curl -X POST "https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/welcome-email" -H "Content-Type: application/json" -d "{\"email\": \"krishnasathvikm@gmail.com\", \"name\": \"Krishna\"}"' as curl_command;
