-- Auth-Aware User Fix
-- This handles the case where auth.uid() might be null in SQL context

-- Step 1: Check authentication status
SELECT 'Auth Status:' as step;
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Authenticated: ' || auth.uid()
        ELSE 'NOT AUTHENTICATED - Need to run this as a logged-in user'
    END as auth_status;

-- Step 2: If not authenticated, show instructions
SELECT 'Instructions:' as step;
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 
            'You need to run this script while logged in to your app. ' ||
            'Go to your app, sign in, then run this script from the app context.'
        ELSE 'You are authenticated, proceeding with user creation...'
    END as instructions;

-- Step 3: Only proceed if authenticated
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        -- Create/update user record
        INSERT INTO users (externalid, email, display_name, createdat, updatedat)
        VALUES (
            auth.uid(),
            auth.email(),
            COALESCE(
                (auth.jwt() ->> 'user_metadata')::jsonb ->> 'full_name',
                split_part(auth.email(), '@', 1)
            ),
            NOW(),
            NOW()
        )
        ON CONFLICT (externalid) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = COALESCE(EXCLUDED.display_name, users.display_name),
            updatedat = NOW();
        
        RAISE NOTICE 'User record created/updated successfully';
    ELSE
        RAISE NOTICE 'Cannot create user record - not authenticated';
    END IF;
END $$;

-- Step 4: Show current users (this will work regardless of auth)
SELECT 'All Users:' as step;
SELECT id, externalid, email, display_name, createdat 
FROM users 
ORDER BY id DESC;

-- Step 5: Test current_user_id if authenticated
SELECT 'Current User ID Test:' as step;
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 
            'User ID: ' || COALESCE(current_user_id()::text, 'NULL')
        ELSE 'Cannot test - not authenticated'
    END as user_id_status;
