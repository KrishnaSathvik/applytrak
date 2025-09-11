# Email Verification Fix Guide

## Issues Identified

1. **"requested path is invalid" error** - This happens when the email verification URL is malformed
2. **Welcome email not triggering** - The welcome email function exists but may not be called properly
3. **Local development configuration** - Using localhost URLs in production

## Root Causes

### 1. Email Verification URL Issue
The "requested path is invalid" error typically occurs when:
- The redirect URL in the email doesn't match your configured `site_url` or `additional_redirect_urls`
- The verification token is malformed or expired
- The Supabase project URL is incorrect

### 2. Welcome Email Not Triggering
The welcome email is only sent after successful email verification, but if verification fails, the welcome email won't be sent.

## Solutions

### Step 1: Fix Supabase Configuration

Update your Supabase project settings:

1. **Go to Supabase Dashboard** → Authentication → URL Configuration
2. **Update Site URL** to your production URL:
   ```
   https://www.applytrak.com
   ```
3. **Add Redirect URLs**:
   ```
   https://www.applytrak.com
   https://www.applytrak.com/auth/callback
   https://applytrak.com
   https://applytrak.com/auth/callback
   ```

### Step 2: Update Local Development Config

For local development, update your `supabase/config.toml`:

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "http://localhost:3000",
  "http://localhost:3000/auth/callback",
  "https://www.applytrak.com",
  "https://www.applytrak.com/auth/callback",
  "https://applytrak.com",
  "https://applytrak.com/auth/callback"
]
```

### Step 3: Configure SMTP for Production

Uncomment and configure SMTP in your `config.toml`:

```toml
[auth.email.smtp]
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "noreply@applytrak.com"
sender_name = "ApplyTrak"
```

### Step 4: Test Email Verification

1. **Create a test user** in your app
2. **Check the email** (look in Inbucket for local dev: http://localhost:54324)
3. **Click the verification link**
4. **Verify the redirect works** and user gets logged in

### Step 5: Debug Welcome Email

The welcome email should trigger automatically after email verification. Check:

1. **Console logs** for any errors in the welcome email function
2. **Supabase Functions logs** for the welcome-email function
3. **Resend API** status if using Resend for emails

## Quick Fix for Testing

If you want to test immediately without SMTP:

1. **Temporarily disable email confirmation**:
   ```toml
   [auth.email]
   enable_confirmations = false
   ```

2. **Test user creation** - users will be created without email verification

3. **Manually trigger welcome email** by calling the function directly

## Production Checklist

- [ ] Site URL set to https://www.applytrak.com
- [ ] Redirect URLs configured correctly
- [ ] SMTP server configured and tested
- [ ] Email templates working
- [ ] Welcome email function deployed and working
- [ ] Test complete signup flow

## Common Issues

1. **Mixed HTTP/HTTPS** - Make sure all URLs use the same protocol
2. **Trailing slashes** - Be consistent with trailing slashes in URLs
3. **Case sensitivity** - URLs are case-sensitive
4. **Token expiration** - Email verification tokens expire after 1 hour by default
