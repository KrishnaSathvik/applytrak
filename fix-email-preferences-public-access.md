# Fix Email Preferences Public Access

## Problem
The email preferences function returns a 401 "Missing authorization header" error when accessed from email links because it requires authentication, but email links can't include auth headers.

## Solution
Configure the email preferences function to allow public access since it uses the `eid` parameter for authentication.

## Steps to Fix

### 1. Update Function Configuration
The email preferences function should be configured to allow public access in your Supabase project:

1. Go to **Supabase Dashboard** → **Edge Functions** → **email-preferences**
2. Click on **Settings** or **Configuration**
3. Set **Authentication** to **Public** (or disable authentication requirement)
4. Save the configuration

### 2. Alternative: Update Function Code
If you can't change the function configuration, update the function code to handle requests without auth headers:

```typescript
// In supabase/functions/email-preferences/index.ts
// Add this at the beginning of the serve function:

serve(async (req) => {
    try {
        // Allow public access for email preferences
        // The function uses eid parameter for authentication instead of JWT
        
        const url = new URL(req.url);
        // ... rest of the function code
```

### 3. Test the Fix
After making the changes, test the email preferences link:

```bash
# This should work without auth header
curl "https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/email-preferences?eid=4485394f-5d84-4c2e-a77b-0f4bf34b302b"
```

## Expected Result
- Email preferences links should work without requiring authentication
- Users can manage their email preferences directly from email links
- The function still maintains security through the `eid` parameter validation

## Current Status
✅ Function works with auth header  
❌ Function fails without auth header (email links)  
🔧 Need to configure public access
