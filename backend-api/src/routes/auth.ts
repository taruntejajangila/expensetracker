import express from 'express';
import { body } from 'express-validator';
import { createUser, authenticateUser, getUserById } from '../utils/userUtils';
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword } from '../utils/authUtils';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';

// Force Railway rebuild - change password route enabled

const router = express.Router();

// POST /api/auth/register - User registration
router.post('/register',
  [
    body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { name, email, password, phone } = req.body;

      logger.info(`Registration attempt for email: ${email}`);

      // Create user in database
      const newUser = await createUser({
        name,
        email,
        password,
        phone
      });

      // Generate tokens
      const accessToken = generateAccessToken(newUser.id, newUser.email, newUser.role);
      const refreshToken = generateRefreshToken(newUser.id);

      logger.info(`User registered successfully: ${newUser.id}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            createdAt: newUser.created_at
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  }
);

// POST /api/auth/login - User login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = req.body;

      logger.info(`Login attempt for email: ${email}`);

      // Authenticate user
      const user = await authenticateUser({ email, password });

      if (!user) {
        logger.warn(`Failed login attempt for email: ${email}`);
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      logger.info(`User logged in successfully: ${user.id}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Internal server error') : 'Internal server error'
      });
    }
  }
);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token required')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      logger.info('Token refresh attempt');

      // Verify refresh token and generate new access token
      // This is a simplified implementation - in production, you'd want to validate the refresh token
      const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (!decoded || !decoded.userId) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(decoded.userId, decoded.email || '', decoded.role || 'user');

      logger.info(`Token refreshed successfully for user: ${decoded.userId}`);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }
);

// POST /api/auth/logout - User logout
router.post('/logout',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return success
      logger.info('User logout');
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
  }
);

// GET /api/auth/me - Get current user profile
router.get('/me',
  authenticateToken,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      // User is already authenticated by middleware
      const authUser = req.user;
      if (!authUser) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      logger.info(`Get profile request for user: ${authUser.id}`);
      
      // Fetch complete user data from database
      const user = await getUserById(authUser.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }
);

// PATCH /api/auth/profile - Update user profile
router.patch('/profile',
  authenticateToken,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { name, phone } = req.body;

      // Validation
      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Name is required'
        });
        return;
      }

      if (name.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters'
        });
        return;
      }

      // Optional phone validation
      if (phone && phone.trim()) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          res.status(400).json({
            success: false,
            message: 'Please enter a valid 10-digit phone number'
          });
          return;
        }
      }

      logger.info(`Update profile request for user: ${authUser.id}`, { name, phone });

      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update user in database
      const updateQuery = `
        UPDATE users 
        SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, email, first_name, last_name, CONCAT(first_name, ' ', last_name) as name, phone, created_at, updated_at
      `;
      
      const result = await pool.query(updateQuery, [
        firstName,
        lastName,
        phone && phone.trim() ? phone.trim() : null,
        authUser.id
      ]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const updatedUser = result.rows[0];

      logger.info(`Profile updated successfully for user: ${authUser.id}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
);

// POST /api/auth/change-password - Change user password
router.post('/change-password',
  authenticateToken,
  async (req: express.Request, res: express.Response): Promise<void> => {
    let authUser: any = null;
    
    try {
      authUser = req.user;
      if (!authUser) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
        return;
      }

      if (currentPassword === newPassword) {
        res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
        return;
      }

      logger.info(`Change password request for user: ${authUser.id}`);

      // Get user from database to verify current password (need password hash)
      const userQuery = await pool.query(
        'SELECT id, email, first_name, last_name, password, role FROM users WHERE id = $1',
        [authUser.id]
      );
      
      if (userQuery.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const userWithPassword = userQuery.rows[0];

      // Verify current password
      const isPasswordValid = await comparePassword(currentPassword, userWithPassword.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password in database
      const updateQuery = `
        UPDATE users 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
      `;
      
      await pool.query(updateQuery, [hashedPassword, authUser.id]);

      logger.info(`Password changed successfully for user: ${authUser.id}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      logger.error('Change password error:', error);
      logger.error('Change password error details:', {
        message: error?.message,
        stack: error?.stack,
        userId: authUser?.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    }
  }
);

export default router;
