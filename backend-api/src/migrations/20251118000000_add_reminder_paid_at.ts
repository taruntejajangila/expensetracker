import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  // Add paid_at column to reminders table
  await client.query(`
    ALTER TABLE reminders 
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
  `);

  // Create index for better query performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS reminders_paid_at_idx ON reminders(paid_at) WHERE paid_at IS NOT NULL;
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Remove index
  await client.query(`
    DROP INDEX IF EXISTS reminders_paid_at_idx;
  `);

  // Remove paid_at column
  await client.query(`
    ALTER TABLE reminders 
    DROP COLUMN IF EXISTS paid_at;
  `);
};

