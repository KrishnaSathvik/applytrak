-- Cloud Achievements Migration
-- This migration adds achievement system tables to Supabase without affecting existing data

-- 1. Create achievements table (static achievement definitions)
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('milestone', 'streak', 'goal', 'time', 'quality', 'special')),
    tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'legendary')),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    icon TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_achievements table (tracks which achievements each user has unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 3. Create user_stats table (tracks user's achievement progress and stats)
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    achievements_unlocked INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- 5. Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Add updated_at triggers
CREATE TRIGGER update_achievements_updated_at 
    BEFORE UPDATE ON achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert all achievement definitions
INSERT INTO achievements (id, name, description, category, tier, rarity, icon, xp_reward, requirements) VALUES
-- Milestone Achievements
('first_application', 'First Steps', 'Submit your first job application', 'milestone', 'bronze', 'common', 'Target', 10, '[{"type": "applications", "value": 1, "description": "Submit 1 application"}]'),
('ten_applications', 'Getting Started', 'Submit 10 job applications', 'milestone', 'bronze', 'common', 'Target', 25, '[{"type": "applications", "value": 10, "description": "Submit 10 applications"}]'),
('fifty_applications', 'Job Hunter', 'Submit 50 job applications', 'milestone', 'silver', 'uncommon', 'Target', 50, '[{"type": "applications", "value": 50, "description": "Submit 50 applications"}]'),
('hundred_applications', 'Application Master', 'Submit 100 job applications', 'milestone', 'gold', 'rare', 'Target', 100, '[{"type": "applications", "value": 100, "description": "Submit 100 applications"}]'),
('five_hundred_applications', 'Job Search Legend', 'Submit 500 job applications', 'milestone', 'platinum', 'epic', 'Target', 250, '[{"type": "applications", "value": 500, "description": "Submit 500 applications"}]'),
('thousand_applications', 'Legendary Job Seeker', 'Submit 1000 job applications - The ultimate achievement!', 'milestone', 'legendary', 'legendary', 'Crown', 1000, '[{"type": "applications", "value": 1000, "description": "Submit 1000 applications"}]'),
('first_interview', 'First Interview', 'Get your first job interview', 'milestone', 'silver', 'uncommon', 'Video', 75, '[{"type": "applications", "value": 1, "description": "Get 1 interview"}]'),
('first_offer', 'First Offer', 'Receive your first job offer', 'milestone', 'gold', 'rare', 'Award', 150, '[{"type": "applications", "value": 1, "description": "Receive 1 job offer"}]'),

-- Streak Achievements
('three_day_streak', 'Getting Started', 'Maintain a 3-day application streak', 'streak', 'bronze', 'common', 'Flame', 15, '[{"type": "streak", "value": 3, "description": "Maintain 3-day streak"}]'),
('week_streak', 'Consistent', 'Maintain a 7-day application streak', 'streak', 'silver', 'uncommon', 'Flame', 30, '[{"type": "streak", "value": 7, "description": "Maintain 7-day streak"}]'),
('month_streak', 'Dedicated', 'Maintain a 30-day application streak', 'streak', 'gold', 'rare', 'Flame', 75, '[{"type": "streak", "value": 30, "description": "Maintain 30-day streak"}]'),

-- Goal Achievements
('weekly_goal_achiever', 'Weekly Warrior', 'Complete your weekly goal', 'goal', 'bronze', 'common', 'Award', 25, '[{"type": "goals", "value": 1, "description": "Complete 1 weekly goal"}]'),
('monthly_goal_achiever', 'Monthly Crusher', 'Complete your monthly goal', 'goal', 'silver', 'uncommon', 'Award', 50, '[{"type": "goals", "value": 1, "description": "Complete 1 monthly goal"}]'),
('goal_overachiever', 'Overachiever', 'Exceed your weekly goal by 50%', 'goal', 'gold', 'rare', 'TrendingUp', 75, '[{"type": "goals", "value": 1, "description": "Exceed weekly goal by 50%"}]'),

-- Time Achievements
('early_bird', 'Early Bird', 'Submit an application before 9 AM', 'time', 'bronze', 'common', 'Sunrise', 10, '[{"type": "time", "value": 1, "description": "Apply before 9 AM"}]'),
('night_owl', 'Night Owl', 'Submit an application after 8 PM', 'time', 'bronze', 'common', 'Moon', 10, '[{"type": "time", "value": 1, "description": "Apply after 8 PM"}]'),

-- Quality Achievements
('cover_letter_pro', 'Cover Letter Pro', 'Upload cover letter attachments to 10 applications', 'quality', 'silver', 'uncommon', 'FileText', 30, '[{"type": "quality", "value": 10, "description": "Upload cover letter attachments to 10 applications"}]'),
('resume_optimizer', 'Resume Optimizer', 'Upload resume attachments to 10 applications', 'quality', 'gold', 'rare', 'FileEdit', 40, '[{"type": "quality", "value": 10, "description": "Upload resume attachments to 10 applications"}]'),
('remote_seeker', 'Remote Seeker', 'Apply to 10 remote positions', 'quality', 'silver', 'uncommon', 'Home', 25, '[{"type": "quality", "value": 10, "description": "Apply to 10 remote positions"}]'),
('note_taker', 'Note Taker', 'Add notes to 10 applications', 'quality', 'bronze', 'common', 'FileText', 30, '[{"type": "quality", "value": 10, "description": "Add notes to 10 applications"}]'),

-- Special Achievements
('faang_hunter', 'FAANG Hunter', 'Apply to 5 FAANG companies', 'special', 'gold', 'rare', 'Trophy', 100, '[{"type": "applications", "value": 5, "description": "Apply to 5 FAANG companies"}]'),
('achievement_collector', 'Achievement Collector', 'Unlock 5 achievements', 'special', 'platinum', 'epic', 'Trophy', 150, '[{"type": "applications", "value": 5, "description": "Unlock 5 achievements"}]')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    tier = EXCLUDED.tier,
    rarity = EXCLUDED.rarity,
    icon = EXCLUDED.icon,
    xp_reward = EXCLUDED.xp_reward,
    requirements = EXCLUDED.requirements,
    updated_at = NOW();

-- 8. Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Achievements table: Everyone can read, only system can write
CREATE POLICY "Anyone can read achievements" ON achievements FOR SELECT USING (true);

-- User achievements: Users can only see their own achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User stats: Users can only see and update their own stats
CREATE POLICY "Users can view their own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);

-- 10. Create helper functions
CREATE OR REPLACE FUNCTION get_user_achievements(user_uuid UUID)
RETURNS TABLE (
    achievement_id TEXT,
    name TEXT,
    description TEXT,
    category TEXT,
    tier TEXT,
    rarity TEXT,
    icon TEXT,
    xp_reward INTEGER,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    is_unlocked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.category,
        a.tier,
        a.rarity,
        a.icon,
        a.xp_reward,
        ua.unlocked_at,
        (ua.unlocked_at IS NOT NULL) as is_unlocked
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = user_uuid
    ORDER BY a.category, a.tier, a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_xp INTEGER,
    current_level INTEGER,
    achievements_unlocked INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(us.total_xp, 0),
        COALESCE(us.current_level, 1),
        COALESCE(us.achievements_unlocked, 0)
    FROM user_stats us
    WHERE us.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to unlock achievement
CREATE OR REPLACE FUNCTION unlock_achievement(user_uuid UUID, achievement_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    achievement_xp INTEGER;
    current_xp INTEGER;
    new_level INTEGER;
BEGIN
    -- Get achievement XP reward
    SELECT xp_reward INTO achievement_xp FROM achievements WHERE id = achievement_id_param;
    
    -- Insert user achievement (ignore if already exists)
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (user_uuid, achievement_id_param)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Update user stats
    INSERT INTO user_stats (user_id, total_xp, achievements_unlocked, current_level)
    VALUES (user_uuid, achievement_xp, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = user_stats.total_xp + achievement_xp,
        achievements_unlocked = user_stats.achievements_unlocked + 1,
        last_updated = NOW();
    
    -- Calculate new level based on total XP
    SELECT total_xp INTO current_xp FROM user_stats WHERE user_id = user_uuid;
    new_level := FLOOR(current_xp / 100) + 1; -- 100 XP per level
    
    UPDATE user_stats SET current_level = new_level WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to check and unlock achievements for existing applications
CREATE OR REPLACE FUNCTION check_user_achievements(
    user_uuid UUID,
    applications_data JSONB,
    daily_streak INTEGER DEFAULT 0,
    weekly_progress INTEGER DEFAULT 0,
    monthly_progress INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    newly_unlocked JSONB := '[]'::jsonb;
    app_count INTEGER;
    interview_count INTEGER;
    offer_count INTEGER;
    remote_count INTEGER;
    cover_letter_count INTEGER;
    resume_count INTEGER;
    note_count INTEGER;
    faang_count INTEGER;
    achievement_record RECORD;
BEGIN
    -- Parse applications data
    app_count := jsonb_array_length(applications_data);
    
    -- Count different types of applications
    SELECT 
        COUNT(*) FILTER (WHERE (value->>'status') = 'Interview'),
        COUNT(*) FILTER (WHERE (value->>'status') = 'Offer'),
        COUNT(*) FILTER (WHERE (value->>'type') = 'Remote'),
        COUNT(*) FILTER (WHERE jsonb_array_length(value->'attachments') > 0 AND 
            EXISTS (SELECT 1 FROM jsonb_array_elements(value->'attachments') AS att 
                   WHERE (att->>'name') ILIKE '%cover%')),
        COUNT(*) FILTER (WHERE jsonb_array_length(value->'attachments') > 0 AND 
            EXISTS (SELECT 1 FROM jsonb_array_elements(value->'attachments') AS att 
                   WHERE (att->>'name') ILIKE '%resume%')),
        COUNT(*) FILTER (WHERE (value->>'notes') IS NOT NULL AND (value->>'notes') != ''),
        COUNT(*) FILTER (WHERE (value->>'company') ILIKE ANY(ARRAY['%google%', '%apple%', '%microsoft%', '%amazon%', '%meta%', '%netflix%']))
    INTO interview_count, offer_count, remote_count, cover_letter_count, resume_count, note_count, faang_count
    FROM jsonb_array_elements(applications_data);

    -- Check milestone achievements
    FOR achievement_record IN 
        SELECT * FROM achievements WHERE category = 'milestone'
    LOOP
        CASE achievement_record.id
            WHEN 'first_application' THEN
                IF app_count >= 1 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'first_application') THEN
                    PERFORM unlock_achievement(user_uuid, 'first_application');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'first_application', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
            WHEN 'ten_applications' THEN
                IF app_count >= 10 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'ten_applications') THEN
                    PERFORM unlock_achievement(user_uuid, 'ten_applications');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'ten_applications', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
            WHEN 'fifty_applications' THEN
                IF app_count >= 50 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'fifty_applications') THEN
                    PERFORM unlock_achievement(user_uuid, 'fifty_applications');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'fifty_applications', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
            WHEN 'hundred_applications' THEN
                IF app_count >= 100 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'hundred_applications') THEN
                    PERFORM unlock_achievement(user_uuid, 'hundred_applications');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'hundred_applications', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
            WHEN 'first_interview' THEN
                IF interview_count >= 1 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'first_interview') THEN
                    PERFORM unlock_achievement(user_uuid, 'first_interview');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'first_interview', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
            WHEN 'first_offer' THEN
                IF offer_count >= 1 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'first_offer') THEN
                    PERFORM unlock_achievement(user_uuid, 'first_offer');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'first_offer', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
        END CASE;
    END LOOP;

    -- Check quality achievements
    FOR achievement_record IN 
        SELECT * FROM achievements WHERE category = 'quality'
    LOOP
        CASE achievement_record.id
            WHEN 'cover_letter_pro' THEN
                IF cover_letter_count >= 10 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'cover_letter_pro') THEN
                    PERFORM unlock_achievement(user_uuid, 'cover_letter_pro');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'cover_letter_pro', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
            WHEN 'resume_optimizer' THEN
                IF resume_count >= 10 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'resume_optimizer') THEN
                    PERFORM unlock_achievement(user_uuid, 'resume_optimizer');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'resume_optimizer', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
            WHEN 'remote_seeker' THEN
                IF remote_count >= 10 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'remote_seeker') THEN
                    PERFORM unlock_achievement(user_uuid, 'remote_seeker');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'remote_seeker', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
            WHEN 'note_taker' THEN
                IF note_count >= 10 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'note_taker') THEN
                    PERFORM unlock_achievement(user_uuid, 'note_taker');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'note_taker', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
        END CASE;
    END LOOP;

    -- Check special achievements
    FOR achievement_record IN 
        SELECT * FROM achievements WHERE category = 'special'
    LOOP
        CASE achievement_record.id
            WHEN 'faang_hunter' THEN
                IF faang_count >= 5 AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'faang_hunter') THEN
                    PERFORM unlock_achievement(user_uuid, 'faang_hunter');
                    newly_unlocked := newly_unlocked || jsonb_build_object('id', 'faang_hunter', 'name', achievement_record.name, 'xp', achievement_record.xp_reward);
                END IF;
        END CASE;
    END LOOP;

    RETURN newly_unlocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE achievements IS 'Static achievement definitions';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements each user has unlocked';
COMMENT ON TABLE user_stats IS 'User achievement statistics and progress';
COMMENT ON FUNCTION get_user_achievements(UUID) IS 'Get all achievements for a user with unlock status';
COMMENT ON FUNCTION get_user_stats(UUID) IS 'Get user achievement statistics';
COMMENT ON FUNCTION unlock_achievement(UUID, TEXT) IS 'Unlock an achievement for a user and update stats';
COMMENT ON FUNCTION check_user_achievements(UUID, JSONB, INTEGER, INTEGER, INTEGER) IS 'Check and unlock achievements based on user data';
