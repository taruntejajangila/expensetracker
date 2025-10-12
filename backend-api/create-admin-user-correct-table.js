/**
 * Create Admin User in admin_users Table
 * This script will create the admin user in the correct admin_users table
 */

const { Pool } = require('pg');

// Get database URL from command line argument
const databaseUrl = process.argv[2];

if (!databaseUrl) {
    console.error('❌ Error: Please provide the database URL as an argument');
    console.log('Usage: node create-admin-user-correct-table.js "postgresql://user:pass@host:port/db"');
    process.exit(1);
}

// Create database connection
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createAdminUser() {
    try {
        console.log('🔗 Connecting to Railway PostgreSQL database...');
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to database successfully!');
        
        // Check if admin_users table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'admin_users'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('🔧 Creating admin_users table...');
            
            // Create admin_users table
            await client.query(`
                CREATE TABLE admin_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'admin',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
            
            console.log('✅ admin_users table created!');
        }
        
        // Check if admin user already exists
        const checkUser = await client.query(
            'SELECT id, username, email, role FROM admin_users WHERE email = $1',
            ['admin@expensetracker.com']
        );
        
        if (checkUser.rows.length > 0) {
            console.log('⚠️  Admin user already exists in admin_users table!');
            console.log(`   User ID: ${checkUser.rows[0].id}`);
            console.log(`   Username: ${checkUser.rows[0].username}`);
            console.log(`   Email: ${checkUser.rows[0].email}`);
            console.log(`   Role: ${checkUser.rows[0].role}`);
            console.log('   Password: admin123');
            client.release();
            return;
        }
        
        // Hash the password (admin123)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Create admin user in admin_users table
        const insertUser = await client.query(`
            INSERT INTO admin_users (
                username,
                email, 
                password_hash, 
                role,
                is_active,
                created_at, 
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id, username, email, role
        `, [
            'admin',
            'admin@expensetracker.com',
            hashedPassword,
            'admin',
            true
        ]);
        
        const newUser = insertUser.rows[0];
        
        console.log('🎉 Admin user created successfully in admin_users table!');
        console.log(`   User ID: ${newUser.id}`);
        console.log(`   Username: ${newUser.username}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Role: ${newUser.role}`);
        console.log('   Password: admin123');
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        console.error('   Full error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
createAdminUser();
