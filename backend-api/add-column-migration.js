const { Client } = require('pg');

async function addColumn() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🔧 Adding account_holder_name column...');
        await client.connect();
        
        // Add column
        await client.query(`
            ALTER TABLE bank_accounts 
            ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);
        `);
        
        console.log('✅ Column added successfully!');
        
        // Update existing records
        const result = await client.query(`
            UPDATE bank_accounts 
            SET account_holder_name = account_name 
            WHERE account_holder_name IS NULL;
        `);
        
        console.log(`✅ Updated ${result.rowCount} existing records`);
        
        // Verify
        const verify = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'bank_accounts' 
            AND column_name = 'account_holder_name';
        `);
        
        if (verify.rows.length > 0) {
            console.log('✅ Verification successful!');
        } else {
            console.log('❌ Verification failed!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

addColumn();
