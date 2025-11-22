// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { extractTokenFromHeader, verifyAccessToken } from './utils/authUtils';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import creditCardRoutes from './routes/creditCards';
import bankAccountRoutes from './routes/bankAccounts';
import budgetRoutes from './routes/budgets';
import goalRoutes from './routes/goals';
import loanRoutes from './routes/loans';
import adminRoutes from './routes/admin';
import analyticsRoutes from './routes/analytics';
import notificationRoutes from './routes/notifications';
import bannerRoutes from './routes/banners';
import reminderRoutes from './routes/reminders';
import supportTicketsRoutes from './routes/supportTickets';
import adminSupportTicketsRoutes from './routes/adminSupportTickets';
import migrateRoutes from './routes/migrate';
import appSettingsRoutes from './routes/appSettings';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';

// Import database connection
import { connectDatabase, getPool } from './config/database';
// Import security utilities
import { cleanupExpiredBlacklist } from './utils/tokenBlacklist';

// Debug: Log environment variables loading
logger.info('🔍 Server Environment Variables Debug:');
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`PORT: ${process.env.PORT}`);
logger.info(`DB_USER: ${process.env.DB_USER}`);
logger.info(`DB_HOST: ${process.env.DB_HOST}`);
logger.info(`DB_NAME: ${process.env.DB_NAME}`);
logger.info(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
logger.info(`DB_PORT: ${process.env.DB_PORT}`);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - Required for Railway deployment
app.set('trust proxy', 1);

// HTTPS enforcement in production - SECURITY: Force HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is already HTTPS or forwarded as HTTPS
    const isSecure = req.secure || 
                     req.headers['x-forwarded-proto'] === 'https' ||
                     req.headers['x-forwarded-ssl'] === 'on';
    
    if (!isSecure && req.method !== 'GET') {
      // For non-GET requests, redirect to HTTPS
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      return res.redirect(301, httpsUrl);
    }
    next();
  });
}

// Serve static files (for uploaded images) - BEFORE security middleware
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security middleware - Enhanced with HSTS and additional headers
const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", serverUrl, "http://localhost:5000", "http://127.0.0.1:5000", "*"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", serverUrl, "http://localhost:5000", "http://127.0.0.1:5000"],
    },
  },
  hsts: isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false, // Disable HSTS in development
  frameguard: { action: 'deny' }, // Prevent clickjacking
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS configuration - SECURITY: Restrict origins in production
const allowedOrigins: string[] | boolean = isProduction
  ? [
      process.env.FRONTEND_URL,
      process.env.ADMIN_PANEL_URL,
      process.env.MOBILE_APP_URL
    ].filter((url): url is string => Boolean(url)) // Remove undefined values and type guard
  : true; // Allow all origins in development

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

if (isProduction && allowedOrigins === true) {
  logger.warn('⚠️  SECURITY WARNING: CORS is allowing all origins in production! Set FRONTEND_URL, ADMIN_PANEL_URL, or MOBILE_APP_URL environment variables.');
}

// Rate limiting - SECURITY: Per-user rate limiting for authenticated requests, per-IP for unauthenticated
// This ensures each user gets their own rate limit, not shared by IP address
// Increased to 500 per user to accommodate mobile app usage patterns (multiple API calls per screen load)
const defaultRateLimit = isProduction ? 500 : 2000; // Per-user limit for authenticated requests

app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || String(defaultRateLimit)),
  // Smart key generator: Use user ID for authenticated requests, IP for unauthenticated
  keyGenerator: (req) => {
    // Try to extract user ID from JWT token for authenticated requests
    try {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);
      
      if (token) {
        // Verify and decode token to get user ID
        const decoded = verifyAccessToken(token);
        if (decoded && decoded.userId) {
          // Rate limit per user ID for authenticated requests
          return `user:${decoded.userId}`;
        }
      }
    } catch (error) {
      // If token extraction/verification fails, fall back to IP-based limiting
      logger.debug('Rate limit: Could not extract user ID from token, using IP:', error);
    }
    
    // Fall back to IP-based rate limiting for unauthenticated requests
    // Get real client IP from X-Forwarded-For header (when behind proxy)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one (original client)
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
      return `ip:${ips || req.ip || 'unknown'}`;
    }
    return `ip:${req.ip || 'unknown'}`;
  },
  message: {
    success: false,
    message: 'Too many requests. Please wait a few minutes and try again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks and localhost in development
  skip: (req): boolean => {
    // Always skip health check endpoints
    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }
    
    if (isProduction) {
      return false; // Never skip in production (except health checks)
    }
    
    // Skip for localhost in development
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || (req.ip && req.ip.startsWith('192.168.')) || false;
    const isDevelopment = (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) || false;
    return Boolean(isLocalhost && isDevelopment);
  }
}));

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware - reduce verbosity in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'short' : 'combined', {
  skip: (req, res) => {
    // Skip logging for notification polling requests and health checks in production
    if (process.env.NODE_ENV === 'production') {
      return req.url === '/api/notifications/poll' || req.url === '/health';
    }
    // In development, only skip notification polling
    return req.url === '/api/notifications/poll';
  },
  stream: {
    write: (message: string) => {
      // In production, only log warnings/errors, not info
      if (process.env.NODE_ENV === 'production') {
        // Don't log HTTP requests in production to reduce log volume
        return;
      }
      logger.info(message.trim());
    }
  }
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      admin: '/api/admin',
      auth: '/api/auth',
      users: '/api/users',
      transactions: '/api/transactions',
      categories: '/api/categories'
    }
  });
});

// Health check endpoint - Must respond quickly for Railway healthcheck
app.get('/health', async (req, res) => {
  try {
    // Check database connection (non-blocking, with timeout)
    let dbStatus = 'unknown';
    let dbError = null;
    try {
      const pool = getPool();
      const result = await Promise.race([
        pool.query('SELECT 1 as health_check'),
        new Promise<any>((resolve) => setTimeout(() => resolve(null), 2000)) // 2 second timeout
      ]);
      dbStatus = result && result.rows && result.rows[0]?.health_check === 1 ? 'connected' : 'disconnected';
    } catch (error: any) {
      dbStatus = 'disconnected';
      dbError = error.message || 'Unknown error';
    }

    // Always return 200 OK - server is running
    // Database status is informational
    res.status(200).json({
      success: true,
      status: 'healthy',
      message: 'Expense Tracker API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: dbStatus,
        error: dbError
      }
    });
  } catch (error) {
    // Even on error, return 200 to indicate server is running
    res.status(200).json({
    success: true,
      status: 'healthy',
    message: 'Expense Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: 'unknown',
        error: 'Health check error'
      }
  });
  }
});

// Serve static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
if (process.env.NODE_ENV !== 'production') {
  logger.info('✅ Auth routes registered at /api/auth');
  // Log all registered routes for debugging (only in development)
  logger.info('🔍 Registered auth routes: GET /test, GET /me-test, GET /me, POST /refresh, POST /logout, POST /request-otp, POST /check-phone, POST /verify-otp, POST /complete-signup');
}
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/support-tickets', supportTicketsRoutes);
app.use('/api/admin/support-tickets', adminSupportTicketsRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/app-settings', appSettingsRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Tracker API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      transactions: '/api/transactions',
      categories: '/api/categories',
      creditCards: '/api/credit-cards',
      bankAccounts: '/api/bank-accounts',
      budgets: '/api/budgets',
      goals: '/api/goals',
      loans: '/api/loans',
      admin: '/api/admin',
      analytics: '/api/analytics',
      notifications: '/api/notifications'
    },
    documentation: 'API documentation coming soon...'
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server function
const startServer = async () => {
  try {
    // Start server FIRST (don't wait for database)
    // This allows healthcheck to work even if database connection is slow
    app.listen(Number(PORT), '0.0.0.0', () => {
      logger.warn(`🚀 Server running on port ${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`📱 Mobile App URL: ${process.env.MOBILE_APP_URL || 'http://localhost:19006'}`);
        logger.info(`🖥️ Admin Panel URL: ${process.env.ADMIN_PANEL_URL || 'http://localhost:3001'}`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🌐 API Base URL: http://0.0.0.0:${PORT}/api`);
        logger.info(`🏥 Health Check: http://0.0.0.0:${PORT}/health`);
        if (process.env.SERVER_URL) {
          logger.info(`🌐 Network Access: ${process.env.SERVER_URL}/api`);
        }
      }
    });

    // Connect to database in background (non-blocking)
    // This allows server to start even if database connection takes time
    connectDatabase()
      .then(() => {
        logger.warn('✅ Database connected successfully');
        // Set up database pool in app.locals for routes to use
        app.locals.db = getPool();
        if (process.env.NODE_ENV !== 'production') {
          logger.info('✅ Database pool set in app.locals');
        }
        
        // SECURITY: Start periodic cleanup of expired blacklist entries (every 6 hours)
        setInterval(async () => {
          try {
            const deleted = await cleanupExpiredBlacklist();
            if (deleted > 0) {
              logger.info(`🧹 Cleaned up ${deleted} expired blacklist entries`);
            }
          } catch (error) {
            logger.error('Error during blacklist cleanup:', error);
          }
        }, 6 * 60 * 60 * 1000); // 6 hours
        
        // Run cleanup immediately on startup
        cleanupExpiredBlacklist().catch(err => 
          logger.error('Error during initial blacklist cleanup:', err)
        );
      })
      .catch((error) => {
        logger.error('❌ Database connection failed (server will continue running):', error);
        logger.warn('⚠️  Server is running but database is not connected. Some features may not work.');
        // Don't exit - allow server to run even without database for healthcheck
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
