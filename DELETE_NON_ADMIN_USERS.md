# 🗑️ Delete All Non-Admin Users

This guide will help you safely delete all regular users while keeping admin users intact.

## ⚠️ **WARNING**

This operation will **permanently delete**:
- All regular users (non-admin users)
- All their transactions
- All their categories
- All their accounts, goals, loans, etc.
- All OTP verification records

**Admin users will be preserved.**

---

## 📋 **Steps to Delete Non-Admin Users**

### **Step 1: Preview What Will Be Deleted**

First, check which users will be deleted:

```sql
SELECT 
    u.id,
    u.email,
    u.phone,
    CONCAT(u.first_name, ' ', u.last_name) as name,
    u.created_at,
    CASE WHEN au.user_id IS NOT NULL THEN 'Admin (KEEP)' ELSE 'Regular User (DELETE)' END as status
FROM users u
LEFT JOIN admin_users au ON u.id = au.user_id
WHERE au.user_id IS NULL
ORDER BY u.created_at DESC;
```

### **Step 2: Count Users**

```sql
-- Count non-admin users (will be deleted)
SELECT COUNT(*) as users_to_delete
FROM users u
LEFT JOIN admin_users au ON u.id = au.user_id
WHERE au.user_id IS NULL;

-- Count admin users (will be kept)
SELECT COUNT(*) as admin_users_count
FROM admin_users;
```

### **Step 3: Execute Deletion**

**Option A: Using Railway CLI**

```bash
railway connect psql < delete_non_admin_users.sql
```

**Option B: Using Railway Dashboard**

1. Go to Railway Dashboard
2. Click your PostgreSQL service
3. Click "Data" tab
4. Click "Query"
5. Copy and paste the deletion SQL from `delete_non_admin_users.sql`
6. Uncomment the deletion section (remove `/*` and `*/`)
7. Click "Run"

**Option C: Direct SQL Execution**

```sql
BEGIN;

-- Delete OTP verifications for non-admin users
DELETE FROM otp_verifications
WHERE phone IN (
    SELECT phone FROM users u
    LEFT JOIN admin_users au ON u.id = au.user_id
    WHERE au.user_id IS NULL
);

-- Delete non-admin users (cascades to all related data)
DELETE FROM users
WHERE id NOT IN (
    SELECT user_id FROM admin_users WHERE user_id IS NOT NULL
);

COMMIT;
```

---

## ✅ **Verification**

After deletion, verify:

```sql
-- Should show only admin users
SELECT 
    u.id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as name,
    au.role
FROM users u
INNER JOIN admin_users au ON u.id = au.user_id;
```

---

## 🔄 **Rollback**

**There is NO automatic rollback!** Once deleted, data cannot be recovered unless you have a backup.

If you need to restore:
1. Restore from a database backup
2. Or manually recreate users

---

## 📝 **Notes**

- Admin users are identified by having an entry in the `admin_users` table
- The deletion uses CASCADE, so all related data (transactions, categories, etc.) will be automatically deleted
- OTP verifications are deleted separately to avoid foreign key issues
- The operation is wrapped in a transaction for safety

