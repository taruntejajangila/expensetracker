import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT token generation
export const generateAccessToken = (userId: string, email: string, role: string = 'user'): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId, email, role },
    secret,
    { expiresIn: '24h' } // Extended from 15m to 24h
  );
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  // Long-lived refresh token for passwordless OTP login (90 days)
  return jwt.sign(
    { userId, type: 'refresh' },
    secret,
    { expiresIn: '90d' }
  );
};

// JWT token verification
export const verifyToken = (token: string, secret: string): any => {
  try {
    return jwt.verify(token, secret, { clockTolerance: 10 });
  } catch (error: any) {
    // Expired tokens are expected behavior - log as debug/warn, not error
    if (error.name === 'TokenExpiredError') {
      // Only log in debug mode to reduce log noise
      logger.debug('Token expired (expected):', { expiredAt: error.expiredAt });
    } else {
      // Actual errors (malformed tokens, invalid signature, etc.) should be logged
      logger.warn('Token verification failed:', { error: error.name, message: error.message });
    }
    return null;
  }
};

export const verifyAccessToken = (token: string): any => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return verifyToken(token, secret);
};

export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }
  return verifyToken(token, secret);
};

// Token extraction from headers
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// User role validation
export const hasRole = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    'user': 1,
    'admin': 2,
    'super_admin': 3,
    'superadmin': 3  // Keep both for compatibility
  };
  
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
};
