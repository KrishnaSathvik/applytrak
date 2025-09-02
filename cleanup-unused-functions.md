# Cleanup Unused Edge Functions

## Functions to Delete

You can safely delete these 3 unused functions from your Supabase dashboard:

### 1. `weekly-goals` (Old/Duplicate)
- **Why delete**: This is an old version of `weekly-goals-email`
- **Last updated**: 8 days ago
- **Deployments**: 7
- **Action**: Delete from Supabase Dashboard → Functions

### 2. `test-email` (Testing Only)
- **Why delete**: This was just for testing purposes
- **Last updated**: 11 hours ago  
- **Deployments**: 1
- **Action**: Delete from Supabase Dashboard → Functions

### 3. `test-simple` (Testing Only)
- **Why delete**: This was just for testing purposes
- **Last updated**: 11 hours ago
- **Deployments**: 1
- **Action**: Delete from Supabase Dashboard → Functions

## How to Delete

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ihlaenwiyxtmkehfoesg/functions
2. Click on each function name
3. Click the "Delete" button
4. Confirm deletion

## After Cleanup

You'll have a clean set of **7 functions** that you actually use:

- welcome-email
- weekly-goals-email  
- weekly-tips-email
- monthly-analytics-email
- milestone-email
- inactivity-reminder-email
- email-preferences

## Benefits of Cleanup

- **Cleaner dashboard** - easier to manage
- **Reduced confusion** - no duplicate functions
- **Better organization** - only active functions visible
- **Cost optimization** - fewer functions to maintain
