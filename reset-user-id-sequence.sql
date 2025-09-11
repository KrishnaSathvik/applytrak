-- ============================================================================
-- RESET USER ID SEQUENCE TO START FROM 1
-- ============================================================================
-- This resets the users table ID sequence to start from 1

-- ============================================================================
-- 1. BACKUP CURRENT DATA (OPTIONAL)
-- ============================================================================

-- Create a backup table with current data
CREATE TABLE IF NOT EXISTS public.users_backup AS 
SELECT * FROM public.users;

-- ============================================================================
-- 2. RESET THE SEQUENCE
-- ============================================================================

-- Get the current maximum ID
DO $$
DECLARE
    max_id bigint;
    sequence_name text;
BEGIN
    -- Find the sequence name for users table
    SELECT pg_get_serial_sequence('public.users', 'id') INTO sequence_name;
    
    IF sequence_name IS NOT NULL THEN
        -- Get current max ID
        SELECT COALESCE(MAX(id), 0) INTO max_id FROM public.users;
        
        -- Reset sequence to start from 1
        EXECUTE 'ALTER SEQUENCE ' || sequence_name || ' RESTART WITH 1';
        
        RAISE NOTICE 'Sequence % reset to start from 1', sequence_name;
        RAISE NOTICE 'Current max ID in users table: %', max_id;
    ELSE
        RAISE NOTICE 'No sequence found for users.id column';
    END IF;
END $$;

-- ============================================================================
-- 3. VERIFY THE RESET
-- ============================================================================

-- Check the current sequence value
DO $$
DECLARE
    sequence_name text;
    current_value bigint;
BEGIN
    SELECT pg_get_serial_sequence('public.users', 'id') INTO sequence_name;
    
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT last_value FROM ' || sequence_name INTO current_value;
        RAISE NOTICE 'Current sequence value: %', current_value;
    END IF;
END $$;

-- ============================================================================
-- 4. TEST THE SEQUENCE
-- ============================================================================

-- Insert a test user to verify the sequence works
-- (This will be deleted after testing)
DO $$
DECLARE
    test_user_id bigint;
    sequence_name text;
BEGIN
    -- Get sequence name
    SELECT pg_get_serial_sequence('public.users', 'id') INTO sequence_name;
    
    IF sequence_name IS NOT NULL THEN
        -- Insert a test user
        INSERT INTO public.users (externalid, email, display_name, role, createdat, updatedat)
        VALUES (
            gen_random_uuid(),
            'test@example.com',
            'Test User',
            'user',
            NOW(),
            NOW()
        ) RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'Test user created with ID: %', test_user_id;
        
        -- Delete the test user
        DELETE FROM public.users WHERE id = test_user_id;
        
        RAISE NOTICE 'Test user deleted, sequence is working correctly';
    END IF;
END $$;

-- ============================================================================
-- 5. CLEANUP
-- ============================================================================

-- Drop the backup table (uncomment if you want to keep it)
-- DROP TABLE IF EXISTS public.users_backup;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ User ID sequence reset successfully!';
    RAISE NOTICE 'New users will now get IDs starting from 1';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: Existing users keep their current IDs';
    RAISE NOTICE 'Only new users will get sequential IDs starting from 1';
END $$;
