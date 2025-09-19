-- =====================================================
-- FIND KRISHNA'S CORRECT USER ID
-- =====================================================

-- 1. Check what users exist in the applications table
SELECT 
    'USERS IN APPLICATIONS TABLE' as test_name,
    userid,
    COUNT(*) as application_count,
    MIN(dateApplied) as first_application,
    MAX(dateApplied) as last_application
FROM applications 
GROUP BY userid
ORDER BY application_count DESC;

-- 2. Check what users exist in the users table
SELECT 
    'USERS IN USERS TABLE' as test_name,
    id,
    email,
    display_name,
    created_at
FROM users
ORDER BY created_at DESC;

-- 3. Check if there's a mapping between user IDs
SELECT 
    'USER ID MAPPING' as test_name,
    'Check if userid in applications matches id in users' as note,
    'Need to find the correct userid for krishnasathvikm@gmail.com' as action;
