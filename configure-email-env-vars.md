# Email Functions Environment Variables Setup

## 🎯 Required Environment Variables

Your Supabase Edge Functions need these environment variables to work:

### **Essential Variables (Required):**

1. **`RESEND_API_KEY`** - Your Resend API key for sending emails
2. **`SB_URL`** - Your Supabase project URL
3. **`SB_SERVICE_ROLE_KEY`** - Your Supabase service role key

### **Optional Variables (Have Defaults):**

4. **`APPLYTRAK_LOGO_URL`** - Logo URL (defaults to https://www.applytrak.com/logo.png)
5. **`APPLYTRAK_APP_URL`** - App URL (defaults to https://applytrak.com)
6. **`APPLYTRAK_PREFS_ENDPOINT`** - Email preferences endpoint

## 🔧 How to Configure

### **Step 1: Get Your Supabase Credentials**

Your Supabase project details:
- **Project URL**: `https://ihlaenwiyxtmkehfoesg.supabase.co`
- **Project Reference**: `ihlaenwiyxtmkehfoesg`

### **Step 2: Get Resend API Key**

1. Go to [Resend.com](https://resend.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `re_`)

### **Step 3: Set Environment Variables in Supabase**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ihlaenwiyxtmkehfoesg/settings/functions
2. Click on "Environment Variables"
3. Add these variables:

```
RESEND_API_KEY=re_your_resend_api_key_here
SB_URL=https://ihlaenwiyxtmkehfoesg.supabase.co
SB_SERVICE_ROLE_KEY=your_service_role_key_here
APPLYTRAK_LOGO_URL=https://www.applytrak.com/logo.png
APPLYTRAK_APP_URL=https://applytrak.com
APPLYTRAK_PREFS_ENDPOINT=https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/email-preferences
```

### **Step 4: Get Your Service Role Key**

1. Go to Supabase Dashboard → Settings → API
2. Copy the "service_role" key (starts with `eyJ...`)
3. **⚠️ Keep this secret - it has admin privileges!**

## 🧪 Test Your Setup

After setting the environment variables, test the welcome email:

```bash
curl -X POST https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

## 📧 Email Functions Deployed

✅ **welcome-email** - Sent on signup
✅ **weekly-goals-email** - Weekly progress reports  
✅ **weekly-tips-email** - Weekly job search tips
✅ **milestone-email** - Achievement celebrations
✅ **email-preferences** - Email preference management

## 🎯 Next Steps

1. **Set environment variables** in Supabase Dashboard
2. **Test welcome email** with curl command
3. **Fix auth state listeners** for auto-signin
4. **Test complete signup flow**

## 🔍 Troubleshooting

### **If emails don't send:**
- Check Resend API key is valid
- Check environment variables are set
- Check Supabase service role key is correct
- Check Resend account has sending quota

### **If functions return errors:**
- Check Supabase Dashboard → Functions → Logs
- Verify all environment variables are set
- Test function endpoints individually

## 🏆 Expected Result

After configuration:
✅ User signs up → Email verification sent
✅ User verifies email → Welcome email sent automatically  
✅ User is auto-signed in → No manual login needed
✅ All email functions work → Weekly emails, milestones, etc.

---

**Need help?** Check the Supabase Dashboard → Functions → Logs for detailed error messages.
