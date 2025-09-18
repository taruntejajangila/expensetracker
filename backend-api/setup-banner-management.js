const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupBannerManagement() {
  try {
    console.log('🚀 Setting up Banner Management System...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'database', 'banner-management.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    await pool.query(sqlContent);
    
    console.log('✅ Banner Management System setup completed successfully!');
    console.log('📊 Created tables: banners, banner_categories, banner_analytics');
    console.log('📈 Created views: active_banners, banner_analytics_summary');
    console.log('🎯 Sample banners and categories inserted');
    
    // Test the setup
    const testQuery = await pool.query('SELECT COUNT(*) as banner_count FROM banners');
    const categoryQuery = await pool.query('SELECT COUNT(*) as category_count FROM banner_categories');
    
    console.log(`📊 Sample data: ${testQuery.rows[0].banner_count} banners, ${categoryQuery.rows[0].category_count} categories`);
    
  } catch (error) {
    console.error('❌ Error setting up Banner Management System:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
setupBannerManagement()
  .then(() => {
    console.log('🎉 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
