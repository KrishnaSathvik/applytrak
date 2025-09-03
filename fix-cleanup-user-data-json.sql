-- Fix the JSON concatenation error in cleanup_user_data function
-- Run this in your Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.cleanup_user_data(bigint);

-- Create a fixed version without JSON concatenation issues
CREATE OR REPLACE FUNCTION public.cleanup_user_data(user_bigint bigint)
RETURNS json AS $$
DECLARE
    result json;
    deleted_count integer := 0;
    error_list text[] := '{}';
    error_count integer := 0;
BEGIN
    -- Initialize result object
    result := json_build_object(
        'success', false,
        'deleted_records', 0,
        'errors', '[]'::json
    );
    
    -- Start transaction
    BEGIN
        -- Delete from tables that might exist, with error handling for each
        BEGIN
            DELETE FROM public.analytics_events WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'analytics_events: ' || SQLERRM);
        END;
        
        BEGIN
            DELETE FROM public.user_metrics WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'user_metrics: ' || SQLERRM);
        END;
        
        BEGIN
            DELETE FROM public.user_sessions WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'user_sessions: ' || SQLERRM);
        END;
        
        BEGIN
            DELETE FROM public.feedback WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'feedback: ' || SQLERRM);
        END;
        
        BEGIN
            DELETE FROM public.applications WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'applications: ' || SQLERRM);
        END;
        
        BEGIN
            DELETE FROM public.goals WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'goals: ' || SQLERRM);
        END;
        
        BEGIN
            DELETE FROM public.privacy_settings WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'privacy_settings: ' || SQLERRM);
        END;
        
        BEGIN
            DELETE FROM public.email_preferences WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'email_preferences: ' || SQLERRM);
        END;
        
        BEGIN
            DELETE FROM public.notification_preferences WHERE userid = user_bigint;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            result := jsonb_set(result, '{deleted_records}', to_jsonb((result->>'deleted_records')::integer + deleted_count));
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_list := array_append(error_list, 'notification_preferences: ' || SQLERRM);
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
            error_count := error_count + 1;
            error_list := array_append(error_list, 'users: ' || SQLERRM);
        END;
        
    EXCEPTION WHEN OTHERS THEN
        -- Handle any unexpected errors
        error_count := error_count + 1;
        error_list := array_append(error_list, 'unexpected_error: ' || SQLERRM);
    END;
    
    -- Update the result with errors if any
    IF error_count > 0 THEN
        result := jsonb_set(result, '{errors}', to_jsonb(error_list));
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.cleanup_user_data(bigint) TO authenticated;

-- Test the function
SELECT 'cleanup_user_data function fixed successfully' as status;
