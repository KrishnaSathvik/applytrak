-- Create User Function
-- This creates a function that can be called from your app to fix the user issue

-- Create a function to ensure user exists
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS TABLE(
    user_id INTEGER,
    external_id UUID,
    email TEXT,
    display_name TEXT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_uid UUID;
    user_email TEXT;
    user_display_name TEXT;
    db_user_id INTEGER;
BEGIN
    -- Get auth info
    auth_uid := auth.uid();
    user_email := auth.email();
    
    -- Check if user exists
    SELECT id INTO db_user_id
    FROM public.users
    WHERE externalid = auth_uid;
    
    -- If user doesn't exist, create them
    IF db_user_id IS NULL THEN
        -- Get display name from user metadata
        user_display_name := COALESCE(
            (auth.jwt() ->> 'user_metadata')::jsonb ->> 'full_name',
            split_part(user_email, '@', 1)
        );
        
        -- Insert new user
        INSERT INTO public.users (externalid, email, display_name, createdat, updatedat)
        VALUES (auth_uid, user_email, user_display_name, NOW(), NOW())
        RETURNING id INTO db_user_id;
        
        -- Create notification preferences
        INSERT INTO public.notification_preferences (userid, created_at, updated_at)
        VALUES (db_user_id, NOW(), NOW())
        ON CONFLICT (userid) DO NOTHING;
        
        RETURN QUERY SELECT 
            db_user_id,
            auth_uid,
            user_email,
            user_display_name,
            'User created successfully'::TEXT;
    ELSE
        -- User exists, just return their info
        SELECT display_name INTO user_display_name
        FROM public.users
        WHERE id = db_user_id;
        
        RETURN QUERY SELECT 
            db_user_id,
            auth_uid,
            user_email,
            user_display_name,
            'User already exists'::TEXT;
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO authenticated;

-- Test the function (this will work when called from your app)
-- SELECT * FROM public.ensure_user_exists();
