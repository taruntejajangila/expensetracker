const { Pool } = require('pg');

async function fixConstraint() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'railway',
  });

  try {
    console.log('\n🔧 FIXING RAILWAY LOAN_TYPE CONSTRAINT...\n');

    // Check current constraint
    console.log('1️⃣  Checking current constraint...');
    const checkConstraint = await pool.query(`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'loans'::regclass 
        AND conname = 'loans_loan_type_check';
    `);
    
    if (checkConstraint.rows.length > 0) {
      console.log('   Current:', checkConstraint.rows[0].definition);
    } else {
      console.log('   ⚠️  No constraint found!');
    }

    // Drop old constraint
    console.log('\n2️⃣  Dropping old constraint...');
    await pool.query(`
      ALTER TABLE loans 
      DROP CONSTRAINT IF EXISTS loans_loan_type_check;
    `);
    console.log('   ✅ Old constraint dropped');

    // Add new constraint
    console.log('\n3️⃣  Adding new constraint...');
    await pool.query(`
      ALTER TABLE loans 
      ADD CONSTRAINT loans_loan_type_check 
      CHECK (loan_type IN ('personal', 'home', 'car', 'business', 'student', 'other'));
    `);
    console.log('   ✅ New constraint added');

    // Verify
    console.log('\n4️⃣  Verifying new constraint...');
    const verifyConstraint = await pool.query(`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'loans'::regclass 
        AND conname = 'loans_loan_type_check';
    `);
    
    if (verifyConstraint.rows.length > 0) {
      console.log('   New:', verifyConstraint.rows[0].definition);
    }

    // Test with 'other'
    console.log('\n5️⃣  Testing with loan_type="other"...');
    try {
      await pool.query('BEGIN');
      await pool.query(`
        INSERT INTO loans (
          user_id, loan_name, loan_type, principal_amount, 
          outstanding_balance, monthly_payment, loan_term_months,
          start_date, end_date, lender
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          'TEST LOAN',
          'other',
          10000,
          10000,
          500,
          24,
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '24 months',
          'TEST'
        )
      `);
      await pool.query('ROLLBACK');
      console.log('   ✅ SUCCESS! Can now insert loan_type="other"');
    } catch (error) {
      await pool.query('ROLLBACK');
      console.log('   ❌ FAILED:', error.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ RAILWAY DATABASE FIXED!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('You can now create loans with types: personal, home, car, business, student, other\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixConstraint();

