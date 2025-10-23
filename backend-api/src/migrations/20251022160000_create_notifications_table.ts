import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  // Create notifications table
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
  
  // Create indexes for better performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);
  `);
  
  // Create trigger for updated_at
  await client.query(`
    DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
    CREATE TRIGGER trigger_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Drop the notifications table
  await client.query(`
    DROP TABLE IF EXISTS notifications CASCADE;
  `);
};
