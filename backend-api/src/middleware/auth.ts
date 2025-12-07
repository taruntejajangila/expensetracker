import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, hasRole } from '../utils/authUtils';
import { getUserById } from '../utils/userUtils';
import { logger } from '../utils/logger';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';
import { auditLog } from '../utils/auditLogger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Debug: Log token details for troubleshooting (only in development)
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`Token received: ${token.substring(0, 20)}... (length: ${token.length})`);
    }

    // Handle test tokens ONLY in development - SECURITY: Reject in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isTestToken = token.includes('test-dev-') || token.includes('expo-go-mock-') || token === 'test-token';
    
    if (isTestToken) {
      if (isDevelopment) {
        // Only allow test tokens in development
        logger.info(`Test token detected: ${token.substring(0, 20)}... - Bypassing JWT validation (DEV ONLY)`);
        
        // Create a mock user for test tokens
        req.user = {
          id: '0041a7fa-a4cf-408a-a106-4bc3e3744fbb', // Use a valid UUID format
          email: 'test@example.com',
          role: 'user',
          name: 'Test User'
        };
        
        next();
        return;
      } else {
        // In production, reject test tokens immediately
        logger.warn(`SECURITY: Test token rejected in production: ${token.substring(0, 20)}...`);
        res.status(401).json({
          success: false,
          message: 'Invalid or expired access token'
        });
        return;
      }
    }

    // SECURITY: Check if token is blacklisted (revoked)
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      logger.warn(`SECURITY: Blacklisted token attempted: ${token.substring(0, 20)}...`);
      res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      // Token verification failure is already logged in verifyToken (expired tokens as debug, invalid as warn)
      // Only log here in debug mode to avoid redundant logs
      logger.debug(`Token verification failed for token: ${token.substring(0, 20)}...`);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired access token'
      });
      return;
    }

    // Try to get user from database to ensure they still exist and are active
    // If database is unavailable, use JWT token data (graceful degradation)
    try {
      const user = await getUserById(decoded.userId);
      if (user) {
        // Add user info to request
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        };
        // Only log in development
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`User authenticated: ${user.id} (${user.email})`);
        }
        
        // SECURITY: Audit log authentication (async, don't block)
        auditLog({
          userId: user.id,
          action: 'authenticate',
          resource: 'api_access',
          ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          status: 'success'
        }).catch(err => logger.error('Audit log error:', err));
        
        next();
        return;
      } else {
        // User not found in database
        res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
        return;
      }
    } catch (dbError: any) {
      // SECURITY: In production, fail securely if database is unavailable
      // In development, allow graceful degradation for testing
      if (process.env.NODE_ENV === 'production') {
        logger.error('Database unavailable in production - rejecting authentication:', dbError.message);
        res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable. Please try again later.'
        });
        return;
      }
      
      // Development only: Database connection error - use JWT token data as fallback
      logger.warn('Database unavailable for user lookup, using JWT token data (DEV ONLY):', dbError.message);
      
      // Use decoded token data as fallback (graceful degradation - DEV ONLY)
      // Note: JWT only contains userId, email, role (not name)
      req.user = {
        id: decoded.userId,
        email: decoded.email || '',
        role: decoded.role || 'user',
        name: 'User' // Default name since not in JWT
      };
      
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`User authenticated via JWT (DB unavailable - DEV ONLY): ${decoded.userId}`);
      }
      next();
      return;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!hasRole(req.user.role, requiredRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Multiple roles authorization middleware (user must have at least one of the required roles)
export const requireAnyRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const hasAnyRole = requiredRoles.some(role => hasRole(req.user!.role, role));
    if (!hasAnyRole) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await getUserById(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          };
        }
      }
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Optional auth failed:', error);
    }
  }

  next();
};

// Admin-only middleware
export const requireAdmin = requireRole('admin');

// Super admin middleware
export const requireSuperAdmin = requireRole('superadmin');
