const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Sample credit card data
const sampleCreditCards = [
  {
    name: 'Chase Sapphire Preferred',
    card_number: '4532123456789012',
    card_type: 'Credit Card',
    issuer: 'Chase Bank',
    credit_limit: 15000,
    balance: 3200,
    due_date: '2025-09-15',
    min_payment: 160,
    color: '#1E40AF',
    icon: 'card'
  },
  {
    name: 'American Express Gold',
    card_number: '378212345678901',
    card_type: 'Credit Card',
    issuer: 'American Express',
    credit_limit: 25000,
    balance: 8500,
    due_date: '2025-09-20',
    min_payment: 425,
    color: '#F59E0B',
    icon: 'card'
  },
  {
    name: 'Citi Double Cash',
    card_number: '5425123456789012',
    card_type: 'Credit Card',
    issuer: 'Citibank',
    credit_limit: 12000,
    balance: 1800,
    due_date: '2025-09-10',
    min_payment: 90,
    color: '#10B981',
    icon: 'card'
  },
  {
    name: 'Discover It',
    card_number: '6011123456789012',
    card_type: 'Credit Card',
    issuer: 'Discover Bank',
    credit_limit: 8000,
    balance: 1200,
    due_date: '2025-09-25',
    min_payment: 60,
    color: '#EF4444',
    icon: 'card'
  },
  {
    name: 'Capital One Venture',
    card_number: '4111111111111111',
    card_type: 'Credit Card',
    issuer: 'Capital One',
    credit_limit: 20000,
    balance: 6500,
    due_date: '2025-09-18',
    min_payment: 325,
    color: '#8B5CF6',
    icon: 'card'
  }
];

async function addSampleCreditCards() {
  try {
    console.log('🔍 Connecting to database...');
    await pool.connect();
    console.log('✅ Database connected successfully');

    // Get the user ID for taruntejajangila@gmail.com
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['taruntejajangila@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found. Please make sure the user exists in the database.');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`👤 Found user ID: ${userId}`);

    // Check if credit cards already exist for this user
    const existingCards = await pool.query(
      'SELECT COUNT(*) FROM credit_cards WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (parseInt(existingCards.rows[0].count) > 0) {
      console.log('⚠️  Credit cards already exist for this user. Skipping...');
      return;
    }

    // Insert sample credit cards
    console.log('🚀 Adding sample credit cards...');
    
    for (const card of sampleCreditCards) {
      const result = await pool.query(`
        INSERT INTO credit_cards (
          user_id, name, card_number, card_type, issuer, 
          credit_limit, balance, due_date, min_payment, 
          color, icon, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, name
      `, [
        userId,
        card.name,
        card.card_number,
        card.card_type,
        card.issuer,
        card.credit_limit,
        card.balance,
        card.due_date,
        card.min_payment,
        card.color,
        card.icon,
        true
      ]);

      console.log(`✅ Added: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    }

    // Verify the data was added
    const verifyResult = await pool.query(
      'SELECT id, name, credit_limit, balance, due_date FROM credit_cards WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    console.log('\n📊 Credit Cards Summary:');
    console.log('========================');
    verifyResult.rows.forEach(card => {
      console.log(`• ${card.name}: $${card.credit_limit} limit, $${card.balance} balance, due: ${card.due_date}`);
    });

    console.log(`\n🎉 Successfully added ${verifyResult.rows.length} credit cards for user!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
addSampleCreditCards();
