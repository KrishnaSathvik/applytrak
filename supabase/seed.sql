-- Create sequences first
CREATE SEQUENCE IF NOT EXISTS public.users_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.applications_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.backups_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.feedback_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.analytics_events_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.user_sessions_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.sync_errors_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.admin_audit_log_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'attachments',
    'attachments',
    false, -- Private bucket for user files
    52428800, -- 50MB file size limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the attachments bucket
CREATE POLICY "Users can upload their own attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attachments' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attachments' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own attachments" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'attachments' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'attachments' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create the users table with the correct column names (camelCase)
CREATE TABLE IF NOT EXISTS public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  externalid uuid NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  email text UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  display_name text,
  avatarurl text,
  timezone text DEFAULT 'UTC'::text,
  language text DEFAULT 'en'::text,
  preferences jsonb DEFAULT '{}'::jsonb,
  lastactiveat timestamp with time zone DEFAULT now(),
  deviceinfo jsonb DEFAULT '{}'::jsonb,
  isadmin boolean DEFAULT false,
  adminpermissions text[] DEFAULT '{}'::text[],
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create the applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id character varying NOT NULL DEFAULT nextval('applications_id_seq'::regclass),
  company text NOT NULL CHECK (length(TRIM(BOTH FROM company)) > 0),
  "position" text NOT NULL CHECK (length(TRIM(BOTH FROM "position")) > 0),
  "dateApplied" text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['Applied'::text, 'Interview'::text, 'Offer'::text, 'Rejected'::text])),
  type text NOT NULL CHECK (type = ANY (ARRAY['Onsite'::text, 'Remote'::text, 'Hybrid'::text])),
  location text,
  "jobSource" text,
  "jobUrl" text,
  notes text,
  attachments jsonb DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now(),
  "syncedAt" timestamp with time zone DEFAULT now(),
  "syncStatus" text DEFAULT 'synced'::text CHECK ("syncStatus" = ANY (ARRAY['synced'::text, 'pending'::text, 'error'::text])),
  "cloudId" uuid DEFAULT uuid_generate_v4(),
  salary text,
  userid bigint,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id text NOT NULL DEFAULT 'default'::text,
  "totalGoal" integer NOT NULL DEFAULT 100,
  "weeklyGoal" integer NOT NULL DEFAULT 5,
  "monthlyGoal" integer NOT NULL DEFAULT 20,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now(),
  "syncedAt" timestamp with time zone DEFAULT now(),
  "cloudId" uuid DEFAULT uuid_generate_v4(),
  userid bigint,
  CONSTRAINT goals_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the privacy_settings table
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id text NOT NULL DEFAULT 'default'::text,
  analytics boolean DEFAULT false,
  feedback boolean DEFAULT false,
  functionalcookies boolean DEFAULT true,
  consentdate timestamp with time zone NOT NULL DEFAULT now(),
  consentversion text DEFAULT '1.0'::text,
  cloudsyncconsent boolean DEFAULT false,
  dataretentionperiod integer DEFAULT 365,
  anonymizeafter integer DEFAULT 730,
  trackinglevel text DEFAULT 'minimal'::text CHECK (trackinglevel = ANY (ARRAY['minimal'::text, 'standard'::text, 'detailed'::text])),
  datasharingconsent boolean DEFAULT false,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  marketingconsent boolean DEFAULT false,
  userid bigint,
  CONSTRAINT privacy_settings_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the email_preferences table
CREATE TABLE IF NOT EXISTS public.email_preferences (
  weekly_goals boolean DEFAULT true,
  weekly_tips boolean DEFAULT true,
  monthly_analytics boolean DEFAULT true,
  milestone_emails boolean DEFAULT true,
  inactivity_reminders boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  userid bigint,
  CONSTRAINT email_preferences_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the backups table
CREATE TABLE IF NOT EXISTS public.backups (
  id bigint NOT NULL DEFAULT nextval('backups_id_seq'::regclass),
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  data jsonb NOT NULL,
  version text DEFAULT '2.0'::text,
  size_bytes integer CHECK (size_bytes IS NULL OR size_bytes <= 100000000),
  backup_type text DEFAULT 'manual'::text CHECK (backup_type = ANY (ARRAY['manual'::text, 'automatic'::text])),
  applications_count integer DEFAULT 0,
  includes_goals boolean DEFAULT true,
  includes_analytics boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  userid bigint,
  CONSTRAINT backups_pkey PRIMARY KEY (id),
  CONSTRAINT backups_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id bigint NOT NULL DEFAULT nextval('feedback_id_seq'::regclass),
  type text NOT NULL CHECK (type = ANY (ARRAY['bug'::text, 'feature'::text, 'general'::text, 'love'::text])),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL CHECK (length(TRIM(BOTH FROM message)) >= 3),
  email text CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  session_id text,
  user_agent text,
  url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  cloud_id uuid DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  userid bigint,
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id bigint NOT NULL DEFAULT nextval('analytics_events_id_seq'::regclass),
  userid bigint NOT NULL,
  event text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  sessionid text NOT NULL,
  useragent text,
  devicetype text,
  timezone text,
  language text,
  createdat timestamp with time zone DEFAULT now(),
  syncedat timestamp with time zone DEFAULT now(),
  cloudid uuid DEFAULT uuid_generate_v4(),
  userconsentstatus boolean DEFAULT true,
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the user_metrics table
CREATE TABLE IF NOT EXISTS public.user_metrics (
  id text NOT NULL DEFAULT 'default'::text,
  sessions_count integer DEFAULT 0,
  total_time_spent integer,
  applications_created integer DEFAULT 0,
  applications_updated integer DEFAULT 0,
  applications_deleted integer DEFAULT 0,
  goals_set integer DEFAULT 0,
  attachments_added integer DEFAULT 0,
  exports_performed integer DEFAULT 0,
  imports_performed integer DEFAULT 0,
  searches_performed integer DEFAULT 0,
  features_used jsonb DEFAULT '[]'::jsonb,
  last_active_date timestamp with time zone DEFAULT now(),
  first_visit timestamp with time zone DEFAULT now(),
  device_type text CHECK (device_type = ANY (ARRAY['mobile'::text, 'tablet'::text, 'desktop'::text])),
  browser_version text,
  screen_resolution text,
  timezone text,
  language text,
  total_events integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  session_duration integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  synced_at timestamp with time zone DEFAULT now(),
  userid bigint,
  CONSTRAINT user_metrics_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id bigint NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass),
  sessionId text DEFAULT uuid_generate_v4(),
  startTime timestamp with time zone NOT NULL DEFAULT now(),
  endTime timestamp with time zone,
  duration integer,
  "deviceType" text CHECK ("deviceType" = ANY (ARRAY['mobile'::text, 'tablet'::text, 'desktop'::text])),
  userAgent text,
  referrer text,
  timezone text,
  language text,
  events jsonb DEFAULT '[]'::jsonb,
  pageViews integer DEFAULT 0,
  createdAt timestamp with time zone DEFAULT now(),
  syncedAt timestamp with time zone DEFAULT now(),
  userid bigint,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the sync_status table
CREATE TABLE IF NOT EXISTS public.sync_status (
  id text NOT NULL DEFAULT 'default'::text,
  is_online boolean DEFAULT true,
  is_supabase_connected boolean DEFAULT true,
  last_sync_time timestamp with time zone,
  pending_operations integer DEFAULT 0,
  last_error text,
  last_error_time timestamp with time zone,
  retry_count integer DEFAULT 0,
  total_synced_items integer DEFAULT 0,
  total_sync_errors integer DEFAULT 0,
  average_sync_time interval DEFAULT '00:00:00'::interval,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  userid bigint,
  CONSTRAINT sync_status_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the sync_errors table
CREATE TABLE IF NOT EXISTS public.sync_errors (
  id bigint NOT NULL DEFAULT nextval('sync_errors_id_seq'::regclass),
  operation text NOT NULL CHECK (operation = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text])),
  table_name text NOT NULL,
  record_id text NOT NULL,
  error_message text NOT NULL,
  error_code text,
  error_type text DEFAULT 'sync_error'::text,
  timestamp timestamp with time zone DEFAULT now(),
  retry_count integer DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 10),
  max_retries integer DEFAULT 3,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  userid bigint,
  CONSTRAINT sync_errors_pkey PRIMARY KEY (id),
  CONSTRAINT sync_errors_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Create the admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id bigint NOT NULL DEFAULT nextval('admin_audit_log_id_seq'::regclass),
  action text NOT NULL CHECK (length(TRIM(BOTH FROM action)) > 0),
  details jsonb DEFAULT '{}'::jsonb,
  session_id uuid,
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  security_level text DEFAULT 'info'::text CHECK (security_level = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text])),
  userid bigint,
  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_log_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create improved RLS policies that fix authentication issues
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Create improved user policies
CREATE POLICY "Users can view own data" ON public.users 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND (
        auth.uid()::text = externalid::text 
        OR isadmin = true
    )
);

CREATE POLICY "Users can update own data" ON public.users 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND (
        auth.uid()::text = externalid::text 
        OR isadmin = true
    )
);

CREATE POLICY "Users can insert own data" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = externalid::text
);

-- Allow user creation during signup
CREATE POLICY "Allow user creation during signup" ON public.users 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Admin policy
CREATE POLICY "Admins can manage all users" ON public.users 
FOR ALL 
USING (isadmin = true);

-- Create improved application policies
DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications;

CREATE POLICY "Users can view own applications" ON public.applications 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can insert own applications" ON public.applications 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can update own applications" ON public.applications 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

CREATE POLICY "Users can delete own applications" ON public.applications 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = (SELECT externalid FROM public.users WHERE id = userid)::text
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_externalid ON public.users(externalid);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_applications_userid ON public.applications(userid);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company ON public.applications(company);
CREATE INDEX IF NOT EXISTS idx_goals_userid ON public.goals(userid);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_userid ON public.privacy_settings(userid);

-- Create essential functions for user management
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Debug: Log the auth user ID
    RAISE NOTICE 'Creating user profile for auth user ID: %', NEW.id;
    
    -- Check if user already exists to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE externalid = NEW.id) THEN
        INSERT INTO public.users (externalid, email, display_name, createdat, updatedat)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NOW(),
            NOW()
        );
        RAISE NOTICE 'User profile created successfully for auth user ID: %', NEW.id;
    ELSE
        RAISE NOTICE 'User profile already exists for auth user ID: %', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to automatically create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the current_user_id function that the application needs
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS bigint AS $$
DECLARE
    user_id bigint;
BEGIN
    -- Get the user ID from the public.users table based on the current auth.uid()
    SELECT id INTO user_id 
    FROM public.users 
    WHERE externalid = auth.uid();
    
    RETURN user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user display name
CREATE OR REPLACE FUNCTION public.update_user_display_name(
    user_external_id text,
    new_display_name text
)
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET display_name = new_display_name, updatedat = NOW()
    WHERE externalid::text = user_external_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to export user data for GDPR compliance
CREATE OR REPLACE FUNCTION public.export_user_data(user_bigint bigint)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'user', (SELECT row_to_json(u) FROM public.users u WHERE u.id = user_bigint),
        'applications', (SELECT jsonb_agg(row_to_json(a)) FROM public.applications a WHERE a.userid = user_bigint),
        'goals', (SELECT jsonb_agg(row_to_json(g)) FROM public.goals g WHERE g.userid = user_bigint),
        'privacy_settings', (SELECT row_to_json(p) FROM public.privacy_settings p WHERE p.userid = user_bigint),
        'analytics_events', (SELECT jsonb_agg(row_to_json(e)) FROM public.analytics_events e WHERE e.userid = user_bigint),
        'user_metrics', (SELECT row_to_json(m) FROM public.user_metrics m WHERE m.userid = user_bigint),
        'backups', (SELECT jsonb_agg(row_to_json(b)) FROM public.backups b WHERE b.userid = user_bigint),
        'feedback', (SELECT jsonb_agg(row_to_json(f)) FROM public.feedback f WHERE f.userid = user_bigint),
        'export_date', now()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete all user data for GDPR "right to be forgotten"
CREATE OR REPLACE FUNCTION public.cleanup_user_data(user_bigint bigint)
RETURNS boolean AS $$
BEGIN
    -- Delete all user data in the correct order (respecting foreign keys)
    DELETE FROM public.analytics_events WHERE userid = user_bigint;
    DELETE FROM public.user_metrics WHERE userid = user_bigint;
    DELETE FROM public.user_sessions WHERE userid = user_bigint;
    DELETE FROM public.sync_status WHERE userid = user_bigint;
    DELETE FROM public.sync_errors WHERE userid = user_bigint;
    DELETE FROM public.backups WHERE userid = user_bigint;
    DELETE FROM public.feedback WHERE userid = user_bigint;
    DELETE FROM public.applications WHERE userid = user_bigint;
    DELETE FROM public.goals WHERE userid = user_bigint;
    DELETE FROM public.privacy_settings WHERE userid = user_bigint;
    DELETE FROM public.email_preferences WHERE userid = user_bigint;
    DELETE FROM public.admin_audit_log WHERE userid = user_bigint;
    
    -- Finally delete the user record
    DELETE FROM public.users WHERE id = user_bigint;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_display_name(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_user_data(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_user_data(bigint) TO authenticated;
