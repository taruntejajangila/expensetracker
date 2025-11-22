import { PoolClient } from 'pg';

export const description = 'Fix admin_users table to link to users table';

export async function up(client: PoolClient): Promise<void> {
  console.log('🔄 Fixing admin_users table linking...');
  
  try {
    // Find the admin user in users table
    const adminUserResult = await client.query(
      "SELECT id FROM users WHERE email = 'admin@expensetracker.com' LIMIT 1"
    );

    if (adminUserResult.rows.length === 0) {
      console.log('⚠️ Admin user not found in users table. Creating admin user...');
      
      // Create admin user if it doesn't exist
      const createUserResult = await client.query(`
        INSERT INTO users (email, password, first_name, last_name, is_verified, is_active)
        VALUES ('admin@expensetracker.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Z9W2XvK6u', 'Admin', 'User', true, true)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `);
      
      if (createUserResult.rows.length > 0) {
        console.log('✅ Admin user created in users table');
      } else {
        // Try to get it again after the insert
        const retryResult = await client.query(
          "SELECT id FROM users WHERE email = 'admin@expensetracker.com' LIMIT 1"
        );
        if (retryResult.rows.length > 0) {
          adminUserResult.rows = retryResult.rows;
        } else {
          console.log('⚠️ Could not create or find admin user. Skipping admin_users linking.');
          return;
        }
      }
    }

    const adminUserId = adminUserResult.rows[0].id;
    console.log(`✅ Found admin user in users table: ${adminUserId}`);

    // Find all admin_users entries with NULL user_id
    const orphanedAdmins = await client.query(
      'SELECT id FROM admin_users WHERE user_id IS NULL'
    );

    if (orphanedAdmins.rows.length > 0) {
      console.log(`🔄 Found ${orphanedAdmins.rows.length} admin_users entry(ies) with NULL user_id. Linking them...`);
      
      // Update all orphaned admin_users to link to the admin user
      for (const admin of orphanedAdmins.rows) {
        await client.query(
          'UPDATE admin_users SET user_id = $1 WHERE id = $2',
          [adminUserId, admin.id]
        );
        console.log(`✅ Linked admin_users ${admin.id} to user ${adminUserId}`);
      }
    } else {
      console.log('✅ No orphaned admin_users entries found');
    }

    // Check if there's an admin_users entry for this user
    const existingAdminUser = await client.query(
      'SELECT id FROM admin_users WHERE user_id = $1',
      [adminUserId]
    );

    if (existingAdminUser.rows.length === 0) {
      console.log('🔄 Creating admin_users entry for admin user...');
      await client.query(`
        INSERT INTO admin_users (user_id, role, created_at, updated_at)
        VALUES ($1, 'admin', NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [adminUserId]);
      console.log('✅ Created admin_users entry for admin user');
    } else {
      console.log('✅ Admin_users entry already exists for admin user');
    }

    console.log('✅ Admin users linking completed successfully');
  } catch (error) {
    console.error('❌ Error fixing admin_users linking:', error);
    throw error;
  }
}

export async function down(client: PoolClient): Promise<void> {
  console.log('🔄 Reverting admin_users linking fix...');
  
  try {
    // This is a data fix migration, so we can't really "undo" it
    // But we can at least log what we're doing
    console.log('⚠️ This migration fixes data integrity. Reverting would break admin functionality.');
    console.log('✅ Revert completed (no changes made)');
  } catch (error) {
    console.error('❌ Error reverting admin_users linking:', error);
    throw error;
  }
}

