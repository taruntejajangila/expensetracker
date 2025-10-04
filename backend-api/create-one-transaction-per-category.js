const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function insertOneTransactionPerCategory(email) {
  const client = await pool.connect();
  try {
    console.log(`🌱 Seeding one transaction per category for user: ${email}`);

    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.error('❌ User not found:', email);
      return;
    }
    const userId = userRes.rows[0].id;
    console.log('👤 User ID:', userId);

    // Fetch active categories; try to include type if available
    const categoryRes = await client.query(`
      SELECT id, name,
             CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'categories' AND column_name = 'type'
             ) THEN type ELSE NULL END AS type
      FROM categories
      WHERE (CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'categories' AND column_name = 'is_active'
             ) THEN is_active ELSE true END) = true
      ORDER BY id
    `);

    const categories = categoryRes.rows;
    console.log(`📂 Found ${categories.length} active categories`);

    const today = new Date();
    let createdCount = 0;

    for (const cat of categories) {
      // Skip if a transaction already exists for this user/category
      const existsRes = await client.query(
        'SELECT 1 FROM transactions WHERE user_id = $1 AND category_id = $2 LIMIT 1',
        [userId, cat.id]
      );
      if (existsRes.rows.length > 0) {
        console.log(`↪️  Skipping ${cat.name}: transaction already exists`);
        continue;
      }

      // Determine type: prefer category.type when available; fallback by name heuristic
      const isIncomeName = /salary|freelance|bonus|interest|income/i.test(cat.name || '');
      const txType = (cat.type === 'income' || (cat.type == null && isIncomeName)) ? 'income' : 'expense';

      // Amount ranges
      const amount = txType === 'income'
        ? Number((Math.random() * (50000 - 5000) + 5000).toFixed(2))
        : Number((Math.random() * (5000 - 100) + 100).toFixed(2));

      // Create a recent date within the last 10 days
      const dayOffset = Math.floor(Math.random() * 10);
      const txDate = new Date(today);
      txDate.setDate(today.getDate() - dayOffset);
      const isoDate = txDate.toISOString().slice(0, 10);

      const description = `Auto seed for ${cat.name}`;

      // Insert minimal, widely-compatible columns
      const insertSql = `
        INSERT INTO transactions (user_id, category_id, amount, type, description, date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      const insertParams = [userId, cat.id, amount, txType, description, isoDate];

      await client.query(insertSql, insertParams);
      console.log(`✅ Created ${txType} ₹${amount} for category: ${cat.name}`);
      createdCount++;
    }

    console.log(`\n🎉 Done. Created ${createdCount} transactions.`);
  } catch (err) {
    console.error('❌ Error seeding transactions:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

const email = process.argv[2] || 'tarun@gmail.com';
insertOneTransactionPerCategory(email);
