import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  try {
    // First, increase the loan_type column size
    console.log('Increasing loan_type column size...');
    await client.query(`
      ALTER TABLE loans ALTER COLUMN loan_type TYPE VARCHAR(50);
    `);
    console.log('✅ Column size increased');
    
    // Drop the existing constraint
    console.log('Dropping existing constraint...');
    await client.query(`
      ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_type_check;
    `);
    console.log('✅ Constraint dropped');
    
    // Update existing data to match new format
    console.log('Updating existing loan_type values...');
    await client.query(`
      UPDATE loans SET loan_type = 'Personal Loan' WHERE loan_type = 'personal';
    `);
    await client.query(`
      UPDATE loans SET loan_type = 'Home Loan' WHERE loan_type = 'home';
    `);
    await client.query(`
      UPDATE loans SET loan_type = 'Car Loan' WHERE loan_type = 'car';
    `);
    await client.query(`
      UPDATE loans SET loan_type = 'Business Loan' WHERE loan_type = 'business';
    `);
    await client.query(`
      UPDATE loans SET loan_type = 'Education Loan' WHERE loan_type = 'student';
    `);
    await client.query(`
      UPDATE loans SET loan_type = 'Other' WHERE loan_type = 'other';
    `);
    console.log('✅ Existing data updated');
    
    // Add the new constraint with mobile app values
    console.log('Adding new constraint...');
    await client.query(`
      ALTER TABLE loans ADD CONSTRAINT loans_loan_type_check 
      CHECK (loan_type IN ('Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan', 'Gold Loan', 'Education Loan', 'Private Money Lending', 'Other'));
    `);
    console.log('✅ New constraint added');
    
    // Update the default value to match mobile app
    console.log('Updating default value...');
    await client.query(`
      ALTER TABLE loans ALTER COLUMN loan_type SET DEFAULT 'Personal Loan';
    `);
    console.log('✅ Default value updated');
    
  } catch (error) {
    console.error('Error in loan_type migration:', error);
    throw error;
  }
  
  try {
    // Create reminders table
    console.log('Creating reminders table...');
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
    console.log('✅ Reminders table created');
    
  } catch (error) {
    console.error('Error creating reminders table:', error);
    throw error;
  }
  
  try {
    // Create notifications table
    console.log('Creating notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        body TEXT,
        type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder', 'alert')),
        data JSONB,
        status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
        read_at TIMESTAMP WITH TIME ZONE,
        action_url VARCHAR(255),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Notifications table created');
    
  } catch (error) {
    console.error('Error creating notifications table:', error);
    throw error;
  }
  
  try {
    // Create indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS reminders_due_date_idx ON reminders(due_date);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);
    `);
    console.log('✅ Indexes created');
    
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
  
  try {
    // Create triggers
    console.log('Creating triggers...');
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_reminders_updated_at ON reminders;
      CREATE TRIGGER trigger_reminders_updated_at 
      BEFORE UPDATE ON reminders 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
      CREATE TRIGGER trigger_notifications_updated_at 
      BEFORE UPDATE ON notifications 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Triggers created');
    
  } catch (error) {
    console.error('Error creating triggers:', error);
    throw error;
  }
  
  console.log('🎉 All migration steps completed successfully!');
};

export const down = async (client: PoolClient): Promise<void> => {
  // Revert loan_type changes
  await client.query(`
    ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_type_check;
  `);
  
  await client.query(`
    ALTER TABLE loans ADD CONSTRAINT loans_loan_type_check 
    CHECK (loan_type IN ('personal', 'home', 'car', 'business', 'student', 'other'));
  `);
  
  await client.query(`
    ALTER TABLE loans ALTER COLUMN loan_type SET DEFAULT 'personal';
  `);
  
  await client.query(`
    ALTER TABLE loans ALTER COLUMN loan_type TYPE VARCHAR(20);
  `);
  
  // Drop tables
  await client.query(`DROP TABLE IF EXISTS reminders CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS notifications CASCADE;`);
};