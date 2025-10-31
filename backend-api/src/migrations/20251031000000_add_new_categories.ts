import { Client } from 'pg';

export async function up(client: Client): Promise<void> {
  console.log('🔄 Adding new expense and income categories...');
  
  try {
    const newCategories = [
      // Expense categories
      { name: 'Rent', icon: 'home', color: '#FF7675', type: 'expense' },
      { name: 'Subscription', icon: 'card', color: '#74B9FF', type: 'expense' },
      { name: 'Gifts & Donations', icon: 'gift', color: '#FD79A8', type: 'expense' },
      { name: 'Gas/Fuel', icon: 'car-sport', color: '#FDCB6E', type: 'expense' },
      { name: 'EMI/Loan Payment', icon: 'wallet', color: '#E17055', type: 'expense' },
      // Income categories
      { name: 'Bonus', icon: 'trophy', color: '#A29BFE', type: 'income' },
      { name: 'Interest Income', icon: 'cash', color: '#6C5CE7', type: 'income' },
      { name: 'Part Time Income', icon: 'time', color: '#00B894', type: 'income' }
    ];

    for (const category of newCategories) {
      // Check if category already exists
      const existing = await client.query(
        "SELECT id FROM categories WHERE name = $1 AND type = $2",
        [category.name, category.type]
      );

      if (existing.rows.length > 0) {
        console.log(`✅ Category "${category.name}" already exists, skipping...`);
        continue;
      }

      // Insert the category
      await client.query(`
        INSERT INTO categories (id, user_id, name, icon, color, type, is_default, is_active, sort_order, created_at, updated_at) 
        VALUES (gen_random_uuid(), NULL, $1, $2, $3, $4, true, true, 999, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [category.name, category.icon, category.color, category.type]);

      console.log(`✅ Category "${category.name}" added successfully`);
    }

    console.log('✅ All new categories added successfully');
  } catch (error) {
    console.error('❌ Error adding new categories:', error);
    throw error;
  }
}

export async function down(client: Client): Promise<void> {
  console.log('🔄 Removing new categories...');
  
  try {
    const categoriesToRemove = [
      'Rent',
      'Subscription',
      'Gifts & Donations',
      'Gas/Fuel',
      'EMI/Loan Payment',
      'Bonus',
      'Interest Income',
      'Part Time Income'
    ];

    for (const categoryName of categoriesToRemove) {
      await client.query(
        "DELETE FROM categories WHERE name = $1",
        [categoryName]
      );
      console.log(`✅ Category "${categoryName}" removed`);
    }

    console.log('✅ All new categories removed');
  } catch (error) {
    console.error('❌ Error removing new categories:', error);
    throw error;
  }
}

