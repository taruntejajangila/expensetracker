const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker_db',
  password: 'postgres',
  port: 5432,
});

async function createCustomNotificationsTable() {
  try {
    console.log('Creating custom_notifications table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_notifications (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body VARCHAR(500) NOT NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(255),
        image_url VARCHAR(2048),
        action_button_text VARCHAR(100),
        action_button_url VARCHAR(2048),
        action_button_action VARCHAR(100),
        tags JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ custom_notifications table created successfully');

    // Check if table was created
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'custom_notifications'
      ORDER BY ordinal_position
    `);

    console.log('📋 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error creating custom_notifications table:', error);
  } finally {
    await pool.end();
  }
}

createCustomNotificationsTable();
