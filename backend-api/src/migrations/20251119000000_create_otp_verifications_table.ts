import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  console.log('🔧 Creating otp_verifications table...');
  
  // Create otp_verifications table
  await client.query(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Create indexes for faster lookups
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_otp_phone_otp ON otp_verifications(phone, otp);
    CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
    CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_verifications(phone, created_at);
  `);
  
  console.log('✅ otp_verifications table created successfully');
};

export const down = async (client: PoolClient): Promise<void> => {
  console.log('🔄 Dropping otp_verifications table...');
  
  // Drop indexes first
  await client.query(`
    DROP INDEX IF EXISTS idx_otp_phone_created;
    DROP INDEX IF EXISTS idx_otp_expires_at;
    DROP INDEX IF EXISTS idx_otp_phone_otp;
  `);
  
  // Drop table
  await client.query(`
    DROP TABLE IF EXISTS otp_verifications;
  `);
  
  console.log('✅ otp_verifications table dropped');
};

