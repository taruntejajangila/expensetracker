# 🔄 Database Migration System

## Overview

This project now has a **professional database migration system** that automatically updates your database schema when you deploy new code. No more manual SQL scripts or schema mismatches between local and production!

---

## 🎯 Problem It Solves

### Before (The Problem):
```
Local Database:    ✅ Has new constraints
Railway Database:  ❌ Has old constraints
Result:            💥 App crashes with constraint violations
```

### After (The Solution):
```
Local Database:    ✅ Migrations run automatically
Railway Database:  ✅ Migrations run automatically
Result:            ✅ Both databases stay in sync!
```

---

## 🚀 How It Works

### 1. **Automatic Execution**
When your app starts (locally or on Railway):
```
1. Connect to database
2. Create schema_migrations table (if needed)
3. Check for pending migrations
4. Run pending migrations in order
5. Start the app
```

### 2. **Migration Files**
Each migration is a TypeScript file with a timestamp:

```
backend-api/src/migrations/
├── README.md
├── migrationRunner.ts
└── 20251022100000_update_loan_type_constraint.ts  ← Your migrations
```

### 3. **Migration Tracking**
The system tracks which migrations have run in the `schema_migrations` table:

| version | description | executed_at | status |
|---------|-------------|-------------|--------|
| 20251022100000 | Update loan_type constraint | 2025-10-22 10:00:00 | completed |

---

## 📝 Creating a New Migration

### Step 1: Create Migration File

Create a new file in `backend-api/src/migrations/` with the format:
```
YYYYMMDDHHMMSS_description.ts
```

**Example:** `20251022120000_add_user_preferences_table.ts`

### Step 2: Write Migration Code

```typescript
import { PoolClient } from 'pg';

// This runs when migrating forward
export const up = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE TABLE user_preferences (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      theme VARCHAR(20) DEFAULT 'light',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
};

// This runs when rolling back (optional)
export const down = async (client: PoolClient): Promise<void> => {
  await client.query(`DROP TABLE IF EXISTS user_preferences;`);
};

// Description for logging
export const description = 'Add user_preferences table for theme settings';
```

### Step 3: Test Locally

```bash
cd backend-api
npm run dev
```

Watch the logs:
```
✅ Database connected successfully
🔄 Checking for pending migrations...
📋 Found 1 pending migration(s)
🔄 Running migration: 20251022120000 - Add user_preferences table
✅ Migration 20251022120000 completed in 45ms
✅ All migrations completed successfully
```

### Step 4: Commit and Deploy

```bash
git add backend-api/src/migrations/
git commit -m "Add user_preferences table migration"
git push
```

Railway will automatically:
1. Deploy your code
2. Run the migration on startup
3. Your production database is updated! ✅

---

## 🔍 Migration Examples

### Example 1: Add a Column

```typescript
// 20251022130000_add_avatar_column_to_users.ts
export const up = async (client: PoolClient): Promise<void> => {
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN avatar_url TEXT;
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  await client.query(`
    ALTER TABLE users 
    DROP COLUMN avatar_url;
  `);
};

export const description = 'Add avatar_url column to users table';
```

### Example 2: Update a Constraint

```typescript
// 20251022140000_update_category_type_constraint.ts
export const up = async (client: PoolClient): Promise<void> => {
  await client.query(`
    ALTER TABLE categories 
    DROP CONSTRAINT IF EXISTS categories_type_check;
  `);
  
  await client.query(`
    ALTER TABLE categories 
    ADD CONSTRAINT categories_type_check 
    CHECK (type IN ('income', 'expense', 'transfer', 'investment'));
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  await client.query(`
    ALTER TABLE categories 
    DROP CONSTRAINT IF EXISTS categories_type_check;
  `);
  
  await client.query(`
    ALTER TABLE categories 
    ADD CONSTRAINT categories_type_check 
    CHECK (type IN ('income', 'expense', 'transfer'));
  `);
};

export const description = 'Add investment type to categories';
```

### Example 3: Create an Index

```typescript
// 20251022150000_add_index_to_transactions_date.ts
export const up = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE INDEX idx_transactions_date 
    ON transactions(date DESC);
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  await client.query(`
    DROP INDEX IF EXISTS idx_transactions_date;
  `);
};

export const description = 'Add index on transactions.date for faster queries';
```

### Example 4: Migrate Data

```typescript
// 20251022160000_migrate_old_loan_types.ts
export const up = async (client: PoolClient): Promise<void> => {
  // Update old 'mortgage' to new 'home'
  await client.query(`
    UPDATE loans 
    SET loan_type = 'home' 
    WHERE loan_type = 'mortgage';
  `);
  
  // Update old 'auto' to new 'car'
  await client.query(`
    UPDATE loans 
    SET loan_type = 'car' 
    WHERE loan_type = 'auto';
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Revert changes
  await client.query(`
    UPDATE loans 
    SET loan_type = 'mortgage' 
    WHERE loan_type = 'home';
  `);
  
  await client.query(`
    UPDATE loans 
    SET loan_type = 'auto' 
    WHERE loan_type = 'car';
  `);
};

export const description = 'Migrate old loan types to new standard names';
```

---

## 🛡️ Safety Features

### 1. **Transactions**
Each migration runs in a transaction - if it fails, all changes are rolled back.

### 2. **Order Guaranteed**
Migrations always run in chronological order (by timestamp).

### 3. **No Duplicates**
Each migration runs exactly once, tracked in `schema_migrations` table.

### 4. **Fail-Safe**
If a migration fails, the app won't start until it's fixed.

### 5. **Idempotent**
Use `IF EXISTS` and `IF NOT EXISTS` to make migrations safe to retry:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_column TEXT;
DROP TABLE IF EXISTS old_table;
```

---

## 🔧 Troubleshooting

### Migration Failed - How to Fix

**Symptom:** App won't start, logs show migration error

**Solution:**

1. **Check the error message:**
```
❌ Migration 20251022120000 failed: column "foo" already exists
```

2. **Fix the migration file** - Add `IF NOT EXISTS`:
```typescript
await client.query(`
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS foo TEXT;
`);
```

3. **Remove failed migration from database:**
```sql
-- Connect to Railway database
DELETE FROM schema_migrations 
WHERE version = '20251022120000';
```

4. **Restart the app** - migration will run again

---

### Check Migration Status

**Connect to Railway database:**
```bash
cd backend-api
railway run psql $DATABASE_URL
```

**Check migrations:**
```sql
SELECT * FROM schema_migrations ORDER BY version DESC;
```

**Output:**
```
     version     |     description      |     executed_at      | execution_time_ms | status
-----------------+----------------------+----------------------+-------------------+---------
 20251022100000  | Update loan_type...  | 2025-10-22 10:00:00 |        45         | completed
```

---

### Reset Migrations (Nuclear Option)

**⚠️ WARNING: This deletes migration history**

```sql
DROP TABLE schema_migrations;
```

Then restart the app - all migrations will run again.

---

## 📊 Current Migrations

### 1. `20251022100000_update_loan_type_constraint.ts`

**What it does:** Updates the `loans` table to allow more loan types

**Before:**
```sql
CHECK (loan_type IN ('personal', 'business', 'student'))
```

**After:**
```sql
CHECK (loan_type IN ('personal', 'home', 'car', 'business', 'student', 'other'))
```

**Why:** Users can now create home loans, car loans, and other loan types in the mobile app.

---

## 🎓 Best Practices

### 1. **Always Test Locally First**
Never deploy a migration without testing it on your local database.

### 2. **Write Down Functions**
Always include a `down` function for rollback capability.

### 3. **Use Timestamps**
Name migrations with current timestamp: `YYYYMMDDHHMMSS_description.ts`

### 4. **Keep Migrations Small**
One logical change per migration (easier to debug).

### 5. **Use IF EXISTS / IF NOT EXISTS**
Make migrations idempotent and safe to retry.

### 6. **Document Complex Changes**
Add comments explaining why the change is needed.

### 7. **Never Modify Existing Migrations**
Once deployed, create a new migration to fix issues.

---

## 📚 Resources

- **Migration Runner:** `backend-api/src/migrations/migrationRunner.ts`
- **Migration Template:** `backend-api/src/migrations/README.md`
- **Example Migration:** `backend-api/src/migrations/20251022100000_update_loan_type_constraint.ts`

---

## ✅ Benefits

✅ **No Manual SQL** - Everything is automated
✅ **Version Control** - Migrations are in Git
✅ **Consistent** - Same schema everywhere
✅ **Trackable** - Know what ran when
✅ **Safe** - Transactions and rollback support
✅ **Zero Downtime** - Migrations run on startup

---

## 🚀 Next Steps

1. **Review** the example migration: `20251022100000_update_loan_type_constraint.ts`
2. **Test** by restarting your local backend
3. **Deploy** to Railway - migration runs automatically
4. **Verify** in logs that migration completed
5. **Test** your app - should work perfectly!

---

**Need help?** Check `backend-api/src/migrations/README.md` or refer to this guide.

