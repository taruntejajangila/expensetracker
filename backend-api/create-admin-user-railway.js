/**
 * Create Admin User in Railway PostgreSQL Database
 * This script will create the admin user for the expense tracker
 */

const { Pool } = require('pg');

// Get database URL from command line argument
const databaseUrl = process.argv[2];

if (!databaseUrl) {
    console.error('❌ Error: Please provide the database URL as an argument');
    console.log('Usage: node create-admin-user-railway.js "postgresql://user:pass@host:port/db"');
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
        
        // Check if admin user already exists
        const checkUser = await client.query(
            'SELECT id, email FROM users WHERE email = $1',
            ['admin@expensetracker.com']
        );
        
        if (checkUser.rows.length > 0) {
            console.log('⚠️  Admin user already exists!');
            console.log(`   User ID: ${checkUser.rows[0].id}`);
            console.log(`   Email: ${checkUser.rows[0].email}`);
            console.log('   Password: admin123');
            client.release();
            return;
        }
        
        // Hash the password (admin123)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Create admin user
        const insertUser = await client.query(`
            INSERT INTO users (
                email, 
                password, 
                first_name, 
                last_name, 
                phone, 
                role, 
                is_active, 
                email_verified, 
                created_at, 
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING id, email, first_name, last_name, role
        `, [
            'admin@expensetracker.com',
            hashedPassword,
            'Admin',
            'User',
            '+1234567890',
            'admin',
            true,
            true
        ]);
        
        const newUser = insertUser.rows[0];
        
        console.log('🎉 Admin user created successfully!');
        console.log(`   User ID: ${newUser.id}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Name: ${newUser.first_name} ${newUser.last_name}`);
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
