import { getPool } from '../config/database';
import { hashPassword, comparePassword } from './authUtils';
import { logger } from './logger';

// Version: Fixed getUserById for Railway deployment - v3 (FORCE RESTART)

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

// Create new user
export const createUser = async (userData: CreateUserData): Promise<User> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Insert new user
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, phone, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
      [
        userData.name,
        userData.email,
        hashedPassword,
        userData.phone || null,
        userData.role || 'user',
        true
      ]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

// Authenticate user login
export const authenticateUser = async (loginData: LoginUserData): Promise<User | null> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT id, name, email, phone, role, is_active, password_hash FROM users WHERE email = $1 AND is_active = true',
      [loginData.email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    const isPasswordValid = await comparePassword(loginData.password, user.password_hash);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // Remove password hash from response
    delete user.password_hash;
    return user;
  } finally {
    client.release();
  }
};

// Get user by ID - Fixed for Railway deployment to handle both users and admin_users tables
export const getUserById = async (userId: string): Promise<User | null> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // First check regular users table (users table has first_name + last_name, not name)
    const userResult = await client.query(
      'SELECT id, first_name, last_name, email, phone, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      // Map users table fields to User interface
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`, // Combine first_name + last_name
        email: user.email,
        phone: user.phone,
        role: 'user', // users table doesn't have role, default to 'user'
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    }
    
    // If not found in users table, check admin_users table
    // Use a simpler query to avoid PostgreSQL column alias issues
    logger.info(`🔍 Checking admin_users table for userId: ${userId}`);
    const adminResult = await client.query(
      'SELECT id, username, email, role, is_active, created_at, updated_at FROM admin_users WHERE id = $1 AND is_active = true',
      [userId]
    );
    logger.info(`🔍 Admin query result: ${adminResult.rows.length} rows found`);
    
    if (adminResult.rows.length > 0) {
      const adminUser = adminResult.rows[0];
      // Map the admin user data to match the User interface
      return {
        id: adminUser.id,
        name: adminUser.username, // Map username to name
        email: adminUser.email,
        phone: undefined, // admin_users don't have phone
        role: adminUser.role,
        is_active: adminUser.is_active,
        created_at: adminUser.created_at,
        updated_at: adminUser.updated_at
      };
    }
    
    return null;
  } finally {
    client.release();
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<Pick<User, 'name' | 'phone'>>): Promise<User | null> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (updates.name) {
      updateFields.push(`name = $${paramCount}`);
      values.push(updates.name);
      paramCount++;
    }
    
    if (updates.phone) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(updates.phone);
      paramCount++;
    }
    
    if (updateFields.length === 0) {
      return await getUserById(userId);
    }
    
    updateFields.push(`updated_at = NOW()`);
    values.push(userId);
    
    const result = await client.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND is_active = true
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
      values
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
};

// Deactivate user
export const deactivateUser = async (userId: string): Promise<boolean> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [userId]
    );
    
    return result.rows.length > 0;
  } finally {
    client.release();
  }
};
