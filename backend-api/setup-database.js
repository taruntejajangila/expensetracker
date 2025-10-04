const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up Expense Tracker Database...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP WITH TIME ZONE,
        last_active_at TIMESTAMP WITH TIME ZONE,
        last_transaction_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        icon VARCHAR(50),
        color VARCHAR(7) DEFAULT '#6C5CE7',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Categories table created');

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        amount DECIMAL(12,2) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        description TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Transactions table created');

    // Create bank_accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_name VARCHAR(100) NOT NULL,
        account_number VARCHAR(50),
        bank_name VARCHAR(100),
        account_type VARCHAR(20) DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'credit', 'investment')),
        balance DECIMAL(12,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Bank accounts table created');

    // Create budgets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        amount DECIMAL(12,2) NOT NULL,
        name VARCHAR(100),
        spent DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'on-track' CHECK (status IN ('on-track', 'over-budget', 'under-budget')),
        period VARCHAR(20) DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Budgets table created');

    // Create goals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_amount DECIMAL(12,2) NOT NULL,
        current_amount DECIMAL(12,2) DEFAULT 0,
        target_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Goals table created');

    // Insert default categories
    const categories = [
      { name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#FF6B6B' },
      { name: 'Transportation', type: 'expense', icon: '🚗', color: '#4ECDC4' },
      { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#45B7D1' },
      { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#96CEB4' },
      { name: 'Bills & Utilities', type: 'expense', icon: '💡', color: '#FFEAA7' },
      { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#DDA0DD' },
      { name: 'Education', type: 'expense', icon: '📚', color: '#98D8C8' },
      { name: 'Travel', type: 'expense', icon: '✈️', color: '#F7DC6F' },
      { name: 'Salary', type: 'income', icon: '💰', color: '#2ECC71' },
      { name: 'Freelance', type: 'income', icon: '💼', color: '#3498DB' },
      { name: 'Investment', type: 'income', icon: '📈', color: '#9B59B6' },
      { name: 'Other Income', type: 'income', icon: '💵', color: '#1ABC9C' }
    ];

    for (const category of categories) {
      await client.query(`
        INSERT INTO categories (name, type, icon, color, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [category.name, category.type, category.icon, category.color, categories.indexOf(category)]);
    }
    console.log('✅ Default categories inserted');

    // Create admin user
    const adminEmail = 'admin@expensetracker.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const existingAdmin = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    
    if (existingAdmin.rows.length === 0) {
      await client.query(`
        INSERT INTO users (name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, ['Admin User', adminEmail, hashedPassword, 'admin', true]);
      console.log('✅ Admin user created');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)');
    console.log('✅ Database indexes created');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('📊 Created tables: users, categories, transactions, bank_accounts, budgets, goals');
    console.log('👤 Admin credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase().catch(console.error);
