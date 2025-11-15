import { PoolClient } from 'pg';

/**
 * Migration: Make password column nullable
 * 
 * Allows passwordless authentication via OTP
 * Users created via OTP will have password = NULL
 * Users created via email/password will have password hash
 */

export const up = async (client: PoolClient): Promise<void> => {
  // Make password column nullable
  await client.query(`
    ALTER TABLE users 
    ALTER COLUMN password DROP NOT NULL;
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Rollback: Make password NOT NULL again
  // Note: This will fail if there are users with NULL passwords
  // In that case, you'd need to set default passwords first
  await client.query(`
    ALTER TABLE users 
    ALTER COLUMN password SET NOT NULL;
  `);
};

export const description = 'Make password column nullable to support passwordless OTP authentication';

