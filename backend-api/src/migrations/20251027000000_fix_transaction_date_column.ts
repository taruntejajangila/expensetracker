import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  // Change transaction_date from DATE to TIMESTAMP WITH TIME ZONE
  await pool.query(`
    ALTER TABLE transactions 
    ALTER COLUMN transaction_date 
    TYPE TIMESTAMP WITH TIME ZONE 
    USING transaction_date::timestamp with time zone
  `);
  console.log('✅ Changed transaction_date from DATE to TIMESTAMP WITH TIME ZONE');
}

export async function down(pool: Pool): Promise<void> {
  // Revert back to DATE (will lose time information)
  await pool.query(`
    ALTER TABLE transactions 
    ALTER COLUMN transaction_date 
    TYPE DATE 
    USING transaction_date::date
  `);
  console.log('✅ Reverted transaction_date back to DATE');
}

