-- Check what tables exist in the database
-- Run this in Supabase SQL Editor

-- List all tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if specific tables exist and their structure
SELECT 
    'Table Structure Check' as section,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('applications', 'achievements', 'user_achievements', 'user_stats', 'users')
ORDER BY table_name, ordinal_position;
