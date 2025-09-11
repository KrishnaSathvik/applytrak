-- ============================================================================
-- FIX EMAIL VERIFICATION ISSUES
-- ============================================================================
-- This script addresses the email verification and welcome email issues

-- Check current auth configuration
SELECT 
    'Current auth email settings:' as info,
    enable_signup,
    enable_confirmations,
    double_confirm_changes,
    max_frequency,
    otp_length,
    otp_expiry
FROM auth.config;

-- Check if there are any pending email confirmations
SELECT 
    'Pending email confirmations:' as info,
    COUNT(*) as pending_count
FROM auth.users 
WHERE email_confirmed_at IS NULL 
AND created_at > NOW() - INTERVAL '24 hours';

-- Check recent user signups
SELECT 
    'Recent user signups:' as info,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check if the welcome email function is working
SELECT 
    'Welcome email function status:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'welcome_email' 
AND routine_schema = 'public';

-- Check if there are any email-related errors in the logs
-- (This would require access to Supabase logs, but we can check for common issues)

-- Verify the users table has the correct structure for email verification
SELECT 
    'Users table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('email', 'externalid', 'createdat', 'updatedat')
ORDER BY column_name;
