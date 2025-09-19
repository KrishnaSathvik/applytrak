-- =====================================================
-- CHECK DATABASE SCHEMA
-- =====================================================

-- 1. List all tables in the database
SELECT 
    'ALL TABLES' as test_name,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check applications table structure
SELECT 
    'APPLICATIONS TABLE COLUMNS' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'applications' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check users table structure
SELECT 
    'USERS TABLE COLUMNS' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check achievements table structure
SELECT 
    'ACHIEVEMENTS TABLE COLUMNS' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'achievements' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check user_achievements table structure
SELECT 
    'USER_ACHIEVEMENTS TABLE COLUMNS' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_achievements' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check user_stats table structure
SELECT 
    'USER_STATS TABLE COLUMNS' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
