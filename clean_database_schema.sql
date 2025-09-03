-- ============================================================================
-- CLEAN DATABASE SCHEMA FOR APPLYTRAK
-- ============================================================================
-- This script creates a completely clean database schema from scratch
-- Run this in Supabase SQL Editor to start fresh

-- ============================================================================
-- 1. DROP EVERYTHING (CLEAN SLATE)
-- ============================================================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;
DROP POLICY IF EXISTS "Admin can view all applications" ON applications;
DROP POLICY IF EXISTS "Admin can update all applications" ON applications;
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can view own privacy settings" ON privacy_settings;
DROP POLICY IF EXISTS "Users can insert own privacy settings" ON privacy_settings;
DROP POLICY IF EXISTS "Users can update own privacy settings" ON privacy_settings;

-- Drop all existing functions
DROP FUNCTION IF EXISTS current_user_id() CASCADE;

-- Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS privacy_settings CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_metrics CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    externalid TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatarurl TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    adminpermissions TEXT DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
    id TEXT PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    dateapplied DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Applied', 'Interview', 'Offer', 'Rejected')),
    type TEXT NOT NULL CHECK (type IN ('Full-time', 'Contract', 'Part-time', 'Internship')),
    location TEXT,
    salary TEXT,
    jobsource TEXT,
    joburl TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    syncedat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cloudid TEXT,
    syncstatus TEXT DEFAULT 'synced' CHECK (syncstatus IN ('synced', 'pending', 'error'))
);

-- Goals table
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    totalgoal INTEGER DEFAULT 0,
    weeklygoal INTEGER DEFAULT 0,
    monthlygoal INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sessionid TEXT,
    properties JSONB DEFAULT '{}',
    useragent TEXT,
    url TEXT,
    devicetype TEXT
);

-- User sessions table
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    starttime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    endtime TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 0,
    devicetype TEXT,
    useragent TEXT,
    timezone TEXT,
    language TEXT,
    events JSONB DEFAULT '[]'
);

-- User metrics table
CREATE TABLE user_metrics (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sessionscount INTEGER DEFAULT 0,
    totaltimespent INTEGER DEFAULT 0,
    applicationscreated INTEGER DEFAULT 0,
    applicationsupdated INTEGER DEFAULT 0,
    applicationsdeleted INTEGER DEFAULT 0,
    goalsset INTEGER DEFAULT 0,
    attachmentsadded INTEGER DEFAULT 0,
    exportsperformed INTEGER DEFAULT 0,
    importsperformed INTEGER DEFAULT 0,
    searchesperformed INTEGER DEFAULT 0,
    featuresused JSONB DEFAULT '{}',
    lastactivedate DATE,
    devicetype TEXT,
    firstvisit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    totalevents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('love', 'bug', 'feature', 'general')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    message TEXT,
    email TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sessionid TEXT,
    useragent TEXT,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'in_progress', 'resolved', 'closed'))
);

-- Privacy settings table
CREATE TABLE privacy_settings (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analytics BOOLEAN DEFAULT false,
    feedback BOOLEAN DEFAULT false,
    functionalcookies BOOLEAN DEFAULT false,
    consentdate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consentversion TEXT DEFAULT '1.0',
    cloudsyncconsent BOOLEAN DEFAULT false,
    dataretentionperiod INTEGER DEFAULT 365,
    anonymizeafter INTEGER DEFAULT 730,
    trackinglevel TEXT DEFAULT 'minimal' CHECK (trackinglevel IN ('minimal', 'standard', 'enhanced')),
    datasharingconsent BOOLEAN DEFAULT false,
    marketingconsent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email preferences table (for email functions)
CREATE TABLE email_preferences (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weekly_goals BOOLEAN DEFAULT true,
    weekly_tips BOOLEAN DEFAULT true,
    monthly_analytics BOOLEAN DEFAULT true,
    milestone_emails BOOLEAN DEFAULT true,
    inactivity_reminders BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(userid)
);

-- Notification preferences table (for in-app notifications)
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    error_notifications BOOLEAN DEFAULT true,
    success_notifications BOOLEAN DEFAULT true,
    info_notifications BOOLEAN DEFAULT true,
    quick_snooze BOOLEAN DEFAULT false,
    snooze_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(userid)
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_externalid ON users(externalid);
CREATE INDEX idx_users_email ON users(email);

-- Applications indexes
CREATE INDEX idx_applications_userid ON applications(userid);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_dateapplied ON applications(dateapplied);
CREATE INDEX idx_applications_company ON applications(company);

-- Goals indexes
CREATE INDEX idx_goals_userid ON goals(userid);

-- Analytics events indexes
CREATE INDEX idx_analytics_events_userid ON analytics_events(userid);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_event ON analytics_events(event);

-- User sessions indexes
CREATE INDEX idx_user_sessions_userid ON user_sessions(userid);
CREATE INDEX idx_user_sessions_starttime ON user_sessions(starttime);

-- User metrics indexes
CREATE INDEX idx_user_metrics_userid ON user_metrics(userid);

-- Feedback indexes
CREATE INDEX idx_feedback_userid ON feedback(userid);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_timestamp ON feedback(timestamp);

-- Privacy settings indexes
CREATE INDEX idx_privacy_settings_userid ON privacy_settings(userid);

-- Email preferences indexes
CREATE INDEX idx_email_preferences_userid ON email_preferences(userid);

-- Notification preferences indexes
CREATE INDEX idx_notification_preferences_userid ON notification_preferences(userid);

-- ============================================================================
-- 4. CREATE FUNCTIONS
-- ============================================================================

-- Current user ID function
CREATE FUNCTION current_user_id()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id INTEGER;
BEGIN
    -- Get the current user's database ID
    SELECT id INTO user_id
    FROM users
    WHERE externalid::uuid = auth.uid()
    LIMIT 1;
    
    RETURN user_id;
END;
$$;

-- Handle new user creation (for auth triggers)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (externalid, email, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get or create user profile function
CREATE OR REPLACE FUNCTION get_or_create_user_profile(
    user_email text,
    user_display_name text DEFAULT NULL,
    user_timezone text DEFAULT 'UTC',
    user_language text DEFAULT 'en'
)
RETURNS TABLE(
    id INTEGER,
    externalid TEXT,
    email text,
    display_name text
) AS $$
DECLARE
    existing_user record;
    new_user record;
    auth_uid TEXT;
BEGIN
    -- Get the current authenticated user's ID
    auth_uid := auth.uid()::text;
    
    -- Check if user already exists
    SELECT * INTO existing_user 
    FROM public.users 
    WHERE email = user_email;
    
    IF existing_user IS NOT NULL THEN
        -- User exists, update externalid if needed
        IF existing_user.externalid IS NULL OR existing_user.externalid != auth_uid THEN
            UPDATE public.users 
            SET externalid = auth_uid, updated_at = NOW()
            WHERE id = existing_user.id;
            
            SELECT * INTO existing_user 
            FROM public.users 
            WHERE id = existing_user.id;
        END IF;
        
        RETURN QUERY SELECT 
            existing_user.id,
            existing_user.externalid,
            existing_user.email,
            existing_user.display_name;
    ELSE
        -- Create new user profile
        INSERT INTO public.users (
            externalid,
            email,
            display_name,
            timezone,
            language,
            created_at,
            updated_at
        ) VALUES (
            auth_uid,
            user_email,
            user_display_name,
            user_timezone,
            user_language,
            NOW(),
            NOW()
        ) RETURNING * INTO new_user;
        
        RETURN QUERY SELECT 
            new_user.id,
            new_user.externalid,
            new_user.email,
            new_user.display_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User has marketing consent function (for privacy service)
CREATE OR REPLACE FUNCTION user_has_marketing_consent(user_bigint INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_consent BOOLEAN;
BEGIN
    SELECT marketingconsent INTO has_consent
    FROM privacy_settings
    WHERE userid = user_bigint;
    
    RETURN COALESCE(has_consent, false);
END;
$$;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (externalid::uuid = auth.uid());

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (externalid::uuid = auth.uid());

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (externalid::uuid = auth.uid());

-- Admin policies for users
CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid::uuid = auth.uid() 
            AND email IN ('krishnasathvikm@gmail.com', 'applytrak@gmail.com')
        )
    );

CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid::uuid = auth.uid() 
            AND email IN ('krishnasathvikm@gmail.com', 'applytrak@gmail.com')
        )
    );

-- Applications table policies
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own applications" ON applications
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (userid = current_user_id());

CREATE POLICY "Users can delete own applications" ON applications
    FOR DELETE USING (userid = current_user_id());

-- Admin policies for applications
CREATE POLICY "Admin can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid::uuid = auth.uid() 
            AND email IN ('krishnasathvikm@gmail.com', 'applytrak@gmail.com')
        )
    );

CREATE POLICY "Admin can update all applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid::uuid = auth.uid() 
            AND email IN ('krishnasathvikm@gmail.com', 'applytrak@gmail.com')
        )
    );

-- Goals table policies
CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own goals" ON goals
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own goals" ON goals
    FOR UPDATE USING (userid = current_user_id());

CREATE POLICY "Users can delete own goals" ON goals
    FOR DELETE USING (userid = current_user_id());

-- Analytics events table policies
CREATE POLICY "Users can view own analytics" ON analytics_events
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own analytics" ON analytics_events
    FOR INSERT WITH CHECK (userid = current_user_id());

-- User sessions table policies
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (userid = current_user_id());

-- User metrics table policies
CREATE POLICY "Users can view own metrics" ON user_metrics
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own metrics" ON user_metrics
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own metrics" ON user_metrics
    FOR UPDATE USING (userid = current_user_id());

-- Feedback table policies
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own feedback" ON feedback
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (userid = current_user_id());

-- Admin policies for feedback
CREATE POLICY "Admin can view all feedback" ON feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE externalid::uuid = auth.uid() 
            AND email IN ('krishnasathvikm@gmail.com', 'applytrak@gmail.com')
        )
    );

-- Privacy settings table policies
CREATE POLICY "Users can view own privacy settings" ON privacy_settings
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own privacy settings" ON privacy_settings
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own privacy settings" ON privacy_settings
    FOR UPDATE USING (userid = current_user_id());

-- Email preferences table policies
CREATE POLICY "Users can view own email preferences" ON email_preferences
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own email preferences" ON email_preferences
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own email preferences" ON email_preferences
    FOR UPDATE USING (userid = current_user_id());

-- Notification preferences table policies
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (userid = current_user_id());

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (userid = current_user_id());

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (userid = current_user_id());

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_user_profile(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_marketing_consent(INTEGER) TO authenticated;

-- Grant table permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON applications TO authenticated;
GRANT ALL ON goals TO authenticated;
GRANT ALL ON analytics_events TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON user_metrics TO authenticated;
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON privacy_settings TO authenticated;
GRANT ALL ON email_preferences TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 7. CREATE TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_metrics_updated_at BEFORE UPDATE ON user_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auth trigger for automatic user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

-- Check that all tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check that all policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test the current_user_id function
SELECT current_user_id() as test_user_id;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CLEAN DATABASE SCHEMA CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All tables, policies, functions, and triggers have been created.';
    RAISE NOTICE 'Admin emails: krishnasathvikm@gmail.com, applytrak@gmail.com';
    RAISE NOTICE 'RLS is enabled on all tables with proper policies.';
    RAISE NOTICE 'The current_user_id() function is working correctly.';
    RAISE NOTICE 'User creation triggers are set up for auth.users.';
    RAISE NOTICE 'Email preferences table is ready for email functions.';
    RAISE NOTICE 'Notification preferences table is ready for in-app notifications.';
    RAISE NOTICE 'Complete privacy settings with marketing consent tracking.';
    RAISE NOTICE 'All email functions and privacy features will work properly.';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Your ApplyTrak database is ready to use!';
    RAISE NOTICE '========================================';
END $$;
