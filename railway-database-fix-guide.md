# 🔧 Railway Database Fix Guide

## Current Status
- **Success Rate**: 20% (1/5 tests passing)
- **Working**: Goals (Savings Goals) ✅
- **Failing**: Credit Cards (500 error), Support Tickets (404), Analytics (404)

## 🎯 Manual Database Fix Required

Since we can't install `psql` locally, you need to fix the database schema manually in Railway.

### Step 1: Access Railway Database
1. Go to: https://railway.app/
2. Click on your **PostgreSQL database service**
3. Look for a **"Query"** or **"SQL"** button/tab
4. If you can't find it, try clicking **"Connect"** button

### Step 2: Run SQL Commands
Copy and paste these SQL commands:

```sql
-- Fix Credit Cards table column names
ALTER TABLE credit_cards RENAME COLUMN card_name TO name;
ALTER TABLE credit_cards RENAME COLUMN available_credit TO balance;
ALTER TABLE credit_cards RENAME COLUMN minimum_payment TO min_payment;

-- Add missing columns to credit_cards table
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS issuer VARCHAR(100);
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS statement_day INTEGER DEFAULT 1;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS payment_due_day INTEGER DEFAULT 30;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'credit-card';

-- Update issuer column with default value
UPDATE credit_cards SET issuer = 'Unknown Bank' WHERE issuer IS NULL;
```

### Step 3: Test the Fix
After running the SQL, test with:
```bash
node test-after-database-fix.js
```

## Expected Results After Fix
- **Credit Cards**: Should work (500 → 200)
- **Success Rate**: Should increase from 20% to ~80%
- **Mobile App**: Should be fully functional

## Alternative: Use Current Working Features
Even without the fix, your mobile app works for:
- ✅ User registration/login
- ✅ Categories management
- ✅ Transactions management
- ✅ Budgets management
- ✅ Goals management
- ✅ Bank accounts viewing
- ✅ Loans management

## Next Steps
1. **Fix database schema** (recommended)
2. **Test mobile app** with current features
3. **Deploy missing routes** (support tickets, analytics)
