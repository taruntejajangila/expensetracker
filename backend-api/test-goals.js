const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'expense_tracker_db',
  user: 'postgres',
  password: 'Tarun123@',
});

async function createTestGoals() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Connecting to database...');
    
    // First, get a user ID to associate goals with
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['taruntejajangila@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.error('❌ User not found. Please create a user first.');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Found user: ${userId}`);
    
    // Sample goals data
    const sampleGoals = [
      {
        name: 'Emergency Fund',
        description: 'Build a 6-month emergency fund for unexpected expenses',
        target_amount: 50000,
        current_amount: 32000,
        target_date: '2025-12-31',
        status: 'active',
        goal_type: 'emergency',
        icon: '🚨',
        color: '#FF6B6B'
      },
      {
        name: 'Vacation Fund',
        description: 'Save for a dream vacation to Europe',
        target_amount: 25000,
        current_amount: 18500,
        target_date: '2025-08-15',
        status: 'active',
        goal_type: 'vacation',
        icon: '✈️',
        color: '#4ECDC4'
      },
      {
        name: 'Home Down Payment',
        description: 'Save for a 20% down payment on a house',
        target_amount: 100000,
        current_amount: 45000,
        target_date: '2026-06-30',
        status: 'active',
        goal_type: 'home',
        icon: '🏠',
        color: '#45B7D1'
      },
      {
        name: 'New Car Fund',
        description: 'Save for a reliable used car',
        target_amount: 35000,
        current_amount: 12000,
        target_date: '2025-10-31',
        status: 'active',
        goal_type: 'vehicle',
        icon: '🚗',
        color: '#96CEB4'
      },
      {
        name: 'Education Fund',
        description: 'Save for advanced courses and certifications',
        target_amount: 15000,
        current_amount: 8000,
        target_date: '2025-12-31',
        status: 'active',
        goal_type: 'education',
        icon: '🎓',
        color: '#FFEAA7'
      }
    ];
    
    console.log('📝 Creating sample goals...');
    
    for (const goal of sampleGoals) {
      try {
        const result = await client.query(
          `INSERT INTO goals (
            user_id, name, description, target_amount, current_amount, 
            target_date, status, goal_type, icon, color, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING id, name, target_amount, current_amount`,
          [
            userId,
            goal.name,
            goal.description,
            goal.target_amount,
            goal.current_amount,
            goal.target_date,
            goal.status,
            goal.goal_type,
            goal.icon,
            goal.color
          ]
        );
        
        const createdGoal = result.rows[0];
        console.log(`✅ Created goal: ${createdGoal.name} (ID: ${createdGoal.id})`);
        console.log(`   Target: $${createdGoal.target_amount}, Current: $${createdGoal.current_amount}`);
        
      } catch (error) {
        console.error(`❌ Failed to create goal "${goal.name}":`, error.message);
      }
    }
    
    // Verify the goals were created
    console.log('\n🔍 Verifying created goals...');
    const verifyResult = await client.query(
      'SELECT name, target_amount, current_amount, status, goal_type FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    console.log(`\n📊 Total goals created: ${verifyResult.rows.length}`);
    verifyResult.rows.forEach((goal, index) => {
      const progress = ((goal.current_amount / goal.target_amount) * 100).toFixed(1);
      console.log(`${index + 1}. ${goal.name}`);
      console.log(`   Type: ${goal.goal_type}, Status: ${goal.status}`);
      console.log(`   Progress: $${goal.current_amount} / $${goal.target_amount} (${progress}%)`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test goals:', error);
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createTestGoals().catch(console.error);
