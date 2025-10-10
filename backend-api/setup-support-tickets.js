const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'Tarun123@',
  port: process.env.DB_PORT || 5432,
});

async function setupSupportTickets() {
  const client = await pool.connect();
  
  try {
    console.log('🎫 Setting up Support Tickets Database Tables...');
    
    // Create support_tickets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ticket_number VARCHAR(20) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        assigned_to UUID REFERENCES admin_users(id),
        resolution_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE,
        closed_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✅ Support tickets table created');

    // Create support_ticket_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Support ticket messages table created');

    // Create support_ticket_attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Support ticket attachments table created');

    // Create ticket_attachments table (alternative naming used in code)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Ticket attachments table created');

    // Create function to generate ticket numbers
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_ticket_number()
      RETURNS VARCHAR AS $$
      DECLARE
        ticket_number VARCHAR;
        counter INTEGER;
      BEGIN
        -- Get the current count of tickets for today
        SELECT COUNT(*) + 1 INTO counter
        FROM support_tickets
        WHERE DATE(created_at) = CURRENT_DATE;
        
        -- Format as ST-YYYYMMDD-XXX
        ticket_number := 'ST-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
        
        RETURN ticket_number;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Ticket number generator function created');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
      CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_support_ticket_attachments_ticket_id ON support_ticket_attachments(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
    `);
    console.log('✅ Indexes created');

    console.log('\n🎉 Support Tickets Database Setup Complete!');
    console.log('==========================================');
    console.log('✅ support_tickets table');
    console.log('✅ support_ticket_messages table');  
    console.log('✅ support_ticket_attachments table');
    console.log('✅ ticket_attachments table');
    console.log('✅ generate_ticket_number() function');
    console.log('✅ Performance indexes');
    
  } catch (error) {
    console.error('❌ Error setting up support tickets:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupSupportTickets();
