import { Client } from 'pg';

export async function up(client: Client): Promise<void> {
  console.log('🔄 Adding Balance Transfer category...');
  
  try {
    // Check if category already exists
    const existing = await client.query(
      "SELECT id FROM categories WHERE name = 'Balance Transfer' AND type = 'transfer'"
    );

    if (existing.rows.length > 0) {
      console.log('✅ Balance Transfer category already exists');
      return;
    }

    // Insert the Balance Transfer category
    await client.query(`
      INSERT INTO categories (id, user_id, name, icon, color, type, is_default, is_active, sort_order, created_at, updated_at) 
      VALUES (gen_random_uuid(), NULL, 'Balance Transfer', 'swap-horizontal', '#9C88FF', 'transfer', true, true, 999, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Balance Transfer category added successfully');
  } catch (error) {
    console.error('❌ Error adding Balance Transfer category:', error);
    throw error;
  }
}

export async function down(client: Client): Promise<void> {
  console.log('🔄 Removing Balance Transfer category...');
  
  try {
    await client.query(
      "DELETE FROM categories WHERE name = 'Balance Transfer' AND type = 'transfer'"
    );
    console.log('✅ Balance Transfer category removed');
  } catch (error) {
    console.error('❌ Error removing Balance Transfer category:', error);
    throw error;
  }
}

