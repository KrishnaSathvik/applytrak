-- Migration script to rename displayname column to display_name
-- Run this in your Supabase SQL editor or database

-- Rename the column from displayname to display_name
ALTER TABLE public.users RENAME COLUMN displayname TO display_name;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public' 
AND column_name IN ('display_name', 'displayname');

-- Optional: Add a comment to document the change
COMMENT ON COLUMN public.users.display_name IS 'User display name for the application interface';
