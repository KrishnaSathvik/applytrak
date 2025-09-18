-- Database Diagnostic Script
-- This will help us understand what's happening with your database

-- Check if sequences exist
SELECT 
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences 
WHERE sequencename IN ('notification_preferences_id_seq', 'admin_emails_id_seq');

-- Check if tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('notification_preferences', 'admin_emails')
AND schemaname = 'public';

-- Check table columns for admin_emails
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_emails' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check table columns for notification_preferences
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if users table has isadmin column
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name = 'isadmin';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('notification_preferences', 'admin_emails')
AND schemaname = 'public';

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('notification_preferences', 'admin_emails')
AND schemaname = 'public';
