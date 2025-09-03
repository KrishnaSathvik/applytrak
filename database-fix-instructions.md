# Database Fix Instructions

## 🚨 **Critical: You Must Run the Database Fix Script**

The errors you're seeing indicate that the database schema is missing key components. Here's how to fix it:

## **Step 1: Run the Comprehensive Database Fix**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/ihlaenwiyxtmkehfoesg
2. **Navigate to SQL Editor**
3. **Copy the entire contents of `comprehensive-database-fix.sql`**
4. **Paste it into the SQL Editor**
5. **Click "Run" to execute the script**

## **Step 2: Verify the Fix (Optional)**

1. **In the same SQL Editor, run the contents of `test-database-setup.sql`**
2. **Check that all queries return results without errors**

## **What the Fix Does:**

### ✅ **Creates Missing Table**
- Creates `notification_preferences` table with proper structure
- Adds unique constraint on `userid`
- Sets up proper indexes

### ✅ **Fixes Database Functions**
- Updates `cleanup_user_data` function to handle missing tables
- Ensures `current_user_id` function works properly
- Creates `update_user_display_name` function

### ✅ **Sets Up Permissions**
- Grants proper permissions to authenticated users
- Sets up Row Level Security (RLS) policies
- Ensures all functions are accessible

### ✅ **Fixes Code Issues**
- Updated notification preferences upsert to handle conflicts
- Added proper `onConflict` handling for unique constraints

## **After Running the Fix:**

### **Quick Snooze Should Work:**
- 15m, 1h, 4h buttons will update notification preferences
- No more 409 conflict errors

### **Delete Account Should Work:**
- Will properly delete all user data
- No more 400 errors from cleanup function

### **Display Name Should Work:**
- Will show the name from signup
- Can be edited and saved properly

## **If You Still Get Errors:**

1. **Check the SQL Editor output** for any error messages
2. **Run the test script** to verify what's working
3. **Check the browser console** for specific error details

## **Common Issues:**

- **"Table doesn't exist"**: The fix script didn't run completely
- **"Permission denied"**: RLS policies aren't set up properly
- **"Function doesn't exist"**: Functions weren't created properly

## **Need Help?**

If you're still having issues after running the fix script, share:
1. The output from the SQL Editor
2. Any error messages from the test script
3. The specific error messages from the browser console

The fix script addresses all the database schema issues that are causing the 400 and 409 errors you're seeing.
