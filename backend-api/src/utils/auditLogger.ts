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
    // Check both users and admin_users tables since admin users might not be in users table
    // Note: audit_logs.user_id has a foreign key constraint to users(id), so we can only use
    // user IDs that exist in the users table, or NULL
    let validUserId: string | null = null;
    if (logData.userId) {
      try {
        // First check users table
        const userCheck = await pool.query(
          'SELECT id FROM users WHERE id = $1',
          [logData.userId]
        );
        
        if (userCheck.rows.length > 0) {
          validUserId = logData.userId;
        } else {
          // If not found in users, check admin_users table
          // If admin user has a user_id that references users, use that instead
          const adminCheck = await pool.query(
            'SELECT id, user_id FROM admin_users WHERE id = $1',
            [logData.userId]
          );
          
          if (adminCheck.rows.length > 0) {
            const adminUser = adminCheck.rows[0];
            // If admin user has a corresponding user_id in users table, use that
            if (adminUser.user_id) {
              const userExistsCheck = await pool.query(
                'SELECT id FROM users WHERE id = $1',
                [adminUser.user_id]
              );
              if (userExistsCheck.rows.length > 0) {
                validUserId = adminUser.user_id;
              } else {
                // Admin user's user_id doesn't exist in users table - set to NULL
                logger.warn(`Audit log: Admin user ${logData.userId} has user_id ${adminUser.user_id} that doesn't exist in users table, setting user_id to NULL`);
                validUserId = null;
              }
            } else {
              // Admin user exists but has no user_id reference - set to NULL
              // This is expected for standalone admin users
              validUserId = null;
            }
          } else {
            // User doesn't exist in either table - log warning and set to NULL
            logger.warn(`Audit log: User ID ${logData.userId} not found in users or admin_users table, setting user_id to NULL`);
            validUserId = null;
          }
        }
      } catch (checkError) {
        // If check fails, set to NULL to avoid foreign key violation
        logger.warn(`Audit log: Error checking user existence for ${logData.userId}, setting user_id to NULL:`, checkError);
        validUserId = null;
      }
    }
    
    // Prepare details object - include original userId if it differs from validUserId
    // This helps track admin users that don't have corresponding user entries
    const detailsObj = logData.details || {};
    if (logData.userId && logData.userId !== validUserId) {
      detailsObj.originalUserId = logData.userId;
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
        Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : null,
        logData.status
      ]
    );
    
    // Also log to application logger
    const userIdLabel = validUserId || (logData.userId ? `admin:${logData.userId}` : 'unknown');
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

