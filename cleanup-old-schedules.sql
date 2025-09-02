-- Clean up old/duplicate cron jobs
-- Run this in Supabase SQL Editor to remove the old weekly-goals job

-- Remove the old weekly-goals job (jobid 2)
SELECT cron.unschedule('weekly-goals');

-- Verify remaining jobs
SELECT * FROM cron.job ORDER BY jobid;
