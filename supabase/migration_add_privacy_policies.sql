-- Add missing RLS policies for privacy_settings and other tables
-- This migration fixes the 403 Forbidden error when saving privacy settings

-- Create privacy_settings policies
DROP POLICY IF EXISTS "Users can view own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can insert own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can update own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can delete own privacy settings" ON public.privacy_settings;

CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own privacy settings" ON public.privacy_settings 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create goals policies
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

CREATE POLICY "Users can view own goals" ON public.goals 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own goals" ON public.goals 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own goals" ON public.goals 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own goals" ON public.goals 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create email_preferences policies
DROP POLICY IF EXISTS "Users can view own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can insert own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can update own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can delete own email preferences" ON public.email_preferences;

CREATE POLICY "Users can view own email preferences" ON public.email_preferences 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own email preferences" ON public.email_preferences 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own email preferences" ON public.email_preferences 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own email preferences" ON public.email_preferences 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create backups policies
DROP POLICY IF EXISTS "Users can view own backups" ON public.backups;
DROP POLICY IF EXISTS "Users can insert own backups" ON public.backups;
DROP POLICY IF EXISTS "Users can update own backups" ON public.backups;
DROP POLICY IF EXISTS "Users can delete own backups" ON public.backups;

CREATE POLICY "Users can view own backups" ON public.backups 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own backups" ON public.backups 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own backups" ON public.backups 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own backups" ON public.backups 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create feedback policies
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can delete own feedback" ON public.feedback;

CREATE POLICY "Users can view own feedback" ON public.feedback 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own feedback" ON public.feedback 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own feedback" ON public.feedback 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own feedback" ON public.feedback 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create analytics_events policies
DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can update own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can delete own analytics events" ON public.analytics_events;

CREATE POLICY "Users can view own analytics events" ON public.analytics_events 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own analytics events" ON public.analytics_events 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own analytics events" ON public.analytics_events 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own analytics events" ON public.analytics_events 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create user_metrics policies
DROP POLICY IF EXISTS "Users can view own user metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can insert own user metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can update own user metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can delete own user metrics" ON public.user_metrics;

CREATE POLICY "Users can view own user metrics" ON public.user_metrics 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own user metrics" ON public.user_metrics 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own user metrics" ON public.user_metrics 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own user metrics" ON public.user_metrics 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create user_sessions policies
DROP POLICY IF EXISTS "Users can view own user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own user sessions" ON public.user_sessions;

CREATE POLICY "Users can view own user sessions" ON public.user_sessions 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own user sessions" ON public.user_sessions 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own user sessions" ON public.user_sessions 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own user sessions" ON public.user_sessions 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create sync_status policies
DROP POLICY IF EXISTS "Users can view own sync status" ON public.sync_status;
DROP POLICY IF EXISTS "Users can insert own sync status" ON public.sync_status;
DROP POLICY IF EXISTS "Users can update own sync status" ON public.sync_status;
DROP POLICY IF EXISTS "Users can delete own sync status" ON public.sync_status;

CREATE POLICY "Users can view own sync status" ON public.sync_status 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own sync status" ON public.sync_status 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own sync status" ON public.sync_status 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own sync status" ON public.sync_status 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create sync_errors policies
DROP POLICY IF EXISTS "Users can view own sync errors" ON public.sync_errors;
DROP POLICY IF EXISTS "Users can insert own sync errors" ON public.sync_errors;
DROP POLICY IF EXISTS "Users can update own sync errors" ON public.sync_errors;
DROP POLICY IF EXISTS "Users can delete own sync errors" ON public.sync_errors;

CREATE POLICY "Users can view own sync errors" ON public.sync_errors 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own sync errors" ON public.sync_errors 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own sync errors" ON public.sync_errors 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own sync errors" ON public.sync_errors 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

-- Create admin_audit_log policies (admin only)
DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can update audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can delete audit log" ON public.admin_audit_log;

CREATE POLICY "Admins can view audit log" ON public.admin_audit_log 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND (SELECT isadmin FROM public.users WHERE externalid = auth.uid()) = true
);

CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (SELECT isadmin FROM public.users WHERE externalid = auth.uid()) = true
);

CREATE POLICY "Admins can update audit log" ON public.admin_audit_log 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND (SELECT isadmin FROM public.users WHERE externalid = auth.uid()) = true
);

CREATE POLICY "Admins can delete audit log" ON public.admin_audit_log 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND (SELECT isadmin FROM public.users WHERE externalid = auth.uid()) = true
);
