# Delete Users Using Railway CLI

## Step 1: Link Your Project (if not already linked)

```powershell
railway link
```

If you need to specify project:
```powershell
railway link -p YOUR_PROJECT_ID
```

## Step 2: Connect to Database

```powershell
railway connect
```

This will:
- Show you available services
- Let you select PostgreSQL
- Open an interactive psql session

## Step 3: Once in psql, paste this SQL:

```sql
BEGIN;

DELETE FROM otp_verifications
WHERE phone IN (
    SELECT phone FROM users u
    LEFT JOIN admin_users au ON u.id = au.user_id
    WHERE au.user_id IS NULL
);

DELETE FROM users
WHERE id NOT IN (
    SELECT user_id FROM admin_users WHERE user_id IS NOT NULL
);

COMMIT;

SELECT 
    u.id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as name,
    au.role as admin_role
FROM users u
INNER JOIN admin_users au ON u.id = au.user_id;
```

## Step 4: Exit

Type `\q` and press Enter

---

## Troubleshooting

**If `railway connect` doesn't show PostgreSQL:**
- Make sure you're in the correct project directory
- Run `railway link` first
- Check Railway Dashboard - make sure PostgreSQL service exists

**If you get "Service not found":**
- Use Railway Dashboard method instead (Option 1)
- Or check `railway status` to see current project

