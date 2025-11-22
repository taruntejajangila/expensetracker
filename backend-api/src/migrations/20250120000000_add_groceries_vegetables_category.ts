import { PoolClient } from 'pg';

export const description = 'Add Groceries & Vegetables category';

export async function up(client: PoolClient): Promise<void> {
  console.log('🔄 Adding Groceries & Vegetables category...');
  
  try {
    // Check if category already exists
    const existing = await client.query(
      "SELECT id FROM categories WHERE name = $1 AND type = $2",
      ['Groceries & Vegetables', 'expense']
    );

    if (existing.rows.length > 0) {
      console.log('✅ Category "Groceries & Vegetables" already exists, skipping...');
      return;
    }

    // Insert the category
    await client.query(`
      INSERT INTO categories (id, user_id, name, icon, color, type, is_default, is_active, sort_order, created_at, updated_at) 
      VALUES (gen_random_uuid(), NULL, $1, $2, $3, $4, true, true, 5, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, ['Groceries & Vegetables', 'basket', '#4CAF50', 'expense']);

    console.log('✅ Category "Groceries & Vegetables" added successfully');
  } catch (error) {
    console.error('❌ Error adding Groceries & Vegetables category:', error);
    throw error;
  }
}

export async function down(client: PoolClient): Promise<void> {
  console.log('🔄 Removing Groceries & Vegetables category...');
  
  try {
    await client.query(
      "DELETE FROM categories WHERE name = $1 AND type = $2",
      ['Groceries & Vegetables', 'expense']
    );
    console.log('✅ Category "Groceries & Vegetables" removed');
  } catch (error) {
    console.error('❌ Error removing Groceries & Vegetables category:', error);
    throw error;
  }
}

