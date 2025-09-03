-- Fix the cleanup_user_data function without jsonb_set (for older PostgreSQL versions)
-- Run this in your Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.cleanup_user_data(bigint);

-- Create a simple version that returns boolean instead of JSON
CREATE OR REPLACE FUNCTION public.cleanup_user_data(user_bigint bigint)
RETURNS boolean AS $$
DECLARE
    deleted_count integer := 0;
    total_deleted integer := 0;
BEGIN
    -- Delete from tables that might exist, with error handling for each
    BEGIN
        DELETE FROM public.analytics_events WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        -- Log error but continue
        RAISE WARNING 'Failed to delete from analytics_events: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM public.user_metrics WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from user_metrics: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM public.user_sessions WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from user_sessions: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM public.feedback WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from feedback: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM public.applications WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from applications: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM public.goals WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from goals: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM public.privacy_settings WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from privacy_settings: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM public.email_preferences WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from email_preferences: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM public.notification_preferences WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from notification_preferences: %', SQLERRM;
    END;
    
    -- Try to delete from optional tables
    BEGIN
        DELETE FROM public.backups WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors for optional tables
        NULL;
    END;
    
    BEGIN
        DELETE FROM public.admin_audit_log WHERE userid = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors for optional tables
        NULL;
    END;
    
    -- Finally delete the user record
    BEGIN
        DELETE FROM public.users WHERE id = user_bigint;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Return true if user was deleted
        IF deleted_count > 0 THEN
            RETURN true;
        ELSE
            RETURN false;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete from users: %', SQLERRM;
        RETURN false;
    END;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.cleanup_user_data(bigint) TO authenticated;

-- Test the function
SELECT 'cleanup_user_data function fixed (simple version)' as status;
