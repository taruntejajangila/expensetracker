/**
 * Check admin_users table structure
 * This script will check if the admin_users table exists and what columns it has
 */

const { Pool } = require('pg');

// Get database URL from command line argument
const databaseUrl = process.argv[2];

if (!databaseUrl) {
    console.error('❌ Error: Please provide the database URL as an argument');
    console.log('Usage: node check-admin-users-table.js "postgresql://user:pass@host:port/db"');
    process.exit(1);
}

// Create database connection
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkAdminUsersTable() {
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
            console.log('❌ admin_users table does NOT exist!');
        } else {
            console.log('✅ admin_users table EXISTS!');
            
            // Get table structure
            const structureResult = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'admin_users' 
                ORDER BY ordinal_position;
            `);
            
            console.log('📋 Table structure:');
            structureResult.rows.forEach(row => {
                console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
            });
            
            // Check if there are any records
            const countResult = await client.query('SELECT COUNT(*) as count FROM admin_users');
            console.log(`📊 Total records: ${countResult.rows[0].count}`);
            
            // Show sample records
            if (parseInt(countResult.rows[0].count) > 0) {
                const sampleResult = await client.query('SELECT * FROM admin_users LIMIT 3');
                console.log('📝 Sample records:');
                sampleResult.rows.forEach((row, index) => {
                    console.log(`   Record ${index + 1}:`, row);
                });
            }
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error checking admin_users table:', error.message);
        console.error('   Full error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
checkAdminUsersTable();
