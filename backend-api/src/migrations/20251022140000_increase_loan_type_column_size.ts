import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  // Increase the loan_type column size to accommodate longer values
  await client.query(`
    ALTER TABLE loans ALTER COLUMN loan_type TYPE VARCHAR(50);
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Revert to smaller size
  await client.query(`
    ALTER TABLE loans ALTER COLUMN loan_type TYPE VARCHAR(30);
  `);
};
