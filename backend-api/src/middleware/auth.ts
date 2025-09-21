import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, hasRole } from '../utils/authUtils';
import { getUserById } from '../utils/userUtils';
import { logger } from '../utils/logger';

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

    // Debug: Log token details for troubleshooting
    logger.debug(`Token received: ${token.substring(0, 20)}... (length: ${token.length})`);

    // Handle test tokens for development
    if (token.includes('test-dev-') || token.includes('expo-go-mock-') || token === 'test-token') {
      logger.info(`Test token detected: ${token.substring(0, 20)}... - Bypassing JWT validation`);
      
      // Create a mock user for test tokens
      req.user = {
        id: '0041a7fa-a4cf-408a-a106-4bc3e3744fbb', // Use a valid UUID format
        email: 'test@example.com',
        role: 'user',
        name: 'Test User'
      };
      
      next();
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      logger.error(`Token verification failed for token: ${token.substring(0, 20)}...`);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired access token'
      });
      return;
    }

    // Get user from database to ensure they still exist and are active
    const user = await getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
      return;
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    logger.debug(`User authenticated: ${user.id} (${user.email})`);
    next();
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
    logger.debug('Optional auth failed:', error);
  }

  next();
};

// Admin-only middleware
export const requireAdmin = requireRole('admin');

// Super admin middleware
export const requireSuperAdmin = requireRole('superadmin');
