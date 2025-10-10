import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

// Debug: Log environment variables
logger.info('🔍 Environment Variables Debug:');
logger.info(`DATABASE_URL: ${process.env.DATABASE_URL ? '***SET***' : 'NOT SET'}`);
logger.info(`DB_USER: ${process.env.DB_USER}`);
logger.info(`DB_HOST: ${process.env.DB_HOST}`);
logger.info(`DB_NAME: ${process.env.DB_NAME}`);
logger.info(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
logger.info(`DB_PORT: ${process.env.DB_PORT}`);

// Database configuration - Use DATABASE_URL if available, otherwise use individual variables
const dbConfig: PoolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
} : {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
};

// Debug: Log the actual config being used
if (process.env.DATABASE_URL) {
  logger.info('🔍 Database Config: Using DATABASE_URL connection string');
} else {
  logger.info('🔍 Database Config (without password):', {
    user: dbConfig.user,
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port,
    passwordSet: !!dbConfig.password
  });
}

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info(`✅ Database connected successfully at ${result.rows[0].now}`);
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Connect to database
export const connectDatabase = async (): Promise<void> => {
  try {
    await testConnection();
    
    // Set up event listeners for the pool
    pool.on('connect', (client) => {
      logger.debug('🔄 New client connected to database');
    });

    pool.on('error', (err, client) => {
      logger.error('❌ Unexpected error on idle client:', err);
    });

    pool.on('remove', (client) => {
      logger.debug('🔄 Client removed from pool');
    });

  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    throw error;
  }
};

// Get database pool
export const getPool = (): Pool => pool;

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
    throw error;
  }
};

// Execute a query with error handling
export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    logger.error('❌ Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Execute a transaction
export const executeTransaction = async (queries: Array<{ query: string; params?: any[] }>): Promise<any[]> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results: any[] = [];
    
    for (const { query, params = [] } of queries) {
      const result = await client.query(query, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Health check for database
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const result = await executeQuery('SELECT 1 as health_check');
    return result.rows[0].health_check === 1;
  } catch (error) {
    logger.error('❌ Database health check failed:', error);
    return false;
  }
};

export default pool;
