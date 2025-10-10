// Simple migration to ensure reminders table exists
// Uses environment variables DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT

const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'expense_tracker_db',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const createExtension = `CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

  const createTable = `
    CREATE TABLE IF NOT EXISTS reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TIMESTAMPTZ NOT NULL,
      reminder_time TEXT,
      is_completed BOOLEAN DEFAULT FALSE,
      priority TEXT DEFAULT 'medium',
      category TEXT,
      source_type TEXT DEFAULT 'manual',
      source_id TEXT,
      type TEXT DEFAULT 'general',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders(user_id);
    CREATE INDEX IF NOT EXISTS reminders_due_date_idx ON reminders(due_date);
  `;

  // Ensure required columns exist (handles previously created minimal tables)
  const ensureColumns = `
    ALTER TABLE reminders
      ADD COLUMN IF NOT EXISTS reminder_time TEXT,
      ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
      ADD COLUMN IF NOT EXISTS source_id TEXT,
      ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `;


  try {
    await client.connect();
    console.log('Connected to database');
    await client.query('BEGIN');
    await client.query(createExtension);
    await client.query(createTable);
    await client.query(createIndexes);
    await client.query(ensureColumns);
    await client.query('COMMIT');
    console.log('Reminders table ready');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();


