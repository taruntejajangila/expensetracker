const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './.env' });

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Middleware
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'UP', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'DOWN', 
      database: 'disconnected', 
      error: error.message 
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Expense Tracker API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      transactions: '/api/transactions/*',
      accounts: '/api/bank-accounts/*',
      goals: '/api/goals/*',
      budgets: '/api/budgets/*',
      loans: '/api/loans/*',
      categories: '/api/categories/*',
      admin: '/api/admin/*'
    }
  });
});

// Basic auth routes (simplified)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Simple check for test user
    if (email === 'testuser@gmail.com' && password === 'password123') {
      const token = 'test-token-' + Date.now();
      res.json({
        success: true,
        data: {
          accessToken: token,
          user: {
            id: 'test-user-id',
            email: email,
            name: 'Test User'
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  res.json({
    success: true,
    data: {
      id: 'test-user-id',
      email: 'testuser@gmail.com',
      name: 'Test User'
    }
  });
});

// Basic goals endpoint
app.get('/api/goals', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title as name, description, target_amount, current_amount, 
             target_date, status, goal_type, icon, color, created_at, updated_at
      FROM goals 
      WHERE user_id = 'test-user-id'
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goals'
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on port ${port}`);
  console.log(`📱 Mobile App URL: http://localhost:19006`);
  console.log(`🖥️ Admin Panel URL: http://localhost:3001`);
  console.log(`🌍 Environment: development`);
  console.log(`🌐 API Base URL: http://0.0.0.0:${port}/api`);
  console.log(`🏥 Health Check: http://0.0.0.0:${port}/health`);
  console.log(`🌐 Network Access: http://192.168.29.14:${port}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  pool.end(() => {
    console.log('✅ Database connections closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  pool.end(() => {
    console.log('✅ Database connections closed');
    process.exit(0);
  });
});
