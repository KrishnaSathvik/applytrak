-- Fix the cleanup_user_data function to handle all edge cases
-- Run this in your Supabase SQL Editor

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.cleanup_user_data(bigint);

-- Create a more robust cleanup_user_data function
CREATE OR REPLACE FUNCTION public.cleanup_user_data(user_bigint bigint)
RETURNS json AS $$
DECLARE
    result json;
    deleted_count integer := 0;
    error_message text;
BEGIN
    -- Initialize result object
    result := json_build_object(
        'success', false,
        'deleted_records', 0,
        'errors', json_build_array()
    );
    
    -- Start transaction
    BEGIN
        -- Delete from tables that might exist, with error handling for each
        BEGIN
            DELETE FROM public.analytics_events WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('analytics_events: ' || SQLERRM));
        END;
        
        BEGIN
            DELETE FROM public.user_metrics WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('user_metrics: ' || SQLERRM));
        END;
        
        BEGIN
            DELETE FROM public.user_sessions WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('user_sessions: ' || SQLERRM));
        END;
        
        BEGIN
            DELETE FROM public.feedback WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('feedback: ' || SQLERRM));
        END;
        
        BEGIN
            DELETE FROM public.applications WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('applications: ' || SQLERRM));
        END;
        
        BEGIN
            DELETE FROM public.goals WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('goals: ' || SQLERRM));
        END;
        
        BEGIN
            DELETE FROM public.privacy_settings WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('privacy_settings: ' || SQLERRM));
        END;
        
        BEGIN
            DELETE FROM public.email_preferences WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('email_preferences: ' || SQLERRM));
        END;
        
        BEGIN
            DELETE FROM public.notification_preferences WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('notification_preferences: ' || SQLERRM));
        END;
        
        -- Try to delete from optional tables
        BEGIN
            DELETE FROM public.backups WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for optional tables
            NULL;
        END;
        
        BEGIN
            DELETE FROM public.admin_audit_log WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for optional tables
            NULL;
        END;
        
        -- Finally delete the user record
        BEGIN
            DELETE FROM public.users WHERE id = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
            
            -- Mark as successful if user was deleted
            IF deleted_count > 0 THEN
                result := jsonb_set(result, '{success}', 'true');
            END IF;
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('users: ' || SQLERRM));
        END;
        
    EXCEPTION WHEN OTHERS THEN
        -- Handle any unexpected errors
        result := jsonb_set(result, '{errors}', (result->'errors') || json_build_array('unexpected_error: ' || SQLERRM));
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.cleanup_user_data(bigint) TO authenticated;

-- Also create a simpler version that returns boolean for backward compatibility
CREATE OR REPLACE FUNCTION public.cleanup_user_data_simple(user_bigint bigint)
RETURNS boolean AS $$
DECLARE
    result json;
BEGIN
    -- Call the main function
    result := public.cleanup_user_data(user_bigint);
    
    -- Return true if successful
    RETURN (result->>'success')::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the simple version too
GRANT EXECUTE ON FUNCTION public.cleanup_user_data_simple(bigint) TO authenticated;
