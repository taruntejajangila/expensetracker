import { getPool } from '../config/database';
import { logger } from './logger';

/**
 * Audit Logger Service
 * Logs all sensitive operations for security auditing
 */

export interface AuditLog {
  userId?: string; // Make optional to handle cases where user doesn't exist
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status: 'success' | 'failure' | 'error';
}

/**
 * Create audit log entry
 * Validates user exists before inserting to avoid foreign key constraint violations
 */
export const auditLog = async (logData: AuditLog): Promise<void> => {
  try {
    const pool = getPool();
    
    // If userId is provided, validate it exists in the database
    let validUserId: string | null = null;
    if (logData.userId) {
      try {
        const userCheck = await pool.query(
          'SELECT id FROM users WHERE id = $1',
          [logData.userId]
        );
        
        if (userCheck.rows.length > 0) {
          validUserId = logData.userId;
        } else {
          // User doesn't exist - log warning and set to NULL
          logger.warn(`Audit log: User ID ${logData.userId} not found in database, setting user_id to NULL`);
          validUserId = null;
        }
      } catch (checkError) {
        // If check fails, set to NULL to avoid foreign key violation
        logger.warn(`Audit log: Error checking user existence for ${logData.userId}, setting user_id to NULL:`, checkError);
        validUserId = null;
      }
    }
    
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, resource, resource_id, 
        ip_address, user_agent, details, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        validUserId,
        logData.action,
        logData.resource,
        logData.resourceId || null,
        logData.ipAddress || null,
        logData.userAgent || null,
        logData.details ? JSON.stringify(logData.details) : null,
        logData.status
      ]
    );
    
    // Also log to application logger
    const userIdLabel = validUserId || 'unknown';
    logger.info(`AUDIT: ${logData.action} on ${logData.resource} by ${userIdLabel} - ${logData.status}`);
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break operations
    logger.error('Error creating audit log:', error);
  }
};

/**
 * Get audit logs for a user
 */
export const getUserAuditLogs = async (
  userId: string,
  limit: number = 100
): Promise<AuditLog[]> => {
  try {
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    return result.rows.map(row => ({
      userId: row.user_id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      details: row.details ? JSON.parse(row.details) : null,
      status: row.status,
      createdAt: row.created_at
    }));
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    return [];
  }
};

