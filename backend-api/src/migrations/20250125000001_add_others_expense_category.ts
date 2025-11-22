import { PoolClient } from 'pg';

export const description = 'Add Others expense category';

export async function up(client: PoolClient): Promise<void> {
  console.log('🔄 Adding Others expense category...');
  
  try {
    // Check if category already exists
    const existing = await client.query(
      "SELECT id FROM categories WHERE name = $1 AND type = $2",
      ['Others', 'expense']
    );

    if (existing.rows.length > 0) {
      console.log('✅ Category "Others" already exists, skipping...');
      return;
    }

    // Insert the category
    await client.query(`
      INSERT INTO categories (id, user_id, name, icon, color, type, is_default, is_active, sort_order, created_at, updated_at) 
      VALUES (gen_random_uuid(), NULL, $1, $2, $3, $4, true, true, 99, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, ['Others', 'ellipsis-horizontal', '#CCCCCC', 'expense']);

    console.log('✅ Category "Others" added successfully');
  } catch (error) {
    console.error('❌ Error adding Others category:', error);
    throw error;
  }
}

export async function down(client: PoolClient): Promise<void> {
  console.log('🔄 Removing Others expense category...');
  
  try {
    await client.query(
      "DELETE FROM categories WHERE name = $1 AND type = $2",
      ['Others', 'expense']
    );
    console.log('✅ Category "Others" removed');
  } catch (error) {
    console.error('❌ Error removing Others category:', error);
    throw error;
  }
}

