# 📧 Email Scheduling Setup Guide

## 🚀 How to Enable Automated Email Scheduling

### **Step 1: Access Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/ihlaenwiyxtmkehfoesg
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### **Step 2: Run the Scheduling Script**
1. Copy the entire contents of `enable-email-scheduling.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### **Step 3: Verify Schedules Are Created**
After running the script, you should see these scheduled jobs:

| Schedule Name | Frequency | Time (UTC) | Purpose |
|---------------|-----------|------------|---------|
| `weekly-goals-email` | Every Sunday | 9:00 AM | Weekly progress reports |
| `weekly-tips-email` | Every Wednesday | 10:00 AM | Job search tips |
| `monthly-analytics-email` | 1st of month | 8:00 AM | Monthly analytics |
| `inactivity-reminder-email` | Daily | 11:00 AM | Inactive user reminders |
| `milestone-check-email` | Daily | 12:00 PM | Achievement milestones |
| `weekly-achievement-summary-email` | Every Sunday | 2:00 PM | Weekly achievement summary |
| `followup-reminder-email` | Daily | 3:00 PM | Follow-up reminders |

### **Step 4: Check Email Preferences**
Make sure users have the right email preferences enabled:

```sql
-- Check current email preferences
SELECT 
    u.email,
    ep.weekly_goals,
    ep.weekly_tips,
    ep.monthly_analytics,
    ep.inactivity_reminders,
    ep.milestone_emails,
    ep.achievement_emails,
    ep.followup_reminders
FROM users u
LEFT JOIN email_preferences ep ON u.id = ep.userid
ORDER BY u.email;
```

### **Step 5: Test the Schedules**
You can manually trigger any schedule to test:

```sql
-- Test weekly goals email
SELECT send_weekly_goals_emails();

-- Test weekly tips email
SELECT send_weekly_tips_emails();

-- Test monthly analytics email
SELECT send_monthly_analytics_emails();

-- Test inactivity reminder email
SELECT send_inactivity_reminder_emails();

-- Test milestone check email
SELECT check_and_send_milestone_emails();

-- Test weekly achievement summary email
SELECT send_weekly_achievement_summary_emails();

-- Test follow-up reminder email
SELECT send_followup_reminder_emails();
```

## 🕐 **Schedule Timing Explained**

### **UTC Time Conversion**
- **UTC 9:00 AM** = 5:00 AM EST / 2:00 AM PST
- **UTC 10:00 AM** = 6:00 AM EST / 3:00 AM PST
- **UTC 11:00 AM** = 7:00 AM EST / 4:00 AM PST
- **UTC 12:00 PM** = 8:00 AM EST / 5:00 AM PST
- **UTC 2:00 PM** = 10:00 AM EST / 7:00 AM PST
- **UTC 3:00 PM** = 11:00 AM EST / 8:00 AM PST

### **Why These Times?**
- **Early morning UTC** = Late night/early morning in US (less email competition)
- **Spread out** = Avoids overwhelming users with multiple emails at once
- **Weekend focus** = Weekly emails on Sundays when users have time to read

## 🔧 **Managing Schedules**

### **View All Schedules**
```sql
SELECT 
    jobid,
    schedule,
    command,
    active,
    jobname
FROM cron.job 
ORDER BY jobid;
```

### **Disable a Schedule**
```sql
-- Disable weekly goals email
SELECT cron.unschedule('weekly-goals-email');
```

### **Re-enable a Schedule**
```sql
-- Re-enable weekly goals email
SELECT cron.schedule(
    'weekly-goals-email',
    '0 9 * * 0',
    'SELECT send_weekly_goals_emails();'
);
```

### **Change Schedule Time**
```sql
-- Change weekly goals to 10 AM UTC
SELECT cron.unschedule('weekly-goals-email');
SELECT cron.schedule(
    'weekly-goals-email',
    '0 10 * * 0', -- 10 AM UTC instead of 9 AM
    'SELECT send_weekly_goals_emails();'
);
```

## 📊 **Monitoring Email Sends**

### **Check Email Logs**
```sql
-- Check recent email sends (if you have logging set up)
SELECT * FROM email_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### **Check User Email Preferences**
```sql
-- See which users have which emails enabled
SELECT 
    u.email,
    u.display_name,
    ep.*
FROM users u
LEFT JOIN email_preferences ep ON u.id = ep.userid
WHERE u.email IS NOT NULL
ORDER BY u.email;
```

## ⚠️ **Important Notes**

1. **pg_cron Extension**: Must be enabled in your Supabase project
2. **Service Role Key**: Make sure it's set in your environment variables
3. **Email Preferences**: Users must have the right preferences enabled
4. **Timezone**: All schedules are in UTC
5. **Rate Limiting**: Be mindful of email service limits

## 🎉 **You're All Set!**

Once you run the script, your email automation will be live and working! Users will start receiving emails based on their preferences and activity.

**Next Steps:**
1. Run the SQL script
2. Test a few schedules manually
3. Monitor the first few automated sends
4. Adjust timing if needed
