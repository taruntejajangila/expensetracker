const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'Tarun123@',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT version()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connection successful!');
    console.log('PostgreSQL version:', res.rows[0].version);
  }
});

// Simple test route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Expense Tracker API is running!',
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Test database route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    res.json({ 
      status: 'OK', 
      message: 'Database test successful',
      userCount: result.rows[0].user_count
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database test failed',
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.29.14:${PORT}`);
  console.log(`📊 Health check: http://192.168.29.14:${PORT}/api/health`);
  console.log(`🗄️  Database test: http://192.168.29.14:${PORT}/api/test-db`);
});
