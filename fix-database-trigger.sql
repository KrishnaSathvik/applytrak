-- Fix the database trigger issue
-- The trigger is trying to update a field that doesn't exist

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;

-- Recreate the trigger function to handle missing fields gracefully
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updated_at if the field exists
    IF TG_TABLE_NAME = 'achievements' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'achievements' AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at = NOW();
    ELSIF TG_TABLE_NAME = 'user_stats' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_stats' AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER update_achievements_updated_at 
    BEFORE UPDATE ON achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
