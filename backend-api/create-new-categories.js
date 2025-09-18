const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker_db',
  password: 'Tarun123@',
  port: 5432,
});

async function createNewCategories() {
  try {
    console.log('🔍 Connecting to database...');
    
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check current state
    const currentCount = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`\n📊 Current categories in database: ${currentCount.rows[0].count}`);
    
    if (parseInt(currentCount.rows[0].count) > 0) {
      console.log('⚠️ Categories already exist. Please delete them first.');
      return;
    }
    
    // Define new categories with icons and colors
    const newCategories = [
      // Income Categories
      {
        name: 'Salary',
        type: 'income',
        icon: 'cash',
        color: '#10B981' // Green
      },
      {
        name: 'Freelance',
        type: 'income',
        icon: 'laptop',
        color: '#F59E0B' // Amber
      },
      {
        name: 'Business Income',
        type: 'income',
        icon: 'briefcase',
        color: '#EC4899' // Pink
      },
      {
        name: 'Rental Income',
        type: 'income',
        icon: 'home',
        color: '#8B5CF6' // Purple
      },
      {
        name: 'Gift/Donations Received',
        type: 'income',
        icon: 'gift',
        color: '#06B6D4' // Cyan
      },
      {
        name: 'Other Income',
        type: 'income',
        icon: 'plus-circle',
        color: '#6B7280' // Gray
      },
      
      // Expense Categories
      {
        name: 'Groceries',
        type: 'expense',
        icon: 'cart',
        color: '#10B981' // Green
      },
      {
        name: 'Dining Out/Food Delivery',
        type: 'expense',
        icon: 'restaurant',
        color: '#F59E0B' // Amber
      },
      {
        name: 'Utilities',
        type: 'expense',
        icon: 'flash',
        color: '#EF4444' // Red
      },
      {
        name: 'Rent',
        type: 'expense',
        icon: 'home',
        color: '#8B5CF6' // Purple
      },
      {
        name: 'Shopping',
        type: 'expense',
        icon: 'bag',
        color: '#EC4899' // Pink
      },
      {
        name: 'Entertainment',
        type: 'expense',
        icon: 'film',
        color: '#F97316' // Orange
      },
      {
        name: 'Transportation',
        type: 'expense',
        icon: 'car',
        color: '#06B6D4' // Cyan
      },
      {
        name: 'Travel/Vacation',
        type: 'expense',
        icon: 'airplane',
        color: '#6366F1' // Indigo
      },
      {
        name: 'Loan/Debt Payments',
        type: 'expense',
        icon: 'card',
        color: '#DC2626' // Red
      },
      {
        name: 'Health',
        type: 'expense',
        icon: 'medical',
        color: '#059669' // Emerald
      },
      {
        name: 'Education',
        type: 'expense',
        icon: 'school',
        color: '#7C3AED' // Violet
      },
      {
        name: 'Savings & Investment',
        type: 'expense',
        icon: 'trending-up',
        color: '#059669' // Emerald
      },
      {
        name: 'Family & Child',
        type: 'expense',
        icon: 'people',
        color: '#F59E0B' // Amber
      }
    ];
    
    console.log(`\n📝 Creating ${newCategories.length} new categories...`);
    
    // Insert categories
    for (const category of newCategories) {
      const insertQuery = `
        INSERT INTO categories (name, type, icon, color, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name, type, icon, color
      `;
      
      const values = [category.name, category.type, category.icon, category.color];
      
      try {
        const result = await client.query(insertQuery, values);
        const newCategory = result.rows[0];
        console.log(`   ✅ Created: ${newCategory.name} (${newCategory.type}) - Icon: ${newCategory.icon}, Color: ${newCategory.color}`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${category.name}: ${error.message}`);
      }
    }
    
    // Verify creation
    console.log('\n🔍 Verifying created categories...');
    const finalCount = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`   Total categories: ${finalCount.rows[0].count}`);
    
    // Show categories by type
    const byType = await client.query(`
      SELECT type, COUNT(*) as count 
      FROM categories 
      GROUP BY type 
      ORDER BY type
    `);
    
    console.log('\n📋 Categories by type:');
    byType.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.count} categories`);
    });
    
    // Show all categories
    console.log('\n📊 All Categories:');
    const allCategories = await client.query(`
      SELECT name, type, icon, color 
      FROM categories 
      ORDER BY type, name
    `);
    
    allCategories.rows.forEach((category, index) => {
      const typeIcon = category.type === 'income' ? '💵' : '💸';
      console.log(`   ${index + 1}. ${typeIcon} ${category.name} (${category.type}) - ${category.icon} icon, ${category.color}`);
    });
    
    console.log('\n🎉 Categories created successfully!');
    console.log('\n🎯 Next steps:');
    console.log('1. Test the mobile app to see new categories');
    console.log('2. Create budgets for expense categories');
    console.log('3. Add transactions with new categories');
    console.log('4. Recreate database constraints if needed');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error creating categories:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createNewCategories();
