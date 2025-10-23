import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing support tickets schema...');

    // Add ticket_number column if it doesn't exist
    await client.query(`
      ALTER TABLE support_tickets 
      ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20) UNIQUE
    `);

    // Add assigned_to column if it doesn't exist
    await client.query(`
      ALTER TABLE support_tickets 
      ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id)
    `);

    // Add is_admin_reply column to ticket_messages if it doesn't exist
    await client.query(`
      ALTER TABLE ticket_messages 
      ADD COLUMN IF NOT EXISTS is_admin_reply BOOLEAN DEFAULT false
    `);

    // Add updated_at column to ticket_messages if it doesn't exist
    await client.query(`
      ALTER TABLE ticket_messages 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    // Create ticket_attachments table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
        message_id UUID REFERENCES ticket_messages(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create support_ticket_messages table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create ticket number generation function
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_ticket_number()
      RETURNS VARCHAR AS $$
      DECLARE
        ticket_num VARCHAR(20);
        counter INTEGER;
      BEGIN
        -- Get the next counter value
        SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1
        INTO counter
        FROM support_tickets
        WHERE ticket_number LIKE 'TK%';
        
        -- Format as TK + 6-digit number with leading zeros
        ticket_num := 'TK' || LPAD(counter::TEXT, 6, '0');
        
        RETURN ticket_num;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Update existing tickets with ticket numbers if they don't have them
    await client.query(`
      UPDATE support_tickets 
      SET ticket_number = generate_ticket_number()
      WHERE ticket_number IS NULL
    `);

    // Make ticket_number NOT NULL after updating existing records
    await client.query(`
      ALTER TABLE support_tickets 
      ALTER COLUMN ticket_number SET NOT NULL
    `);

    console.log('✅ Support tickets schema fixed successfully');
  } catch (error) {
    console.error('❌ Error fixing support tickets schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Reverting support tickets schema changes...');

    // Drop the function
    await client.query('DROP FUNCTION IF EXISTS generate_ticket_number()');

    // Drop the new tables
    await client.query('DROP TABLE IF EXISTS support_ticket_messages');
    await client.query('DROP TABLE IF EXISTS ticket_attachments');

    // Remove the new columns
    await client.query('ALTER TABLE ticket_messages DROP COLUMN IF EXISTS updated_at');
    await client.query('ALTER TABLE ticket_messages DROP COLUMN IF EXISTS is_admin_reply');
    await client.query('ALTER TABLE support_tickets DROP COLUMN IF EXISTS assigned_to');
    await client.query('ALTER TABLE support_tickets DROP COLUMN IF EXISTS ticket_number');

    console.log('✅ Support tickets schema reverted successfully');
  } catch (error) {
    console.error('❌ Error reverting support tickets schema:', error);
    throw error;
  } finally {
    client.release();
  }
};
