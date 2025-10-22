import { PoolClient } from 'pg';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  version: string;
  filename: string;
  description: string;
  up: (client: PoolClient) => Promise<void>;
  down?: (client: PoolClient) => Promise<void>;
}

/**
 * Migration Runner
 * Automatically runs pending database migrations in order
 */
export class MigrationRunner {
  private client: PoolClient;
  private migrationsDir: string;

  constructor(client: PoolClient) {
    this.client = client;
    this.migrationsDir = __dirname; // Current directory contains migrations
  }

  /**
   * Initialize the schema_migrations table
   */
  private async initializeMigrationsTable(): Promise<void> {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        description TEXT,
        filename VARCHAR(255),
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        execution_time_ms INTEGER,
        status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'running'))
      );
    `);
    
    // Create index for faster lookups
    await this.client.query(`
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_version 
      ON schema_migrations(version);
    `);
    
    logger.info('✅ Schema migrations table initialized');
  }

  /**
   * Get all migration files from the migrations directory
   */
  private async getMigrationFiles(): Promise<string[]> {
    const files = fs.readdirSync(this.migrationsDir);
    
    // Filter for migration files (timestamp prefix + .ts or .js)
    const migrationFiles = files.filter(file => {
      return /^\d{14}_.*\.(ts|js)$/.test(file) && 
             file !== 'migrationRunner.ts' && 
             file !== 'migrationRunner.js';
    });
    
    // Sort by timestamp (filename prefix)
    return migrationFiles.sort();
  }

  /**
   * Get already executed migrations
   */
  private async getExecutedMigrations(): Promise<Set<string>> {
    const result = await this.client.query(`
      SELECT version FROM schema_migrations 
      WHERE status = 'completed'
      ORDER BY version;
    `);
    
    return new Set(result.rows.map(row => row.version));
  }

  /**
   * Load a migration module
   */
  private async loadMigration(filename: string): Promise<Migration> {
    const filePath = path.join(this.migrationsDir, filename);
    const version = filename.substring(0, 14); // Extract timestamp
    
    try {
      // Dynamic import for both .ts and .js files
      const module = await import(filePath);
      
      if (!module.up || typeof module.up !== 'function') {
        throw new Error(`Migration ${filename} must export an 'up' function`);
      }
      
      return {
        version,
        filename,
        description: module.description || 'No description provided',
        up: module.up,
        down: module.down,
      };
    } catch (error: any) {
      logger.error(`Failed to load migration ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    
    logger.info(`🔄 Running migration: ${migration.version} - ${migration.description}`);
    
    try {
      // Mark as running
      await this.client.query(`
        INSERT INTO schema_migrations (version, description, filename, status)
        VALUES ($1, $2, $3, 'running')
        ON CONFLICT (version) DO UPDATE 
        SET status = 'running', executed_at = NOW();
      `, [migration.version, migration.description, migration.filename]);
      
      // Execute the migration
      await migration.up(this.client);
      
      const executionTime = Date.now() - startTime;
      
      // Mark as completed
      await this.client.query(`
        UPDATE schema_migrations 
        SET status = 'completed', 
            executed_at = NOW(), 
            execution_time_ms = $1
        WHERE version = $2;
      `, [executionTime, migration.version]);
      
      logger.info(`✅ Migration ${migration.version} completed in ${executionTime}ms`);
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // Mark as failed
      await this.client.query(`
        UPDATE schema_migrations 
        SET status = 'failed', 
            executed_at = NOW(), 
            execution_time_ms = $1
        WHERE version = $2;
      `, [executionTime, migration.version]);
      
      logger.error(`❌ Migration ${migration.version} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      logger.info('🚀 Starting database migrations...');
      
      // Initialize migrations table
      await this.initializeMigrationsTable();
      
      // Get all migration files
      const migrationFiles = await this.getMigrationFiles();
      
      if (migrationFiles.length === 0) {
        logger.info('✅ No migrations found');
        return;
      }
      
      // Get already executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      
      // Filter pending migrations
      const pendingMigrationFiles = migrationFiles.filter(file => {
        const version = file.substring(0, 14);
        return !executedMigrations.has(version);
      });
      
      if (pendingMigrationFiles.length === 0) {
        logger.info('✅ All migrations are up to date');
        return;
      }
      
      logger.info(`📋 Found ${pendingMigrationFiles.length} pending migration(s)`);
      
      // Run each pending migration
      for (const filename of pendingMigrationFiles) {
        const migration = await this.loadMigration(filename);
        await this.executeMigration(migration);
      }
      
      logger.info(`✅ All migrations completed successfully`);
      
    } catch (error: any) {
      logger.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<any[]> {
    const result = await this.client.query(`
      SELECT 
        version,
        description,
        filename,
        executed_at,
        execution_time_ms,
        status
      FROM schema_migrations
      ORDER BY version DESC
      LIMIT 10;
    `);
    
    return result.rows;
  }
}

