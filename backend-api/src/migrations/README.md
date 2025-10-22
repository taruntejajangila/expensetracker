# Database Migrations System

## Overview
This directory contains database migration files that automatically update the database schema when the application starts.

## How It Works
1. Each migration is a separate file with a timestamp prefix (YYYYMMDDHHMMSS)
2. Migrations are run in order, from oldest to newest
3. Each migration is tracked in the `schema_migrations` table
4. Already-run migrations are skipped automatically
5. Failed migrations will prevent the app from starting (to maintain data integrity)

## Migration File Format

```typescript
export const up = async (client: any): Promise<void> => {
  // Your schema changes here
  await client.query(`
    ALTER TABLE some_table 
    ADD COLUMN new_column VARCHAR(100);
  `);
};

export const down = async (client: any): Promise<void> => {
  // Rollback changes (optional but recommended)
  await client.query(`
    ALTER TABLE some_table 
    DROP COLUMN new_column;
  `);
};

export const description = 'Add new_column to some_table';
```

## Creating a New Migration

1. Create a new file: `YYYYMMDDHHMMSS_description.ts`
   - Use current timestamp (e.g., `20251022100000_add_user_preferences.ts`)
   
2. Export `up`, `down`, and `description`

3. Test locally first!

4. Commit and deploy - migration runs automatically

## Migration Naming Convention

Format: `YYYYMMDDHHMMSS_short_description.ts`

Examples:
- `20251022100000_update_loan_type_constraint.ts`
- `20251022110000_add_notification_columns.ts`
- `20251022120000_create_audit_log_table.ts`

## Safety Features

- ✅ Transactions: Each migration runs in a transaction
- ✅ Idempotent: Safe to run multiple times
- ✅ Ordered: Always runs in chronological order
- ✅ Tracked: Won't run the same migration twice
- ✅ Fail-safe: Stops app startup on migration failure

## Viewing Migration Status

Check the `schema_migrations` table to see which migrations have run:

```sql
SELECT * FROM schema_migrations ORDER BY version;
```

## Example Migration

```typescript
// 20251022100000_update_loan_type_constraint.ts
export const up = async (client: any): Promise<void> => {
  await client.query(`
    ALTER TABLE loans 
    DROP CONSTRAINT IF EXISTS loans_loan_type_check;
  `);
  
  await client.query(`
    ALTER TABLE loans 
    ADD CONSTRAINT loans_loan_type_check 
    CHECK (loan_type IN ('personal', 'home', 'car', 'business', 'student', 'other'));
  `);
};

export const down = async (client: any): Promise<void> => {
  await client.query(`
    ALTER TABLE loans 
    DROP CONSTRAINT IF EXISTS loans_loan_type_check;
  `);
  
  await client.query(`
    ALTER TABLE loans 
    ADD CONSTRAINT loans_loan_type_check 
    CHECK (loan_type IN ('personal', 'business', 'student'));
  `);
};

export const description = 'Update loan_type constraint to include home, car, and other';
```

## Troubleshooting

### Migration Failed
- Check the error message in logs
- Fix the migration file
- Drop the failed migration from `schema_migrations` table
- Restart the app

### Migration Stuck
- Check if migration is in `schema_migrations` with `status = 'running'`
- This means it failed mid-execution
- Manually clean up and remove the row
- Fix the migration and retry

### Need to Rollback
- Currently manual process
- Run the `down` function SQL manually
- Remove entry from `schema_migrations`

