/**
 * Check database structure and admin_users table
 * This script will show us exactly what's in the database
 */

const { Pool } = require('pg');

// Get database URL from command line argument
const databaseUrl = process.argv[2];

if (!databaseUrl) {
    console.error('❌ Error: Please provide the database URL as an argument');
    console.log('Usage: node check-database-structure.js "postgresql://user:pass@host:port/db"');
    process.exit(1);
}

// Create database connection
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkDatabaseStructure() {
    try {
        console.log('🔗 Connecting to Railway PostgreSQL database...');
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to database successfully!');
        
        // Check all tables
        console.log('\n📋 ALL TABLES IN DATABASE:');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        tablesResult.rows.forEach(row => {
            console.log(`   📄 ${row.table_name}`);
        });
        
        // Check admin_users table structure
        console.log('\n🔍 ADMIN_USERS TABLE STRUCTURE:');
        const adminStructureResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admin_users' 
            ORDER BY ordinal_position;
        `);
        
        if (adminStructureResult.rows.length === 0) {
            console.log('❌ admin_users table does NOT exist!');
        } else {
            console.log('✅ admin_users table EXISTS with columns:');
            adminStructureResult.rows.forEach(row => {
                console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
            });
        }
        
        // Check users table structure
        console.log('\n🔍 USERS TABLE STRUCTURE:');
        const usersStructureResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `);
        
        if (usersStructureResult.rows.length === 0) {
            console.log('❌ users table does NOT exist!');
        } else {
            console.log('✅ users table EXISTS with columns:');
            usersStructureResult.rows.forEach(row => {
                console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
            });
        }
        
        // Check admin_users records
        console.log('\n📊 ADMIN_USERS RECORDS:');
        const adminCountResult = await client.query('SELECT COUNT(*) as count FROM admin_users');
        console.log(`Total admin_users records: ${adminCountResult.rows[0].count}`);
        
        if (parseInt(adminCountResult.rows[0].count) > 0) {
            const adminRecordsResult = await client.query('SELECT * FROM admin_users LIMIT 5');
            console.log('Sample admin_users records:');
            adminRecordsResult.rows.forEach((row, index) => {
                console.log(`   Record ${index + 1}:`, JSON.stringify(row, null, 2));
            });
        }
        
        // Test the exact query that's failing
        console.log('\n🧪 TESTING THE EXACT QUERY THAT IS FAILING:');
        try {
            const testQuery = `
                SELECT id, username, email, NULL as phone, role, is_active, created_at, updated_at 
                FROM admin_users 
                WHERE id = $1 AND is_active = true
            `;
            const testResult = await client.query(testQuery, ['e427b230-b1a0-4048-bef8-ffbe9b10971f']);
            console.log('✅ Original query works! Rows found:', testResult.rows.length);
            if (testResult.rows.length > 0) {
                console.log('Sample result:', JSON.stringify(testResult.rows[0], null, 2));
            }
        } catch (error) {
            console.log('❌ Original query failed:', error.message);
        }
        
        // Test the new simplified query
        console.log('\n🧪 TESTING THE NEW SIMPLIFIED QUERY:');
        try {
            const newQuery = `
                SELECT id, username, email, role, is_active, created_at, updated_at 
                FROM admin_users 
                WHERE id = $1 AND is_active = true
            `;
            const newResult = await client.query(newQuery, ['e427b230-b1a0-4048-bef8-ffbe9b10971f']);
            console.log('✅ New query works! Rows found:', newResult.rows.length);
            if (newResult.rows.length > 0) {
                console.log('Sample result:', JSON.stringify(newResult.rows[0], null, 2));
            }
        } catch (error) {
            console.log('❌ New query failed:', error.message);
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error checking database structure:', error.message);
        console.error('   Full error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
checkDatabaseStructure();
