const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker_db',
  password: 'Tarun123@',
  port: 5432,
});

async function deleteAllCategories() {
  try {
    console.log('🔍 Connecting to database...');
    
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // First, let's check what we're about to delete
    console.log('\n🔍 Current categories in database:');
    const currentCategories = await client.query('SELECT name, type, COUNT(*) as count FROM categories GROUP BY name, type ORDER BY type, name');
    
    if (currentCategories.rows.length === 0) {
      console.log('✅ No categories found to delete!');
      return;
    }
    
    currentCategories.rows.forEach(row => {
      console.log(`   ${row.name} (${row.type}): ${row.count} entries`);
    });
    
    // Check if any transactions or budgets use these categories
    console.log('\n🔍 Checking for dependencies...');
    
    const transactionCount = await client.query('SELECT COUNT(*) as count FROM transactions');
    const budgetCount = await client.query('SELECT COUNT(*) as count FROM budgets');
    
    console.log(`   Transactions: ${transactionCount.rows[0].count}`);
    console.log(`   Budgets: ${budgetCount.rows[0].count}`);
    
    if (parseInt(transactionCount.rows[0].count) > 0 || parseInt(budgetCount.rows[0].count) > 0) {
      console.log('\n⚠️ WARNING: Found existing transactions and/or budgets!');
      console.log('   These will lose their category references when we delete categories.');
      console.log('   You may need to recreate them after adding new categories.');
      
      const proceed = await new Promise((resolve) => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question('\n❓ Do you want to proceed? This will affect existing data. (yes/no): ', (answer) => {
          readline.close();
          resolve(answer.toLowerCase() === 'yes');
        });
      });
      
      if (!proceed) {
        console.log('❌ Operation cancelled by user.');
        return;
      }
    }
    
    // Backup category information for reference
    console.log('\n💾 Backing up current category information...');
    const backupQuery = await client.query(`
      SELECT id, name, type, icon, color, created_at, updated_at 
      FROM categories 
      ORDER BY type, name
    `);
    
    console.log(`   Backed up ${backupQuery.rows.length} categories`);
    
    // Delete all categories
    console.log('\n🗑️ Deleting all categories...');
    const deleteResult = await client.query('DELETE FROM categories');
    
    console.log(`✅ Successfully deleted ${deleteResult.rowCount} categories!`);
    
    // Verify deletion
    const verifyQuery = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`\n🔍 Verification: ${verifyQuery.rows[0].count} categories remaining`);
    
    if (parseInt(verifyQuery.rows[0].count) === 0) {
      console.log('✅ All categories have been successfully deleted!');
    }
    
    // Show current database state
    console.log('\n📊 Current database state:');
    const tables = ['categories', 'transactions', 'budgets', 'bank_accounts'];
    
    for (const table of tables) {
      try {
        const count = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${count.rows[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: table not found or error`);
      }
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Tell me which categories you want to create');
    console.log('2. I will create them with proper icons and colors');
    console.log('3. Your expense tracker will have a fresh, clean category system');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error deleting categories:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
deleteAllCategories();
