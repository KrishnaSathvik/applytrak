-- ============================================================================
-- FIX UNRESTRICTED TABLES - ENABLE RLS PROPERLY
-- ============================================================================
-- This fixes the "Unrestricted" status on tables

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ADD RLS POLICIES FOR ADMIN_EMAILS TABLE
-- ============================================================================

-- Only super admins can view admin emails
CREATE POLICY "Super admins can view admin emails" ON public.admin_emails 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Only super admins can insert admin emails
CREATE POLICY "Super admins can insert admin emails" ON public.admin_emails 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Only super admins can update admin emails
CREATE POLICY "Super admins can update admin emails" ON public.admin_emails 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Only super admins can delete admin emails
CREATE POLICY "Super admins can delete admin emails" ON public.admin_emails 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role = 'super_admin'
    )
);

-- ============================================================================
-- 3. ADD RLS POLICIES FOR ADMIN_AUDIT_LOG TABLE
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE externalid = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- 4. VERIFY RLS STATUS
-- ============================================================================

DO $$
DECLARE
    table_record record;
    rls_enabled boolean;
    policy_count integer;
BEGIN
    RAISE NOTICE '=== RLS STATUS VERIFICATION ===';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'users', 'admin_emails', 'applications', 'goals', 'analytics_events',
            'user_metrics', 'user_sessions', 'feedback', 'privacy_settings',
            'email_preferences', 'notification_preferences', 'backups',
            'sync_status', 'sync_errors', 'admin_audit_log'
        )
        ORDER BY table_name
    LOOP
        -- Check if RLS is enabled
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class 
        WHERE relname = table_record.table_name 
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        -- Count policies
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = table_record.table_name 
        AND schemaname = 'public';
        
        RAISE NOTICE '%: RLS=% | Policies=%', 
            table_record.table_name, 
            CASE WHEN rls_enabled THEN 'ENABLED' ELSE 'DISABLED' END,
            policy_count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS should now be properly enabled on all tables';
    RAISE NOTICE 'Tables should no longer show as "Unrestricted"';
END $$;
