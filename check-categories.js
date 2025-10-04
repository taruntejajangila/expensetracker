// require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking categories in database...\n');
    
    // Get all categories
    const result = await client.query(
      'SELECT id, name, type, icon, color, is_default, is_active FROM categories WHERE is_active = true ORDER BY type, name'
    );
    
    console.log(`📊 Found ${result.rows.length} active categories:\n`);
    
    // Group by type
    const incomeCategories = result.rows.filter(cat => cat.type === 'income');
    const expenseCategories = result.rows.filter(cat => cat.type === 'expense');
    const transferCategories = result.rows.filter(cat => cat.type === 'transfer');
    
    console.log('💰 INCOME CATEGORIES:');
    incomeCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.icon}, ${cat.color})`);
    });
    
    console.log('\n💸 EXPENSE CATEGORIES:');
    expenseCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.icon}, ${cat.color})`);
    });
    
    console.log('\n🔄 TRANSFER CATEGORIES:');
    transferCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.icon}, ${cat.color})`);
    });
    
    console.log('\n📋 SUMMARY:');
    console.log(`   Total Categories: ${result.rows.length}`);
    console.log(`   Income: ${incomeCategories.length}`);
    console.log(`   Expense: ${expenseCategories.length}`);
    console.log(`   Transfer: ${transferCategories.length}`);
    
  } catch (error) {
    console.error('❌ Error checking categories:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCategories();
