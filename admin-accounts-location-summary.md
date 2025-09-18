# Admin Accounts Location & Management Summary

## 🔍 **Where Admin Accounts Are Stored Now**

### **Primary Location: `users` Table**
Admin accounts are stored in the **`users` table** with these key fields:

```sql
-- Admin identification fields in users table:
isadmin boolean DEFAULT false           -- Legacy admin flag
adminpermissions text[] DEFAULT '{}'    -- Legacy permissions array
role text DEFAULT 'user'                -- New role-based system (user/admin/super_admin)
```

### **Admin Email Management: `admin_emails` Table**
The `admin_emails` table now serves **two purposes**:

1. **Email Templates** (current content you see)
2. **Admin Email List** (for auto-assignment during signup)

## 📊 **Current Admin System Architecture**

### **Two Admin Systems Running:**

#### **1. Legacy System (`isadmin` field)**
- Uses `isadmin = true` flag
- Permissions stored in `adminpermissions` array
- Still functional but being phased out

#### **2. New Role-Based System (`role` field)**
- Uses `role` field: `'user'`, `'admin'`, `'super_admin'`
- Cleaner, more scalable approach
- Auto-assignment based on email list

## 🎯 **How to Find Your Admin Accounts**

### **Method 1: Check Users Table**
```sql
-- Find all admin accounts (legacy system)
SELECT id, email, display_name, isadmin, adminpermissions, createdat 
FROM public.users 
WHERE isadmin = true;

-- Find all admin accounts (new system)
SELECT id, email, display_name, role, createdat 
FROM public.users 
WHERE role IN ('admin', 'super_admin');
```

### **Method 2: Check Admin Audit Log**
```sql
-- Find admin activity
SELECT DISTINCT userid, action, timestamp 
FROM public.admin_audit_log 
ORDER BY timestamp DESC 
LIMIT 10;
```

## 🛠️ **How to Manage Admin Accounts**

### **Create New Admin (New System)**
```sql
-- Add email to admin list
INSERT INTO public.admin_emails (email, role) 
VALUES ('newadmin@example.com', 'admin');

-- Promote existing user
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'newadmin@example.com';
```

### **Create Super Admin**
```sql
-- Add to admin emails list
INSERT INTO public.admin_emails (email, role) 
VALUES ('superadmin@example.com', 'super_admin');

-- Promote user
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'superadmin@example.com';
```

### **Remove Admin Access**
```sql
-- Demote to regular user
UPDATE public.users 
SET role = 'user' 
WHERE email = 'admin@example.com';

-- Remove from admin emails list
DELETE FROM public.admin_emails 
WHERE email = 'admin@example.com';
```

## 🔧 **Admin Functions Available**

### **Check Current User Role**
```sql
SELECT public.get_user_role();
```

### **Check if User is Admin**
```sql
SELECT public.is_admin();
```

### **Add Admin Email (Super Admin Only)**
```sql
SELECT public.add_admin_email('newadmin@example.com', 'admin');
```

### **Remove Admin Email (Super Admin Only)**
```sql
SELECT public.remove_admin_email('admin@example.com');
```

## 📋 **Expected Admin Emails**

Based on your setup files, these emails should have admin access:

1. **`krishnasathvikm@gmail.com`** - Super Admin
2. **`applytrak@gmail.com`** - Admin

## 🚨 **Why `admin_emails` Table Shows Templates**

The `admin_emails` table was **recreated** and now serves dual purposes:

1. **Email Templates** (what you see now)
2. **Admin Email List** (for auto-assignment)

The original admin account emails were likely lost during the table recreation.

## ✅ **Next Steps**

1. **Check if your admin accounts exist** in the `users` table
2. **Recreate admin email list** if needed
3. **Test admin functionality** to ensure it works
4. **Consider migrating** from legacy `isadmin` system to new `role` system

## 🎯 **Quick Fix**

If you need to quickly restore admin access:

```sql
-- Make yourself super admin
UPDATE public.users 
SET role = 'super_admin', isadmin = true 
WHERE email = 'your-email@example.com';

-- Add your email to admin list
INSERT INTO public.admin_emails (email, role) 
VALUES ('your-email@example.com', 'super_admin')
ON CONFLICT (email) DO UPDATE SET role = 'super_admin';
```

Your admin accounts are definitely still there - they're just stored in the `users` table now instead of a separate admin table!
