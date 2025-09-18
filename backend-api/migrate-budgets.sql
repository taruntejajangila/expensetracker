-- Migration script to update budgets table for mobile app compatibility
-- Run this script to add missing columns

-- Add missing columns to budgets table
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS spent DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'on-track' CHECK (status IN ('on-track', 'over-budget', 'under-budget'));

-- Update existing budgets to have default values
UPDATE budgets 
SET 
    name = COALESCE(name, 'Budget'),
    spent = COALESCE(spent, 0),
    status = CASE 
        WHEN COALESCE(spent, 0) > amount THEN 'over-budget'
        WHEN COALESCE(spent, 0) = amount THEN 'on-track'
        ELSE 'under-budget'
    END
WHERE name IS NULL OR spent IS NULL OR status IS NULL;

-- Make name column NOT NULL after setting default values
ALTER TABLE budgets ALTER COLUMN name SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN spent SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN status SET NOT NULL;

-- Add index for status column for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);

-- Display the updated table structure
\d budgets;
