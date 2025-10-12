const { Pool } = require('pg');

async function checkTransactionsSchema() {
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

    // Check transactions table structure
    console.log('📊 TRANSACTIONS TABLE COLUMNS:');
    const transactionsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    transactionsColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n📊 SAMPLE TRANSACTION:');
    const sampleTx = await pool.query('SELECT * FROM transactions LIMIT 1');
    if (sampleTx.rows.length > 0) {
      console.log(JSON.stringify(sampleTx.rows[0], null, 2));
    } else {
      console.log('  No transactions found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTransactionsSchema();

