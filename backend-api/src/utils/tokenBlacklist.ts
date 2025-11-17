import { getPool } from '../config/database';
import { logger } from './logger';

/**
 * Token Blacklist Service
 * Stores revoked tokens in database to prevent their reuse after logout
 */

interface BlacklistedToken {
  token: string;
  userId: string;
  expiresAt: Date;
  reason: 'logout' | 'revoked' | 'security';
}

/**
 * Add token to blacklist
 */
export const blacklistToken = async (
  token: string,
  userId: string,
  expiresAt: Date,
  reason: 'logout' | 'revoked' | 'security' = 'logout'
): Promise<void> => {
  try {
    const pool = getPool();
    
    // Store token hash (not the actual token) for security
    // In a production system, you might want to hash the token
    // For now, we'll store a truncated version with expiration
    const tokenHash = token.substring(0, 32); // Store first 32 chars as identifier
    
    // PostgreSQL doesn't support ON CONFLICT with non-unique columns in the same way
    // Use INSERT with conflict handling
    await pool.query(
      `INSERT INTO token_blacklist (token_hash, user_id, expires_at, reason, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (token_hash) DO UPDATE SET expires_at = EXCLUDED.expires_at, reason = EXCLUDED.reason`,
      [tokenHash, userId, expiresAt, reason]
    );
    
    logger.info(`Token blacklisted for user: ${userId}, reason: ${reason}`);
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    // Don't throw - blacklisting failure shouldn't break logout
  }
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const pool = getPool();
    const tokenHash = token.substring(0, 32);
    
    const result = await pool.query(
      `SELECT id FROM token_blacklist 
       WHERE token_hash = $1 
       AND expires_at > NOW()`,
      [tokenHash]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error checking token blacklist:', error);
    // On error, assume token is not blacklisted (fail open for availability)
    return false;
  }
};

/**
 * Clean up expired blacklist entries (should be run periodically)
 */
export const cleanupExpiredBlacklist = async (): Promise<number> => {
  try {
    const pool = getPool();
    
    const result = await pool.query(
      `DELETE FROM token_blacklist WHERE expires_at < NOW()`
    );
    
    const deletedCount = result.rowCount || 0;
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired blacklist entries`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up blacklist:', error);
    return 0;
  }
};

