# Clean Admin System Setup Instructions

## Overview
This completely rebuilds the admin system to be clean and secure. No more hardcoded emails or buggy admin configurations.

## What This Does
- ✅ Removes all buggy admin configurations
- ✅ Creates a proper role-based system (user, admin, super_admin)
- ✅ Admins are regular users with special privileges
- ✅ Clean RLS policies that work properly
- ✅ No hardcoded email addresses

## Step-by-Step Setup

### 1. Run the Clean Admin System SQL
```sql
-- Run this in Supabase Dashboard → SQL Editor
-- File: clean-admin-system-rebuild.sql
```

### 2. Create Your Super Admin Account
1. **Sign up** with `krishnasathvikm@gmail.com` as a regular user
2. **After signup**, run this SQL to make yourself super admin:
```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'krishnasathvikm@gmail.com';
```

### 3. Create Second Admin Account
1. **Sign up** with `applytrak@gmail.com` as a regular user
2. **After signup**, promote to admin using this SQL:
```sql
SELECT public.promote_to_admin(
    (SELECT id FROM public.users WHERE email = 'applytrak@gmail.com')
);
```

### 4. Verify Admin Access
Both accounts should now have:
- ✅ **Regular user functionality** - can create applications, set goals, etc.
- ✅ **Admin analytics** - can view all users and admin dashboard
- ✅ **User management** - can promote/demote other users (super_admin only)

## Role System

### `user` (Default)
- Can create and manage their own applications
- Can set goals and use all regular features
- Cannot access admin features

### `admin`
- All user permissions
- Can view all users in admin dashboard
- Can view admin analytics
- Cannot promote/demote other users

### `super_admin`
- All admin permissions
- Can promote users to admin
- Can demote admins to users
- Full system access

## Admin Functions Available

### Check if current user is admin
```sql
SELECT public.is_admin();
```

### Get current user's role
```sql
SELECT public.get_user_role();
```

### Promote user to admin (super_admin only)
```sql
SELECT public.promote_to_admin(user_id);
```

### Demote admin to user (super_admin only)
```sql
SELECT public.demote_admin(user_id);
```

## Security Features
- ✅ **No hardcoded emails** - all admin access is role-based
- ✅ **Proper RLS policies** - users can only see their own data
- ✅ **Admin isolation** - admins can see all data but can't modify user roles without super_admin
- ✅ **Clean separation** - admin features are separate from user features

## Testing
1. **Test regular user signup** - should work normally
2. **Test admin promotion** - should work after you're super_admin
3. **Test admin dashboard** - should show all users
4. **Test user management** - should be able to promote/demote users

## Benefits
- 🎯 **Clean architecture** - no more buggy admin code
- 🔒 **Secure** - proper role-based access control
- 🚀 **Scalable** - easy to add more admins
- 🛠️ **Maintainable** - clear separation of concerns
- 👥 **User-friendly** - admins use the same interface as regular users
