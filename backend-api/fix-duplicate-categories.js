const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker_db',
  password: 'Tarun123@',
  port: 5432,
});

async function fixDuplicateCategories() {
  try {
    console.log('🔍 Connecting to database...');
    
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Find duplicate categories
    console.log('\n🔍 Finding duplicate categories...');
    const duplicatesQuery = `
      SELECT name, type, COUNT(*) as count, 
             array_agg(id ORDER BY id) as ids,
             array_agg(created_at ORDER BY id) as created_ats
      FROM categories 
      GROUP BY name, type 
      HAVING COUNT(*) > 1 
      ORDER BY name, type
    `;
    
    const duplicatesResult = await client.query(duplicatesQuery);
    
    if (duplicatesResult.rows.length === 0) {
      console.log('✅ No duplicate categories found!');
      return;
    }
    
    console.log(`⚠️ Found ${duplicatesResult.rows.length} duplicate category groups:`);
    duplicatesResult.rows.forEach(row => {
      console.log(`   ${row.name} (${row.type}): ${row.count} duplicates`);
    });
    
    // Process each duplicate group
    for (const duplicate of duplicatesResult.rows) {
      const { name, type, ids, created_ats } = duplicate;
      console.log(`\n🔄 Processing duplicates for ${name} (${type})...`);
      
      // Keep the first (oldest) category, remove the rest
      const keepId = ids[0];
      const removeIds = ids.slice(1);
      
      console.log(`   ✅ Keeping: ${keepId} (created: ${created_ats[0]})`);
      console.log(`   🗑️ Removing: ${removeIds.join(', ')}`);
      
      // Check if any transactions use the categories we're about to remove
      for (const removeId of removeIds) {
        const transactionCheck = await client.query(
          'SELECT COUNT(*) as count FROM transactions WHERE category_id = $1',
          [removeId]
        );
        
        if (parseInt(transactionCheck.rows[0].count) > 0) {
          console.log(`   ⚠️ Category ${removeId} has ${transactionCheck.rows[0].count} transactions - updating references...`);
          
          // Update transactions to use the kept category
          await client.query(
            'UPDATE transactions SET category_id = $1 WHERE category_id = $2',
            [keepId, removeId]
          );
          
          console.log(`   ✅ Updated ${transactionCheck.rows[0].count} transactions to use category ${keepId}`);
        }
        
        // Check if any budgets use the categories we're about to remove
        const budgetCheck = await client.query(
          'SELECT COUNT(*) as count FROM budgets WHERE category_id = $1',
          [removeId]
        );
        
        if (parseInt(budgetCheck.rows[0].count) > 0) {
          console.log(`   ⚠️ Category ${removeId} has ${budgetCheck.rows[0].count} budgets - updating references...`);
          
          // Update budgets to use the kept category
          await client.query(
            'UPDATE budgets SET category_id = $1 WHERE category_id = $2',
            [keepId, removeId]
          );
          
          console.log(`   ✅ Updated ${budgetCheck.rows[0].count} budgets to use category ${keepId}`);
        }
        
        // Now safe to delete the duplicate category
        await client.query('DELETE FROM categories WHERE id = $1', [removeId]);
        console.log(`   🗑️ Deleted duplicate category ${removeId}`);
      }
    }
    
    // Verify the cleanup
    console.log('\n🔍 Verifying cleanup...');
    const finalCheck = await client.query(`
      SELECT name, type, COUNT(*) as count 
      FROM categories 
      GROUP BY name, type 
      HAVING COUNT(*) > 1
    `);
    
    if (finalCheck.rows.length === 0) {
      console.log('✅ All duplicates have been successfully removed!');
    } else {
      console.log('❌ Some duplicates still exist:', finalCheck.rows);
    }
    
    // Show final category count
    const finalCount = await client.query('SELECT COUNT(*) as total FROM categories');
    console.log(`\n📊 Final category count: ${finalCount.rows[0].total}`);
    
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
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error fixing duplicate categories:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
fixDuplicateCategories();
