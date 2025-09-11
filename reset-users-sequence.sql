-- ============================================================================
-- RESET USERS SEQUENCE TO START FROM 1
-- ============================================================================
-- This script properly resets the users_id_seq sequence to start from 1

-- First, let's check the current sequence value
SELECT 
    'Current sequence info:' as info,
    last_value as current_sequence_value,
    is_called as sequence_has_been_called
FROM users_id_seq;

-- Get the maximum ID currently in the users table
SELECT 
    'Current max user ID:' as info,
    COALESCE(MAX(id), 0) as max_user_id
FROM users;

-- Reset the sequence to start from 1
-- Method 1: If you want to start from 1 regardless of existing data
SELECT setval('users_id_seq', 1, false);

-- Method 2: If you want to start from the next available number after existing data
-- Uncomment the line below and comment out the line above if you prefer this approach
-- SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);

-- Verify the sequence has been reset
SELECT 
    'Sequence after reset:' as info,
    last_value as current_sequence_value,
    is_called as sequence_has_been_called
FROM users_id_seq;

-- Test the sequence by checking what the next value would be
SELECT 
    'Next sequence value:' as info,
    nextval('users_id_seq') as next_value;

-- Reset it back to 1 since we just consumed a value
SELECT setval('users_id_seq', 1, false);

-- Final verification
SELECT 
    'Final sequence state:' as info,
    last_value as current_sequence_value,
    is_called as sequence_has_been_called
FROM users_id_seq;
