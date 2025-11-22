import { PoolClient } from 'pg';

export const description = 'Create app_settings table for contact information and app-wide settings';

export async function up(client: PoolClient): Promise<void> {
  console.log('🔄 Creating app_settings table...');
  
  try {
    // Create app_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'text',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create index on setting_key for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key)
    `);

    // Insert default contact information if not exists
    await client.query(`
      INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
        ('contact_email', 'support@mypaisa.com', 'text', 'Support email address'),
        ('contact_phone', '+91 98765 43210', 'text', 'Support phone number'),
        ('contact_hours', 'Mon-Fri 9AM-6PM', 'text', 'Support hours'),
        ('legal_email', 'legal@mypaisa.com', 'text', 'Legal inquiries email'),
        ('privacy_email', 'privacy@mypaisa.com', 'text', 'Privacy inquiries email')
      ON CONFLICT (setting_key) DO NOTHING
    `);

    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_app_settings_updated_at ON app_settings;
      CREATE TRIGGER trigger_app_settings_updated_at 
      BEFORE UPDATE ON app_settings 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('✅ app_settings table created successfully');
  } catch (error) {
    console.error('❌ Error creating app_settings table:', error);
    throw error;
  }
}

export async function down(client: PoolClient): Promise<void> {
  console.log('🔄 Dropping app_settings table...');
  
  try {
    await client.query('DROP TABLE IF EXISTS app_settings CASCADE');
    console.log('✅ app_settings table dropped');
  } catch (error) {
    console.error('❌ Error dropping app_settings table:', error);
    throw error;
  }
}

