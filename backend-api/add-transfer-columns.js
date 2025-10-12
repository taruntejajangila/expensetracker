const { Pool } = require('pg');

async function addTransferColumns() {
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not provided.');
    process.exit(1);
  }

  console.log('🔗 Connecting to Railway PostgreSQL database...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await pool.connect();
    console.log('✅ Connected!\n');

    console.log('📦 Adding from_account_id and to_account_id columns...');
    
    // Add from_account_id column for transfers
    try {
      await pool.query(`
        ALTER TABLE transactions 
        ADD COLUMN IF NOT EXISTS from_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL
      `);
      console.log('  ✅ Added from_account_id');
    } catch (err) {
      if (err.code === '42701') {
        console.log('  ⏭️  from_account_id already exists');
      } else {
        throw err;
      }
    }

    // Add to_account_id column for transfers
    try {
      await pool.query(`
        ALTER TABLE transactions 
        ADD COLUMN IF NOT EXISTS to_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL
      `);
      console.log('  ✅ Added to_account_id');
    } catch (err) {
      if (err.code === '42701') {
        console.log('  ⏭️  to_account_id already exists');
      } else {
        throw err;
      }
    }

    console.log('\n🎉 Transfer columns migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addTransferColumns();

