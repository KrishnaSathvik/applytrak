-- Reset user achievements to fix incorrect unlocks
-- This will remove all unlocked achievements for all users and let them re-unlock correctly

-- Delete all user achievements (this will reset everything)
DELETE FROM user_achievements;

-- Reset user stats
UPDATE user_stats SET 
    total_xp = 0,
    current_level = 1,
    achievements_unlocked = 0,
    last_updated = NOW();

-- Optional: If you want to reset for a specific user only, use this instead:
-- Replace 'YOUR_USER_ID' with the actual user ID
-- DELETE FROM user_achievements WHERE user_id = 'YOUR_USER_ID';
-- UPDATE user_stats SET 
--     total_xp = 0,
--     current_level = 1,
--     achievements_unlocked = 0,
--     last_updated = NOW()
-- WHERE user_id = 'YOUR_USER_ID';

-- After running this, users will need to re-unlock achievements based on their actual progress
