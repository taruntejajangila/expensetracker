const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupBannersMinimal() {
  console.log('🚀 Setting up minimal Banner Management System...');
  try {
    // Create banner_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banner_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6C5CE7',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create banners table without foreign key constraints
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        image_url VARCHAR(2048),
        target_url VARCHAR(2048),
        background_color VARCHAR(7) DEFAULT '#6C5CE7',
        text_color VARCHAR(7) DEFAULT '#FFFFFF',
        icon VARCHAR(100),
        category_id INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create banner_analytics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banner_analytics (
        id SERIAL PRIMARY KEY,
        banner_id INTEGER NOT NULL,
        user_id INTEGER,
        action_type VARCHAR(50) NOT NULL,
        device_info JSONB,
        location_info JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create active_banners view
    await pool.query(`
      CREATE OR REPLACE VIEW active_banners AS
      SELECT
        id,
        title,
        subtitle,
        description,
        image_url,
        target_url,
        background_color,
        text_color,
        icon,
        category_id,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM banners
      WHERE is_active = TRUE
        AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
        AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
    `);

    // Create banner_analytics_summary view
    await pool.query(`
      CREATE OR REPLACE VIEW banner_analytics_summary AS
      SELECT
        banner_id,
        COUNT(CASE WHEN action_type = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN action_type = 'click' THEN 1 END) as total_clicks,
        (CAST(COUNT(CASE WHEN action_type = 'click' THEN 1 END) AS DECIMAL) / NULLIF(COUNT(CASE WHEN action_type = 'view' THEN 1 END), 0)) * 100 as click_through_rate
      FROM banner_analytics
      GROUP BY banner_id
    `);

    // Add sample data
    await pool.query(`
      INSERT INTO banner_categories (name, description, color) VALUES
      ('Promotional', 'Banners for special offers and promotions', '#FF6347'),
      ('Announcements', 'Important app announcements', '#4682B4'),
      ('Features', 'Highlighting new app features', '#32CD32')
    `);

    await pool.query(`
      INSERT INTO banners (title, subtitle, description, image_url, target_url, background_color, text_color, icon, category_id, is_active, sort_order, start_date, end_date) VALUES
      ('Summer Savings!', 'Get 10% off all premium features', 'Limited time offer for summer!', 'https://example.com/summer-sale.jpg', 'https://example.com/summer-promo', '#FF6347', '#FFFFFF', 'cash-outline', 1, TRUE, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'),
      ('New Feature: Budgeting', 'Plan your finances with ease', 'Our new budgeting tool helps you stay on track.', 'https://example.com/budget-feature.jpg', 'https://example.com/new-budget', '#4682B4', '#FFFFFF', 'wallet-outline', 3, TRUE, 20, CURRENT_TIMESTAMP, NULL),
      ('App Update Available', 'Exciting improvements and bug fixes', 'Update now for the best experience!', 'https://example.com/app-update.jpg', 'https://example.com/update-notes', '#32CD32', '#FFFFFF', 'cloud-download-outline', 2, TRUE, 30, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '7 days')
    `);

    console.log('✅ Minimal Banner Management System setup complete!');
  } catch (error) {
    console.error('❌ Error setting up Banner Management System:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupBannersMinimal()
  .then(() => console.log('💥 Setup finished successfully.'))
  .catch((err) => console.error('💥 Setup failed:', err));
