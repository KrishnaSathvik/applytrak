-- Test Database Setup
-- Run this after the comprehensive fix to verify everything is working

-- 1. Check if notification_preferences table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' 
ORDER BY ordinal_position;

-- 2. Check if current_user_id function exists
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'current_user_id';

-- 3. Check if cleanup_user_data function exists
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'cleanup_user_data';

-- 4. Check RLS policies for notification_preferences
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'notification_preferences';

-- 5. Test current_user_id function (should return your user ID)
SELECT current_user_id() as user_id;

-- 6. Check if you have a record in notification_preferences
SELECT * FROM notification_preferences WHERE userid = current_user_id();
