# Run Password Nullable Migration Manually

## Issue
The old migration `20250124000000` is failing and may be blocking our new password nullable migration from running automatically.

## Solution: Run Migration Manually

### Option 1: Using Railway CLI (Recommended)

```powershell
# Connect to Railway database
railway connect

# Select Postgres service
# Then run:
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### Option 2: Using SQL File

1. Open Railway Dashboard
2. Go to your PostgreSQL service
3. Click "Data" tab
4. Click "Connect" or use Query interface
5. Run the SQL from `run_password_migration.sql`:

```sql
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;
```

### Verify Migration

After running, verify with:

```sql
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'password';
```

You should see `is_nullable = 'YES'` for the password column.

---

## Why This Is Needed

The password column needs to be nullable to support passwordless OTP authentication. Users created via OTP will have `password = NULL`.

---

## After Running

Once the migration is complete:
1. The OTP signup flow will work correctly
2. New users can be created without passwords
3. Existing users with passwords are unaffected

