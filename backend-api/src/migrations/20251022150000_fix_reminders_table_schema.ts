import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  // Drop the existing reminders table if it exists and recreate with correct schema
  await client.query(`
    DROP TABLE IF EXISTS reminders CASCADE;
  `);
  
  await client.query(`
    CREATE TABLE reminders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'general',
      due_date TIMESTAMP WITH TIME ZONE NOT NULL,
      reminder_time VARCHAR(10),
      priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      category VARCHAR(100),
      source_type VARCHAR(50) DEFAULT 'manual',
      source_id VARCHAR(100),
      is_recurring BOOLEAN DEFAULT false,
      recurring_frequency VARCHAR(20),
      is_completed BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      is_enabled BOOLEAN DEFAULT true,
      repeat_type VARCHAR(20),
      amount DECIMAL(12,2),
      is_auto_generated BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Create indexes for better performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders(user_id);
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS reminders_due_date_idx ON reminders(due_date);
  `);
  
  // Create trigger for updated_at
  await client.query(`
    DROP TRIGGER IF EXISTS trigger_reminders_updated_at ON reminders;
    CREATE TRIGGER trigger_reminders_updated_at 
    BEFORE UPDATE ON reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Drop the reminders table
  await client.query(`
    DROP TABLE IF EXISTS reminders CASCADE;
  `);
};
