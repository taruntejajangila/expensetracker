/**
 * Verify database tables and functions
 * Usage: node scripts/verify-database.js [DATABASE_URL]
 */

const { Pool } = require('pg');

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not provided!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
});

async function verify() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying database setup...\n');
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ Tables: ${tables.rows.length} found`);
    console.log('   ' + tables.rows.map(r => r.table_name).join(', '));
    
    // Check functions
    const functions = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND proname IN ('generate_ticket_number', 'update_updated_at_column')
    `);
    
    console.log(`\n✅ Functions: ${functions.rows.length} found`);
    functions.rows.forEach(f => console.log(`   - ${f.proname}`));
    
    // Check paid_at column
    const paidAt = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reminders' AND column_name = 'paid_at'
    `);
    
    console.log(`\n✅ Reminders paid_at column: ${paidAt.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);
    
    // Check categories
    const categories = await client.query(`
      SELECT COUNT(*) as count 
      FROM categories 
      WHERE user_id IS NULL
    `);
    
    console.log(`\n✅ Default categories: ${categories.rows[0].count} found`);
    
    console.log('\n✅ Database verification complete! 🎉\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch(console.error);

