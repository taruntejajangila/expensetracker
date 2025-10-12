// Create Admin User Script
// Run this to create the default admin user in Railway database

const { Pool } = require('pg');

// Use DATABASE_URL from environment or command line
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ No DATABASE_URL provided');
  console.log('Usage: node create-admin-user.js <DATABASE_URL>');
  console.log('Or set DATABASE_URL environment variable');
  process.exit(1);
}

async function createAdminUser() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Check if admin user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@expensetracker.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingUser.rows[0].email);
      console.log('👤 Name:', existingUser.rows[0].first_name, existingUser.rows[0].last_name);
      console.log('\nIf you want to reset the password, delete this user first:');
      console.log(`DELETE FROM users WHERE email = 'admin@expensetracker.com';`);
      return;
    }

    // Create admin user
    console.log('🔧 Creating admin user...');
    const result = await pool.query(`
      INSERT INTO users (email, password, first_name, last_name, is_verified, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name
    `, [
      'admin@expensetracker.com',
      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Z9W2XvK6u', // bcrypt hash of 'admin123'
      'Admin',
      'User',
      true,
      true
    ]);

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', result.rows[0].email);
    console.log('🔑 Password: admin123');
    console.log('👤 Name:', result.rows[0].first_name, result.rows[0].last_name);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdminUser()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

