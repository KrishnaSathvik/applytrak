-- Optimize email schedules for better efficiency
-- Remove overly frequent daily checks and replace with smarter schedules

-- Remove the current daily schedules
SELECT cron.unschedule('inactivity-reminder-email');
SELECT cron.unschedule('milestone-check-email');

-- Create optimized schedules

-- 1. Weekly Goals Email (Sundays 9 AM) - KEEP AS IS
-- This is perfect for weekly progress reports

-- 2. Weekly Tips Email (Wednesdays 10 AM) - KEEP AS IS  
-- Good frequency for tips and insights

-- 3. Monthly Analytics Email (1st of month 8 AM) - KEEP AS IS
-- Perfect for monthly reports

-- 4. Inactivity Reminders - Run 3 times per week (Mon, Wed, Fri at 11 AM)
-- This is enough to catch users at 7, 14, 30 day intervals without being excessive
SELECT cron.schedule(
    'inactivity-reminder-email-optimized',
    '0 11 * * 1,3,5', -- Monday, Wednesday, Friday at 11 AM UTC
    'SELECT send_inactivity_reminder_emails();'
);

-- 5. Milestone Checks - Run twice per week (Tuesday, Thursday at 12 PM)
-- This is enough to catch most milestones without being excessive
SELECT cron.schedule(
    'milestone-check-email-optimized',
    '0 12 * * 2,4', -- Tuesday, Thursday at 12 PM UTC
    'SELECT check_and_send_milestone_emails();'
);

-- Show the new optimized schedule
SELECT * FROM cron.job ORDER BY jobid;
