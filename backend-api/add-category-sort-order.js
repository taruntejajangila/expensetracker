const { Pool } = require('pg');

async function addCategorySortOrder() {
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

    console.log('📦 Adding sort_order column to categories table...');
    
    try {
      await pool.query(`
        ALTER TABLE categories 
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999
      `);
      console.log('  ✅ Added sort_order column');
    } catch (err) {
      if (err.code === '42701') {
        console.log('  ⏭️  sort_order already exists');
      } else {
        throw err;
      }
    }

    console.log('\n🎉 Categories migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addCategorySortOrder();

