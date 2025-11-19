import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  logger.info('🔍 Environment Variables Debug:');
  logger.info(`DATABASE_URL: ${process.env.DATABASE_URL ? '***SET***' : 'NOT SET'}`);
  logger.info(`DB_USER: ${process.env.DB_USER}`);
  logger.info(`DB_HOST: ${process.env.DB_HOST}`);
  logger.info(`DB_NAME: ${process.env.DB_NAME}`);
  logger.info(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
  logger.info(`DB_PORT: ${process.env.DB_PORT}`);
}

// Database configuration - Use DATABASE_URL if available, otherwise use individual variables
// Increased timeouts for Railway/cloud databases which may be slower
const dbConfig: PoolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Reduced pool size to avoid too many simultaneous connections
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
  connectionTimeoutMillis: 60000, // Increased to 60 seconds for Railway/cloud databases
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000, // Start keepalive after 10 seconds
} : {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Reduced pool size
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
  connectionTimeoutMillis: 60000, // Increased to 60 seconds
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Debug: Log the actual config being used (only in development)
if (process.env.NODE_ENV !== 'production') {
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
}

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection and initialize schema
const testConnection = async (): Promise<void> => {
  let client: any = null;
  try {
    // Add wrapper timeout to prevent hanging indefinitely
    const connectionPromise = pool.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 65 seconds')), 65000)
    );
    
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Attempting to get client from pool...');
      }
      client = await Promise.race([connectionPromise, timeoutPromise]) as any;
      
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Client obtained, executing test query...');
      }
      const result = await client.query('SELECT NOW()');
      logger.warn(`✅ Database connected successfully at ${result.rows[0].now}`);
      
      // Initialize database schema
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Initializing database schema...');
      }
      await initializeDatabaseSchema(client);
      
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Schema initialized, releasing client...');
      }
    client.release();
    client = null;
  } catch (error) {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        logger.error('Error releasing client:', releaseError);
      }
    }
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Initialize database schema
const initializeDatabaseSchema = async (client: any): Promise<void> => {
  try {
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      logger.warn('🔧 Initializing database schema...');
      
      // Execute schema creation directly
      await createDatabaseSchema(client);
      logger.warn('✅ Database schema initialized successfully');
    } else if (process.env.NODE_ENV !== 'production') {
      logger.info('✅ Database schema already exists');
    }

    // ALWAYS run migrations (for both new and existing databases)
    try {
      if (process.env.NODE_ENV !== 'production') {
        logger.info('🔄 Checking for pending migrations...');
      }
      const { MigrationRunner } = await import('../migrations/migrationRunner');
      const migrationRunner = new MigrationRunner(client);
      await migrationRunner.runMigrations();
    } catch (migrationError: any) {
      logger.error('❌ Migration error (non-fatal):', migrationError.message);
      logger.warn('⚠️  Continuing without migrations - please check and fix');
      // Don't throw - allow app to start even if migrations fail
    }

    // SECURITY: Ensure token_blacklist table exists (runs on every startup)
    try {
      const blacklistCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'token_blacklist'
        );
      `);
      
      if (!blacklistCheck.rows[0].exists) {
        logger.warn('➕ Creating token_blacklist table...');
        await client.query(`
          CREATE TABLE token_blacklist (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            reason VARCHAR(20) DEFAULT 'logout' CHECK (reason IN ('logout', 'revoked', 'security')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
          CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
        `);
        logger.warn('✅ token_blacklist table created successfully');
      }
    } catch (blacklistError: any) {
      logger.error('❌ Error ensuring token_blacklist table (non-fatal):', blacklistError.message);
      // Don't throw - allow app to start
    }

    // SECURITY: Ensure audit_logs table exists (runs on every startup)
    try {
      const auditCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'audit_logs'
        );
      `);
      
      if (!auditCheck.rows[0].exists) {
        logger.warn('➕ Creating audit_logs table...');
        await client.query(`
          CREATE TABLE audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            resource VARCHAR(100) NOT NULL,
            resource_id VARCHAR(255),
            ip_address VARCHAR(45),
            user_agent TEXT,
            details JSONB,
            status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'error')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
          CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
          CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
        `);
        logger.warn('✅ audit_logs table created successfully');
      }
    } catch (auditError: any) {
      logger.error('❌ Error ensuring audit_logs table (non-fatal):', auditError.message);
      // Don't throw - allow app to start
    }

    // SECURITY: Ensure otp_verifications table exists (runs on every startup)
    try {
      const otpCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'otp_verifications'
        );
      `);
      
      if (!otpCheck.rows[0].exists) {
        logger.warn('➕ Creating otp_verifications table...');
        await client.query(`
          CREATE TABLE otp_verifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            phone VARCHAR(20) NOT NULL,
            otp VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_otp_phone_otp ON otp_verifications(phone, otp);
          CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
          CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_verifications(phone, created_at);
        `);
        logger.warn('✅ otp_verifications table created successfully');
      }
    } catch (otpError: any) {
      logger.error('❌ Error ensuring otp_verifications table (non-fatal):', otpError.message);
      // Don't throw - allow app to start
    }

    // Ensure Balance Transfer category exists (runs on every startup)
    try {
      const existing = await client.query(
        "SELECT id FROM categories WHERE name = 'Balance Transfer' AND type = 'transfer'"
      );

      if (existing.rows.length === 0) {
        logger.warn('➕ Adding Balance Transfer category...');
        await client.query(`
          INSERT INTO categories (id, user_id, name, icon, color, type, is_default, is_active, sort_order, created_at, updated_at) 
          VALUES (gen_random_uuid(), NULL, 'Balance Transfer', 'swap-horizontal', '#9C88FF', 'transfer', true, true, 999, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `);
        logger.warn('✅ Balance Transfer category added successfully');
      }
    } catch (categoryError: any) {
      logger.error('❌ Error ensuring Balance Transfer category (non-fatal):', categoryError.message);
      // Don't throw - allow app to start
    }
    
  } catch (error) {
    logger.error('❌ Error initializing database schema:', error);
    throw error;
  }
};

// Create database schema
const createDatabaseSchema = async (client: any): Promise<void> => {
  // Enable UUID extension
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create ticket number generation function
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_ticket_number()
      RETURNS VARCHAR AS $$
      DECLARE
        ticket_num VARCHAR(20);
        counter INTEGER;
      BEGIN
        -- Get the next counter value
        SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1
        INTO counter
        FROM support_tickets
        WHERE ticket_number LIKE 'TK%';
        
        -- Format as TK + 6-digit number with leading zeros
        ticket_num := 'TK' || LPAD(counter::TEXT, 6, '0');
        
        RETURN ticket_num;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ generate_ticket_number function created');
  } catch (error) {
    console.log('⚠️ Function might already exist:', (error as Error).message);
  }

  // Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255), -- Nullable for passwordless OTP authentication
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      avatar_url TEXT,
      date_of_birth DATE,
      currency VARCHAR(3) DEFAULT 'USD',
      language VARCHAR(5) DEFAULT 'en',
      timezone VARCHAR(50) DEFAULT 'UTC',
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      verification_token VARCHAR(255),
      reset_password_token VARCHAR(255),
      reset_password_expires TIMESTAMP,
      last_login TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Admin users table (referenced by banners.created_by/updated_by)
  await client.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin','super_admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Categories table
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(50) DEFAULT 'folder',
      color VARCHAR(7) DEFAULT '#10B981',
      type VARCHAR(20) DEFAULT 'expense' CHECK (type IN ('income', 'expense', 'transfer')),
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 999,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, name)
    )
  `);

  // Credit cards table
  await client.query(`
    CREATE TABLE IF NOT EXISTS credit_cards (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      card_name VARCHAR(100) NOT NULL,
      card_number VARCHAR(20) NOT NULL,
      card_type VARCHAR(20) DEFAULT 'visa' CHECK (card_type IN ('visa', 'mastercard', 'amex', 'discover')),
      expiry_date DATE NOT NULL,
      cvv VARCHAR(4),
      credit_limit DECIMAL(12,2) DEFAULT 0,
      available_credit DECIMAL(12,2) DEFAULT 0,
      interest_rate DECIMAL(8,4) DEFAULT 0,
      minimum_payment DECIMAL(12,2) DEFAULT 0,
      due_date INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Bank accounts table
  await client.query(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      account_name VARCHAR(100) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      account_type VARCHAR(20) DEFAULT 'checking' CHECK (account_type IN ('savings', 'current', 'salary', 'wallet', 'checking', 'investment')),
      balance DECIMAL(12,2) DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'USD',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Transactions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
      bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
      from_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
      to_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
      amount DECIMAL(12,2) NOT NULL,
      description TEXT NOT NULL,
      transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
      transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
      location VARCHAR(255),
      tags TEXT[],
      notes TEXT,
      receipt_url TEXT,
      is_recurring BOOLEAN DEFAULT false,
      recurring_frequency VARCHAR(20),
      recurring_end_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Budgets table
  await client.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      spent DECIMAL(12,2) DEFAULT 0,
      period VARCHAR(20) DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'on-track' CHECK (status IN ('on-track', 'over-budget', 'under-budget')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Goals table
  await client.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      target_amount DECIMAL(12,2) NOT NULL,
      current_amount DECIMAL(12,2) DEFAULT 0,
      target_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
      goal_type VARCHAR(20) DEFAULT 'savings' CHECK (goal_type IN ('savings', 'debt_payoff', 'purchase', 'emergency_fund')),
      icon VARCHAR(50) DEFAULT 'target',
      color VARCHAR(7) DEFAULT '#10B981',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Loans table
  await client.query(`
    CREATE TABLE IF NOT EXISTS loans (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      loan_name VARCHAR(100) NOT NULL,
      loan_type VARCHAR(50) DEFAULT 'Personal Loan' CHECK (loan_type IN ('Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan', 'Gold Loan', 'Education Loan', 'Private Money Lending', 'Other')),
      principal_amount DECIMAL(12,2) NOT NULL,
      outstanding_balance DECIMAL(12,2) NOT NULL,
      interest_rate DECIMAL(8,4) NOT NULL,
      monthly_payment DECIMAL(12,2) NOT NULL,
      loan_term_months INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      lender VARCHAR(100),
      account_number VARCHAR(50),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Notification tokens table
  await client.query(`
    CREATE TABLE IF NOT EXISTS notification_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
      device_id VARCHAR(255),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, token)
    )
  `);

  // Reminders table
  await client.query(`
    CREATE TABLE IF NOT EXISTS reminders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'general',
      due_date TIMESTAMP WITH TIME ZONE NOT NULL,
      reminder_time VARCHAR(10),
      priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      category VARCHAR(100),
      source_type VARCHAR(50) DEFAULT 'manual',
      source_id VARCHAR(100),
      is_recurring BOOLEAN DEFAULT false,
      recurring_frequency VARCHAR(20),
      is_completed BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      is_enabled BOOLEAN DEFAULT true,
      repeat_type VARCHAR(20),
      amount DECIMAL(12,2),
      is_auto_generated BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Notifications table
  await client.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      body TEXT,
      type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder', 'alert')),
      data JSONB,
      status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
      read_at TIMESTAMP WITH TIME ZONE,
      action_url VARCHAR(255),
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Token blacklist table - SECURITY: Store revoked tokens
  await client.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      reason VARCHAR(20) DEFAULT 'logout' CHECK (reason IN ('logout', 'revoked', 'security')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Create indexes for token blacklist
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
  `);

  // Audit logs table - SECURITY: Track sensitive operations
  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(100) NOT NULL,
      resource_id VARCHAR(255),
      ip_address VARCHAR(45),
      user_agent TEXT,
      details JSONB,
      status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'error')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Create indexes for audit logs
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);

  // Support tickets table
  await client.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      ticket_number VARCHAR(20) UNIQUE,
      subject VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
      priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      category VARCHAR(50) DEFAULT 'general',
      assigned_to UUID REFERENCES users(id),
      attachments TEXT[],
      admin_response TEXT,
      resolution TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Add ticket_number column if it doesn't exist and update existing records
  try {
    await client.query(`
      ALTER TABLE support_tickets 
      ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20) UNIQUE
    `);

    // Update existing tickets with ticket numbers
    await client.query(`
      UPDATE support_tickets 
      SET ticket_number = generate_ticket_number()
      WHERE ticket_number IS NULL
    `);

    // Make ticket_number NOT NULL after updating
    await client.query(`
      ALTER TABLE support_tickets 
      ALTER COLUMN ticket_number SET NOT NULL
    `);

    console.log('✅ Support tickets table updated with ticket_number column');
  } catch (error) {
    console.log('⚠️ Support tickets table update:', (error as Error).message);
  }

  // Ticket messages table
  await client.query(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_admin_reply BOOLEAN DEFAULT false,
      attachments TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Add missing columns to ticket_messages if they don't exist
  try {
    await client.query(`
      ALTER TABLE ticket_messages 
      ADD COLUMN IF NOT EXISTS is_admin_reply BOOLEAN DEFAULT false
    `);

    await client.query(`
      ALTER TABLE ticket_messages 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    console.log('✅ Ticket messages table updated with missing columns');
  } catch (error) {
    console.log('⚠️ Ticket messages table update:', (error as Error).message);
  }

  // Ticket attachments table
  await client.query(`
    CREATE TABLE IF NOT EXISTS ticket_attachments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
      message_id UUID REFERENCES ticket_messages(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_type VARCHAR(100) NOT NULL,
      file_size INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Support ticket messages table (for admin replies)
  await client.query(`
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
      admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_internal BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Banner categories table
  await client.query(`
    CREATE TABLE IF NOT EXISTS banner_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(7) DEFAULT '#6C5CE7',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Banners table
  await client.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      description TEXT,
      image_url VARCHAR(2048),
      target_url VARCHAR(2048),
      action_url VARCHAR(2048),
      action_text VARCHAR(100),
      background_color VARCHAR(7) DEFAULT '#6C5CE7',
      text_color VARCHAR(7) DEFAULT '#FFFFFF',
      icon VARCHAR(100),
      category_id UUID REFERENCES banner_categories(id) ON DELETE SET NULL,
      position VARCHAR(20) DEFAULT 'top' CHECK (position IN ('top', 'middle', 'bottom')),
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      end_date TIMESTAMP WITH TIME ZONE,
      created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create trigger function
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  // Create triggers
  const tables = ['users', 'categories', 'credit_cards', 'bank_accounts', 'transactions', 'budgets', 'goals', 'loans', 'notification_tokens', 'reminders', 'support_tickets', 'banner_categories', 'banners'];
  for (const table of tables) {
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_${table}_updated_at ON ${table};
      CREATE TRIGGER trigger_${table}_updated_at 
      BEFORE UPDATE ON ${table} 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  // Insert default categories (using Ionicons names)
  await client.query(`
    INSERT INTO categories (id, user_id, name, icon, color, type, is_default) VALUES
      (uuid_generate_v4(), NULL, 'Food & Dining', 'restaurant', '#FF6B6B', 'expense', true),
      (uuid_generate_v4(), NULL, 'Transportation', 'car', '#4ECDC4', 'expense', true),
      (uuid_generate_v4(), NULL, 'Shopping', 'cart', '#45B7D1', 'expense', true),
      (uuid_generate_v4(), NULL, 'Entertainment', 'film', '#96CEB4', 'expense', true),
      (uuid_generate_v4(), NULL, 'Bills & Utilities', 'document-text', '#FFEAA7', 'expense', true),
      (uuid_generate_v4(), NULL, 'Healthcare', 'heart', '#DDA0DD', 'expense', true),
      (uuid_generate_v4(), NULL, 'Education', 'book', '#98D8C8', 'expense', true),
      (uuid_generate_v4(), NULL, 'Travel', 'airplane', '#F7DC6F', 'expense', true),
      (uuid_generate_v4(), NULL, 'Rent', 'home', '#FF7675', 'expense', true),
      (uuid_generate_v4(), NULL, 'Subscription', 'card', '#74B9FF', 'expense', true),
      (uuid_generate_v4(), NULL, 'Gifts & Donations', 'gift', '#FD79A8', 'expense', true),
      (uuid_generate_v4(), NULL, 'Gas/Fuel', 'car-sport', '#FDCB6E', 'expense', true),
      (uuid_generate_v4(), NULL, 'EMI/Loan Payment', 'wallet', '#E17055', 'expense', true),
      (uuid_generate_v4(), NULL, 'Salary', 'cash', '#82E0AA', 'income', true),
      (uuid_generate_v4(), NULL, 'Freelance', 'briefcase', '#85C1E9', 'income', true),
      (uuid_generate_v4(), NULL, 'Investment', 'trending-up', '#F8C471', 'income', true),
      (uuid_generate_v4(), NULL, 'Other Income', 'add-circle', '#BB8FCE', 'income', true),
      (uuid_generate_v4(), NULL, 'Bonus', 'trophy', '#A29BFE', 'income', true),
      (uuid_generate_v4(), NULL, 'Interest Income', 'cash', '#6C5CE7', 'income', true),
      (uuid_generate_v4(), NULL, 'Part Time Income', 'time', '#00B894', 'income', true),
      (uuid_generate_v4(), NULL, 'Balance Transfer', 'swap-horizontal', '#9C88FF', 'transfer', true)
    ON CONFLICT DO NOTHING
  `);

  // Insert default banner categories
  await client.query(`
    INSERT INTO banner_categories (id, name, description, color, is_active) VALUES
      (uuid_generate_v4(), 'Promotional', 'Special offers and promotions', '#FF6B6B', true),
      (uuid_generate_v4(), 'Announcement', 'Important announcements', '#4ECDC4', true),
      (uuid_generate_v4(), 'Feature', 'New features and updates', '#45B7D1', true),
      (uuid_generate_v4(), 'Tips', 'Financial tips and advice', '#96CEB4', true),
      (uuid_generate_v4(), 'Event', 'Special events and campaigns', '#FFEAA7', true)
    ON CONFLICT DO NOTHING
  `);

  // Create admin user (password: admin123)
  await client.query(`
    INSERT INTO users (id, email, password, first_name, last_name, is_verified, is_active) VALUES
      (uuid_generate_v4(), 'admin@expensetracker.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Z9W2XvK6u', 'Admin', 'User', true, true)
    ON CONFLICT (email) DO NOTHING
  `);
};

// Connect to database with retry logic
export const connectDatabase = async (maxRetries: number = 5, retryDelay: number = 10000): Promise<void> => {
  let lastError: any = null;
    
  // Set up event listeners for the pool (only once)
  if (!pool.listeners('connect').length) {
    pool.on('connect', (client) => {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('🔄 New client connected to database');
      }
    });

    pool.on('error', (err, client) => {
      logger.error('❌ Unexpected error on idle client:', err);
      // Don't throw - let the pool handle reconnection
    });

    pool.on('remove', (client) => {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('🔄 Client removed from pool');
      }
    });
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`🔄 Attempting database connection (attempt ${attempt}/${maxRetries})...`);
      }
      
      await testConnection();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.warn(`✅ Database connection established successfully (took ${duration}s)`);
      return; // Success!

  } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`⚠️ Database connection attempt ${attempt} failed: ${errorMessage}`);
      
      // Check if it's a timeout error
      if (errorMessage.includes('timeout') || errorMessage.includes('Connection terminated')) {
        logger.warn('⚠️ This appears to be a network/database timeout issue. The database may be slow to respond.');
      }
      
      if (attempt < maxRetries) {
        if (process.env.NODE_ENV !== 'production') {
          logger.info(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  // All retries failed
  logger.error(`❌ Failed to connect to database after ${maxRetries} attempts`);
  logger.error('❌ Last error:', lastError instanceof Error ? lastError.message : lastError);
  logger.warn('⚠️  Server will continue running, but database-dependent features will not work.');
  logger.warn('⚠️  Please check:');
  logger.warn('   1. DATABASE_URL is correct in Railway environment variables');
  logger.warn('   2. Database service is running and accessible');
  logger.warn('   3. Network connectivity between services');
  
  throw lastError;
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
