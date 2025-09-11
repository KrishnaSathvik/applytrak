-- ============================================================================
-- RESET USER ID TO START FROM 1
-- ============================================================================
-- This script resets the existing user to ID 1 and sets up the sequence for ID 2

-- First, let's see what we're working with
SELECT 
    'Current user data:' as info,
    id,
    email,
    externalid
FROM users
ORDER BY id;

-- Check current sequence state
SELECT 
    'Current sequence state:' as info,
    last_value as current_sequence_value,
    is_called as sequence_has_been_called
FROM users_id_seq;

-- Step 1: Update the existing user to have ID 1
UPDATE users 
SET id = 1 
WHERE id = 22;

-- Step 2: Reset the sequence to start from 2 (since user 1 already exists)
SELECT setval('users_id_seq', 1, false);

-- Step 3: Verify the changes
SELECT 
    'Updated user data:' as info,
    id,
    email,
    externalid
FROM users
ORDER BY id;

-- Step 4: Check sequence state
SELECT 
    'Updated sequence state:' as info,
    last_value as current_sequence_value,
    is_called as sequence_has_been_called
FROM users_id_seq;

-- Step 5: Test what the next user ID will be
SELECT 
    'Next user will get ID:' as info,
    nextval('users_id_seq') as next_user_id;

-- Step 6: Reset sequence back to 1 since we just consumed a value
SELECT setval('users_id_seq', 1, false);

-- Final verification
SELECT 
    'Final state - existing user ID:' as info,
    id as existing_user_id
FROM users
WHERE email = 'krishnasathvikm@gmail.com';

SELECT 
    'Final state - next user will get ID:' as info,
    nextval('users_id_seq') as next_user_id;

-- Reset sequence back to 1 for the next actual user creation
SELECT setval('users_id_seq', 1, false);

SELECT 'Reset complete! Existing user now has ID 1, next user will get ID 2.' as status;
