# ApplyTrak Email Automation Setup Guide

## 🚀 Functions Deployed Successfully!

All Supabase Edge Functions have been deployed to production:

- ✅ **welcome-email** - Sent after email verification
- ✅ **weekly-goals-email** - Weekly progress reports
- ✅ **weekly-tips-email** - Job search tips and insights
- ✅ **monthly-analytics-email** - Monthly performance reports
- ✅ **milestone-email** - Achievement celebrations
- ✅ **inactivity-reminder-email** - Re-engagement campaigns
- ✅ **email-preferences** - User preference management

## 📅 Setting Up Automated Schedules

### Step 1: Run the Setup Script

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ihlaenwiyxtmkehfoesg
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup-email-schedules.sql`
4. Click **Run** to execute the script

### Step 2: Verify Schedules Are Created

After running the script, you should see these scheduled jobs:

| Schedule Name | Frequency | Time (UTC) | Purpose |
|---------------|-----------|------------|---------|
| `weekly-goals-email` | Every Sunday | 9:00 AM | Send weekly progress reports |
| `weekly-tips-email` | Every Wednesday | 10:00 AM | Send job search tips |
| `monthly-analytics-email` | 1st of month | 8:00 AM | Send monthly analytics |
| `inactivity-reminder-email` | Daily | 11:00 AM | Check for inactive users |
| `milestone-check-email` | Daily | 12:00 PM | Check for achievements |

### Step 3: Test the Functions

You can test individual functions using curl:

```bash
# Test welcome email
curl -X POST https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Test weekly goals email
curl -X POST https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/weekly-goals-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Test weekly tips email
curl -X POST https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/weekly-tips-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Test monthly analytics email
curl -X POST https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/monthly-analytics-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Test milestone email
curl -X POST https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/milestone-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "milestoneType": "applications", "milestoneValue": 25}'

# Test inactivity reminder email
curl -X POST https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/inactivity-reminder-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "daysInactive": 7}'
```

## 📊 Email Preferences Database Schema

The system uses the `email_preferences` table to control which users receive which emails:

```sql
CREATE TABLE email_preferences (
  userid bigint REFERENCES users(id) PRIMARY KEY,
  weekly_goals boolean DEFAULT true,
  weekly_tips boolean DEFAULT true,
  monthly_analytics boolean DEFAULT true,
  milestone_emails boolean DEFAULT true,
  inactivity_reminders boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## 🎯 How the Automation Works

### Weekly Goals Email (Sundays 9 AM UTC)
- Sends progress reports to users with `weekly_goals = true`
- Includes application counts, interview stats, and goal progress
- Personalized based on user's actual data

### Weekly Tips Email (Wednesdays 10 AM UTC)
- Sends job search tips and insights
- Includes personalized recommendations
- Based on user's application patterns and success rates

### Monthly Analytics Email (1st of month 8 AM UTC)
- Comprehensive monthly performance reports
- Success rates, trends, and recommendations
- Goal achievement tracking

### Milestone Emails (Daily 12 PM UTC)
- Automatically detects achievements:
  - Every 10 applications submitted
  - Every 5 interviews scheduled/completed
- Sends celebratory emails with progress tracking

### Inactivity Reminders (Daily 11 AM UTC)
- Checks for users inactive for 7, 14, or 30 days
- Sends re-engagement emails with personalized content
- Includes pending follow-up reminders

## 🔧 Environment Variables Required

Make sure these are set in your Supabase project:

```bash
RESEND_API_KEY=your_resend_api_key
SB_URL=https://ihlaenwiyxtmkehfoesg.supabase.co
SB_SERVICE_ROLE_KEY=your_service_role_key
APPLYTRAK_LOGO_URL=https://applytrak.com/favicon.svg
APPLYTRAK_APP_URL=https://applytrak.com
APPLYTRAK_PREFS_ENDPOINT=https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/email-preferences
```

## 📈 Monitoring and Logs

### View Function Logs
1. Go to Supabase Dashboard → Functions
2. Click on any function to view logs
3. Check for errors or successful executions

### View Cron Job Status
```sql
-- Check all scheduled jobs
SELECT * FROM cron.job;

-- Check job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Manual Function Execution
You can manually trigger any scheduled function:

```sql
-- Send weekly goals emails now
SELECT send_weekly_goals_emails();

-- Send weekly tips emails now
SELECT send_weekly_tips_emails();

-- Send monthly analytics emails now
SELECT send_monthly_analytics_emails();

-- Check for milestones now
SELECT check_and_send_milestone_emails();

-- Check for inactive users now
SELECT send_inactivity_reminder_emails();
```

## 🚨 Troubleshooting

### Common Issues

1. **Functions not sending emails**
   - Check Resend API key is valid
   - Verify environment variables are set
   - Check function logs for errors

2. **Schedules not running**
   - Ensure `pg_cron` extension is enabled
   - Check if cron jobs are created: `SELECT * FROM cron.job;`
   - Verify database permissions

3. **Users not receiving emails**
   - Check email preferences in database
   - Verify user has valid email address
   - Check if user has opted out

### Debug Commands

```sql
-- Check if extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'http');

-- Check email preferences for a user
SELECT u.email, ep.* 
FROM users u 
JOIN email_preferences ep ON u.id = ep.userid 
WHERE u.email = 'user@example.com';

-- Check recent function calls
SELECT * FROM cron.job_run_details 
WHERE jobname LIKE '%email%' 
ORDER BY start_time DESC 
LIMIT 5;
```

## 🎉 Success!

Once everything is set up, your ApplyTrak users will automatically receive:

- **Welcome emails** after email verification ✅
- **Weekly progress reports** every Sunday ✅
- **Job search tips** every Wednesday ✅
- **Monthly analytics** on the 1st of each month ✅
- **Milestone celebrations** when they hit achievements ✅
- **Re-engagement emails** when they become inactive ✅

All emails respect user preferences and include beautiful, responsive templates that match your app's design!
