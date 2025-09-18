const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mobile_app_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function createTestRemindersData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Looking for user: sameeratesting@gmail.com');
    
    // Get user ID
    const userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['sameeratesting@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found. Creating user first...');
      
      // Create user
      const createUserResult = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email
      `, [
        'sameeratesting@gmail.com',
        '$2b$10$dummy.hash.for.testing', // Dummy hash
        'Sameera',
        'Testing',
        '+919876543210',
        true
      ]);
      
      console.log('✅ User created:', createUserResult.rows[0]);
      var userId = createUserResult.rows[0].id;
    } else {
      console.log('✅ User found:', userResult.rows[0]);
      var userId = userResult.rows[0].id;
    }
    
    console.log(`\n🏦 Creating 4 loans for user ID: ${userId}`);
    
    // Calculate dates within next 10 days
    const today = new Date();
    const dates = [
      new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
      new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
      new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000), // 8 days
      new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days
    ];
    
    const loans = [
      {
        name: 'Home Loan - HDFC',
        loanType: 'home',
        amount: 5000000,
        interestRate: 8.5, // 8.5% (stored as decimal, not fraction)
        termMonths: 240, // 20 years
        startDate: new Date(today.getTime() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
        lender: 'HDFC Bank',
        bankName: 'HDFC Bank'
      },
      {
        name: 'Car Loan - SBI',
        loanType: 'car',
        amount: 800000,
        interestRate: 9.5, // 9.5%
        termMonths: 60, // 5 years
        startDate: new Date(today.getTime() - 3 * 30 * 24 * 60 * 60 * 1000), // 3 months ago
        lender: 'State Bank of India',
        bankName: 'SBI'
      },
      {
        name: 'Personal Loan - ICICI',
        loanType: 'personal',
        amount: 300000,
        interestRate: 12.5, // 12.5%
        termMonths: 36, // 3 years
        startDate: new Date(today.getTime() - 2 * 30 * 24 * 60 * 60 * 1000), // 2 months ago
        lender: 'ICICI Bank',
        bankName: 'ICICI Bank'
      },
      {
        name: 'Business Loan - Axis',
        loanType: 'business',
        amount: 2000000,
        interestRate: 11.0, // 11%
        termMonths: 84, // 7 years
        startDate: new Date(today.getTime() - 4 * 30 * 24 * 60 * 60 * 1000), // 4 months ago
        lender: 'Axis Bank',
        bankName: 'Axis Bank'
      }
    ];
    
    // Create loans
    for (let i = 0; i < loans.length; i++) {
      const loan = loans[i];
      const startDate = loan.startDate;
      
      // Calculate next EMI due date (within 10 days)
      let nextDueDate = new Date(startDate);
      while (nextDueDate <= today) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }
      
      // Adjust to our target date
      nextDueDate = dates[i];
      
      // Update start date to make the next due date correct
      const monthsDiff = (nextDueDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (nextDueDate.getMonth() - startDate.getMonth());
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setMonth(adjustedStartDate.getMonth() + monthsDiff - 1);
      
      // Calculate monthly payment using EMI formula
      const monthlyRate = loan.interestRate / 100 / 12;
      const monthlyPayment = loan.amount * (monthlyRate * Math.pow(1 + monthlyRate, loan.termMonths)) / 
                            (Math.pow(1 + monthlyRate, loan.termMonths) - 1);
      
      // Calculate end date
      const endDate = new Date(adjustedStartDate);
      endDate.setMonth(endDate.getMonth() + loan.termMonths);
      
      // Calculate remaining balance (start with full amount)
      const remainingBalance = loan.amount;
      
      const loanResult = await client.query(`
        INSERT INTO loans (
          user_id, name, amount, interest_rate, term_months, monthly_payment, 
          remaining_balance, start_date, end_date, status, loan_type, lender, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id, name
      `, [
        userId,
        loan.name,
        loan.amount,
        loan.interestRate,
        loan.termMonths,
        monthlyPayment,
        remainingBalance,
        adjustedStartDate,
        endDate,
        'active',
        loan.loanType,
        loan.lender
      ]);
      
      console.log(`✅ Created loan: ${loanResult.rows[0].name} (ID: ${loanResult.rows[0].id})`);
      console.log(`   Next EMI due: ${nextDueDate.toLocaleDateString('en-IN')}`);
    }
    
    console.log(`\n💳 Creating 4 credit cards for user ID: ${userId}`);
    
    const creditCards = [
      {
        name: 'HDFC Credit Card',
        cardNumber: '0000000000001234',
        cardType: 'Visa',
        issuer: 'HDFC Bank',
        creditLimit: 100000,
        balance: 25000,
        dueDate: dates[0], // 2 days
        minPayment: 2500,
        statementDay: 15,
        paymentDueDay: 2,
        color: '#007AFF',
        icon: 'card',
        bankName: 'HDFC Bank'
      },
      {
        name: 'SBI Credit Card',
        cardNumber: '0000000000005678',
        cardType: 'Mastercard',
        issuer: 'State Bank of India',
        creditLimit: 75000,
        balance: 18000,
        dueDate: dates[1], // 5 days
        minPayment: 1800,
        statementDay: 20,
        paymentDueDay: 5,
        color: '#FF6B35',
        icon: 'card',
        bankName: 'SBI'
      },
      {
        name: 'ICICI Credit Card',
        cardNumber: '0000000000009012',
        cardType: 'RuPay',
        issuer: 'ICICI Bank',
        creditLimit: 50000,
        balance: 12000,
        dueDate: dates[2], // 8 days
        minPayment: 1200,
        statementDay: 25,
        paymentDueDay: 8,
        color: '#10B981',
        icon: 'card',
        bankName: 'ICICI Bank'
      },
      {
        name: 'Axis Credit Card',
        cardNumber: '0000000000003456',
        cardType: 'Visa',
        issuer: 'Axis Bank',
        creditLimit: 80000,
        balance: 32000,
        dueDate: dates[3], // 10 days
        minPayment: 3200,
        statementDay: 10,
        paymentDueDay: 10,
        color: '#8B5CF6',
        icon: 'card',
        bankName: 'Axis Bank'
      }
    ];
    
    // Create credit cards
    for (let i = 0; i < creditCards.length; i++) {
      const card = creditCards[i];
      
      const cardResult = await client.query(`
        INSERT INTO credit_cards (
          user_id, name, card_number, card_type, issuer, 
          credit_limit, balance, due_date, min_payment, 
          statement_day, payment_due_day, color, icon, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING id, name
      `, [
        userId,
        card.name,
        card.cardNumber,
        card.cardType,
        card.issuer,
        card.creditLimit,
        card.balance,
        card.dueDate,
        card.minPayment,
        card.statementDay,
        card.paymentDueDay,
        card.color,
        card.icon,
        true
      ]);
      
      console.log(`✅ Created credit card: ${cardResult.rows[0].name} (ID: ${cardResult.rows[0].id})`);
      console.log(`   Due date: ${card.dueDate.toLocaleDateString('en-IN')}`);
    }
    
    console.log('\n🎉 Test data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - User: sameeratesting@gmail.com (ID: ${userId})`);
    console.log(`   - Loans: 4 created with EMIs due in 2, 5, 8, and 10 days`);
    console.log(`   - Credit Cards: 4 created with bills due in 2, 5, 8, and 10 days`);
    console.log(`\n📱 Now check the Reminders screen in the mobile app!`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestRemindersData();
