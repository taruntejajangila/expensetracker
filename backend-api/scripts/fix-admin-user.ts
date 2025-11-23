import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking admin user setup...');
    
    // 1. Check if admin user exists in users table
    const userResult = await client.query(
      "SELECT id, email, password, is_active FROM users WHERE email = 'admin@expensetracker.com'"
    );
    
    let adminUserId: string;
    
    if (userResult.rows.length === 0) {
      console.log('⚠️ Admin user not found. Creating...');
      
      // Hash the password: admin123
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const createResult = await client.query(`
        INSERT INTO users (email, password, first_name, last_name, is_verified, is_active)
        VALUES ('admin@expensetracker.com', $1, 'Admin', 'User', true, true)
        RETURNING id
      `, [hashedPassword]);
      
      adminUserId = createResult.rows[0].id;
      console.log('✅ Admin user created:', adminUserId);
    } else {
      adminUserId = userResult.rows[0].id;
      console.log('✅ Admin user found:', adminUserId);
      
      // Check if password is set
      if (!userResult.rows[0].password) {
        console.log('⚠️ Admin user has no password. Setting password to admin123...');
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await client.query(
          'UPDATE users SET password = $1 WHERE id = $2',
          [hashedPassword, adminUserId]
        );
        console.log('✅ Password set');
      }
      
      // Ensure user is active
      if (!userResult.rows[0].is_active) {
        console.log('⚠️ Admin user is inactive. Activating...');
        await client.query(
          'UPDATE users SET is_active = true WHERE id = $1',
          [adminUserId]
        );
        console.log('✅ Admin user activated');
      }
    }
    
    // 2. Check if admin_users entry exists
    const adminUserResult = await client.query(
      'SELECT id FROM admin_users WHERE user_id = $1',
      [adminUserId]
    );
    
    if (adminUserResult.rows.length === 0) {
      console.log('⚠️ Admin_users entry not found. Creating...');
      await client.query(`
        INSERT INTO admin_users (user_id, role, created_at, updated_at)
        VALUES ($1, 'admin', NOW(), NOW())
      `, [adminUserId]);
      console.log('✅ Admin_users entry created');
    } else {
      console.log('✅ Admin_users entry exists');
    }
    
    // 3. Verify the setup
    const verifyResult = await client.query(`
      SELECT 
        au.id as admin_id,
        au.user_id,
        au.role,
        u.id as user_id,
        u.email,
        u.is_active
      FROM admin_users au
      INNER JOIN users u ON au.user_id = u.id
      WHERE u.email = 'admin@expensetracker.com'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('\n✅ Admin user setup verified:');
      console.log('   Email:', verifyResult.rows[0].email);
      console.log('   Role:', verifyResult.rows[0].role);
      console.log('   Active:', verifyResult.rows[0].is_active);
      console.log('   User ID:', verifyResult.rows[0].user_id);
      console.log('   Admin ID:', verifyResult.rows[0].admin_id);
      console.log('\n📝 Login credentials:');
      console.log('   Email: admin@expensetracker.com');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Verification failed - admin user setup incomplete');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminUser()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

