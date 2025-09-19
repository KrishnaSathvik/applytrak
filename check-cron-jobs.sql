-- Check current cron jobs
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active,
    nodename,
    nodeport,
    database,
    username
FROM cron.job
ORDER BY jobid;

-- Check if weekly-goals-email job exists
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
WHERE jobname = 'weekly-goals-email';

-- Check pg_cron extension status
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
