# Debug Admin Access Issue

## 🔍 **Issue:** Cannot access `/admin` in production with `krishnasathvikm@gmail.com`

## ✅ **Admin Email Configuration:**
The admin emails are correctly configured in `src/utils/adminAuth.ts`:
```typescript
ADMIN_EMAILS: [
    'applytrak@gmail.com',
    'krishnasathvikm@gmail.com'  // ✅ Your email is here
]
```

## 🛠️ **Debugging Steps:**

### **1. Check Browser Console**
Open browser dev tools (F12) and look for:
- Admin verification errors
- Authentication issues
- Network request failures

### **2. Test Admin Verification**
Run this in browser console:
```javascript
// Check if you're authenticated
console.log('Auth status:', window.localStorage.getItem('supabase.auth.token'));

// Check admin verification
fetch('/api/admin/verify', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'krishnasathvikm@gmail.com'})
}).then(r => r.json()).then(console.log);
```

### **3. Check Production Environment**
Verify these are set correctly in production:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- Environment variables

### **4. Test Direct Admin Route**
Try these URLs in production:
- `https://applytrak.com/admin`
- `https://applytrak.com/#admin-dashboard-krishna-2024`
- `https://applytrak.com/#applytrak-admin`

### **5. Check Database Admin Status**
Run this SQL in Supabase Dashboard:
```sql
-- Check if your user exists with admin privileges
SELECT id, email, isadmin, role, adminpermissions 
FROM public.users 
WHERE email = 'krishnasathvikm@gmail.com';

-- Check admin emails table
SELECT * FROM public.admin_emails 
WHERE email = 'krishnasathvikm@gmail.com';
```

## 🚨 **Common Issues:**

### **Issue 1: Case Sensitivity**
- Email might be stored differently in database
- Check exact case: `krishnasathvikm@gmail.com`

### **Issue 2: Database Sync**
- User might not exist in `users` table
- Admin flags might not be set

### **Issue 3: Environment Variables**
- Production might have different Supabase config
- Check Vercel/Netlify environment variables

### **Issue 4: Caching**
- Browser might be caching old auth state
- Try incognito/private browsing

## 🔧 **Quick Fixes:**

### **Fix 1: Force Admin Status**
```sql
-- Set admin status in database
UPDATE public.users 
SET isadmin = true, role = 'super_admin'
WHERE email = 'krishnasathvikm@gmail.com';
```

### **Fix 2: Clear Browser Cache**
- Clear localStorage
- Clear sessionStorage
- Hard refresh (Ctrl+F5)

### **Fix 3: Check Network Tab**
- Look for failed requests to `/admin`
- Check for 401/403 errors
- Verify Supabase auth tokens

## 📋 **Next Steps:**

1. **Check browser console** for errors
2. **Verify database admin status**
3. **Test in incognito mode**
4. **Check production environment variables**
5. **Try keyboard shortcut** (A → D → M)

## 🎯 **Expected Behavior:**
- Login with `krishnasathvikm@gmail.com`
- Navigate to `/admin`
- Should see admin dashboard
- If not, check console for specific error

Let me know what errors you see in the browser console!
