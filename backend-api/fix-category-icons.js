const { Pool } = require('pg');

async function fixCategoryIcons() {
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not provided.');
    process.exit(1);
  }

  console.log('🔗 Connecting to Railway PostgreSQL database...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await pool.connect();
    console.log('✅ Connected!\n');

    console.log('🔧 Updating category icons to use valid Ionicons names...');
    
    const iconMappings = [
      { old: 'utensils', new: 'restaurant', name: 'Food & Dining' },
      { old: 'shopping-bag', new: 'cart', name: 'Shopping' },
      { old: 'file-text', new: 'document-text', name: 'Bills & Utilities' },
      { old: 'plane', new: 'airplane', name: 'Travel' },
      { old: 'dollar-sign', new: 'cash', name: 'Salary' },
      { old: 'trending-up', new: 'trending-up', name: 'Investment' }, // Already valid
      { old: 'plus-circle', new: 'add-circle', name: 'Other Income' },
    ];

    for (const mapping of iconMappings) {
      try {
        const result = await pool.query(
          `UPDATE categories SET icon = $1 WHERE name = $2 AND is_default = true`,
          [mapping.new, mapping.name]
        );
        if (result.rowCount > 0) {
          console.log(`  ✅ Updated "${mapping.name}": ${mapping.old} → ${mapping.new}`);
        } else {
          console.log(`  ⏭️  "${mapping.name}" not found or already updated`);
        }
      } catch (err) {
        console.log(`  ❌ Error updating ${mapping.name}:`, err.message);
      }
    }

    console.log('\n🎉 Category icons migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixCategoryIcons();

