# 🗑️ Delete Non-Admin Users - PowerShell Guide

## **Option 1: Using Get-Content (Recommended for PowerShell)**

```powershell
Get-Content delete_non_admin_users_EXECUTE.sql | railway connect psql
```

## **Option 2: Interactive Railway CLI**

1. Connect to Railway database:
```powershell
railway connect psql
```

2. Once connected, copy and paste this SQL:

```sql
BEGIN;

-- Delete OTP verifications for non-admin users
DELETE FROM otp_verifications
WHERE phone IN (
    SELECT phone FROM users u
    LEFT JOIN admin_users au ON u.id = au.user_id
    WHERE au.user_id IS NULL
);

-- Delete non-admin users (this will cascade delete their transactions, categories, etc.)
DELETE FROM users
WHERE id NOT IN (
    SELECT user_id FROM admin_users WHERE user_id IS NOT NULL
);

COMMIT;

-- Verification: Check remaining users (should only be admin users)
SELECT 
    u.id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as name,
    au.role as admin_role
FROM users u
INNER JOIN admin_users au ON u.id = au.user_id;
```

3. Press Enter to execute

## **Option 3: Using Railway Dashboard (Easiest)**

1. Go to Railway Dashboard
2. Click your PostgreSQL service
3. Click "Data" tab
4. Click "Query"
5. Copy and paste the SQL from above
6. Click "Run"

## **Option 4: PowerShell Script**

Run the provided PowerShell script:
```powershell
.\run_delete_users.ps1
```

---

## ⚠️ **What This Does**

- Deletes all regular users (non-admin)
- Deletes all their OTP verification records
- Keeps all admin users intact
- Cascades to delete all related data (transactions, categories, etc.)

## ✅ **Verification**

After running, check that only admin users remain:
```sql
SELECT COUNT(*) as admin_users FROM admin_users;
SELECT COUNT(*) as total_users FROM users;
-- These counts should match
```

