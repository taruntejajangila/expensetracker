const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function checkUserPassword() {
  try {
    await pool.connect();
    console.log('✅ Database connected successfully');

    // Check the user credentials
    const userResult = await pool.query(`
      SELECT id, name, email, password_hash, role 
      FROM users 
      WHERE email = $1
    `, ['taruntejajangila@gmail.com']);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('👤 User found:');
      console.log('ID:', user.id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Password hash:', user.password_hash ? 'Set' : 'Not set');
      
      // Check if we can login with the password we know
      const bcrypt = require('bcrypt');
      const testPasswords = ['Tarun123@', 'password123', 'admin123', 'tarun123'];
      
      for (const password of testPasswords) {
        try {
          const isValid = await bcrypt.compare(password, user.password_hash);
          if (isValid) {
            console.log(`✅ Password found: "${password}"`);
            break;
          }
        } catch (error) {
          console.log(`❌ Error testing password "${password}":`, error.message);
        }
      }
    } else {
      console.log('❌ User not found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkUserPassword();
