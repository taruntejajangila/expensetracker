const { Pool } = require('pg');

async function migrateBanners() {
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

    // 1. Create banner_categories table
    console.log('📦 Creating banner_categories table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banner_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6C5CE7',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ banner_categories table created!');

    // 2. Add missing columns to banners table
    console.log('\n📦 Adding missing columns to banners table...');
    
    const alterCommands = [
      { col: 'subtitle', sql: 'ALTER TABLE banners ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255)' },
      { col: 'target_url', sql: 'ALTER TABLE banners ADD COLUMN IF NOT EXISTS target_url VARCHAR(2048)' },
      { col: 'background_color', sql: "ALTER TABLE banners ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#6C5CE7'" },
      { col: 'text_color', sql: "ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#FFFFFF'" },
      { col: 'icon', sql: 'ALTER TABLE banners ADD COLUMN IF NOT EXISTS icon VARCHAR(100)' },
      { col: 'category_id', sql: 'ALTER TABLE banners ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES banner_categories(id) ON DELETE SET NULL' },
      { col: 'sort_order', sql: 'ALTER TABLE banners ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0' },
      { col: 'created_by', sql: 'ALTER TABLE banners ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL' },
      { col: 'updated_by', sql: 'ALTER TABLE banners ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL' },
    ];

    for (const cmd of alterCommands) {
      try {
        await pool.query(cmd.sql);
        console.log(`  ✅ Added ${cmd.col}`);
      } catch (err) {
        if (err.code === '42701') { // duplicate column
          console.log(`  ⏭️  ${cmd.col} already exists`);
        } else {
          console.log(`  ❌ Error adding ${cmd.col}:`, err.message);
        }
      }
    }

    // 3. Insert default banner categories
    console.log('\n📦 Inserting default banner categories...');
    await pool.query(`
      INSERT INTO banner_categories (name, description, color, is_active) VALUES
        ('Promotional', 'Special offers and promotions', '#FF6B6B', true),
        ('Announcement', 'Important announcements', '#4ECDC4', true),
        ('Feature', 'New features and updates', '#45B7D1', true),
        ('Tips', 'Financial tips and advice', '#96CEB4', true),
        ('Event', 'Special events and campaigns', '#FFEAA7', true)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Default banner categories inserted!');

    // 4. Create trigger for banner_categories
    console.log('\n📦 Creating triggers...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_banner_categories_updated_at ON banner_categories;
    `);
    console.log('✅ Triggers created!');

    console.log('\n🎉 Banner migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateBanners();

