import express from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { createUser, authenticateUser, getUserById } from '../utils/userUtils';
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword } from '../utils/authUtils';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';
import { TwoFactorService } from '../services/twoFactorService';
import { blacklistToken } from '../utils/tokenBlacklist';
import { auditLog } from '../utils/auditLogger';

// Force Railway rebuild - routes verified - v6 - /auth/me route fixed by moving to top

const router = express.Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
  logger.info('🔍 /auth/test endpoint hit');
  res.json({ success: true, message: 'Auth router is working' });
});

// Test route for /me without auth to verify route exists
router.get('/me-test', (req, res) => {
  logger.info('🔍 /auth/me-test endpoint hit (no auth)');
  res.json({ success: true, message: '/me route exists, but requires authentication' });
});

// GET /api/auth/me - Get current user profile
router.get('/me',
  authenticateToken,
  async (req: express.Request, res: express.Response): Promise<void> => {
    logger.info('🔍 /auth/me endpoint hit');
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

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token required')
], validateRequest, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    logger.info('🔄 /api/auth/refresh endpoint HIT - processing request');
    const { refreshToken } = req.body;
    logger.info('Token refresh attempt');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }
    const newAccessToken = generateAccessToken(decoded.userId, decoded.email || '', decoded.role || 'user');
    logger.info(`Token refreshed successfully for user: ${decoded.userId}`);
    
    // SECURITY: Audit log token refresh
    auditLog({
      userId: decoded.userId,
      action: 'token_refresh',
      resource: 'authentication',
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      status: 'success'
    }).catch(err => logger.error('Audit log error:', err));
    
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
});

// DEPRECATED: Password-based registration removed in favor of passwordless OTP authentication
// POST /api/auth/register - User registration (DISABLED - Use OTP signup instead)
/*
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
*/

// DEPRECATED: Password-based login removed in favor of passwordless OTP authentication
// POST /api/auth/login - User login (DISABLED - Use OTP login instead)
/*
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

// POST /api/auth/logout - User logout
router.post('/logout',
  authenticateToken,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const authUser = req.user;
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7); // Remove 'Bearer ' prefix
      
      if (!authUser || !token) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // SECURITY: Blacklist the token to prevent reuse
      // Decode token to get expiration
      let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default: 24h from now
      try {
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.exp) {
          expiresAt = new Date(decoded.exp * 1000);
        }
      } catch (e) {
        // Use default expiration if decode fails
      }
      
      await blacklistToken(token, authUser.id, expiresAt, 'logout');

      // SECURITY: Audit log logout
      await auditLog({
        userId: authUser.id,
        action: 'logout',
        resource: 'authentication',
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        status: 'success'
      });
      
      logger.info(`User logged out successfully: ${authUser.id} (${authUser.email})`);
      
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

// PATCH /api/auth/profile - Update user profile (DEPRECATED - commented out)
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
*/

// DEPRECATED: Password change removed - app is now fully passwordless
// POST /api/auth/change-password - Change user password (DISABLED)
/*
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
        'SELECT id, email, first_name, last_name, password FROM users WHERE id = $1',
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
*/

// POST /api/auth/request-otp - Request OTP via SMS
router.post('/request-otp',
  [
    body('phone').isMobilePhone('any').withMessage('Valid phone number required')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { phone } = req.body;

      // Normalize phone number: remove spaces, ensure starts with +
      let formattedPhone = phone.replace(/\s/g, '').trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      }

      logger.info(`OTP request for phone: ${formattedPhone}`);

      // Rate limiting: Check if user requested OTP recently
      // SECURITY: Stricter limits in production (3 per hour) vs development (15 per hour)
      const isProduction = process.env.NODE_ENV === 'production';
      const maxOTPRequests = isProduction ? 3 : 15; // Stricter in production
      const recentOTP = await pool.query(`
        SELECT created_at FROM otp_verifications 
        WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC
      `, [formattedPhone]);

      if (recentOTP.rows.length >= maxOTPRequests) {
        const oldestRequest = new Date(recentOTP.rows[recentOTP.rows.length - 1].created_at);
        const waitTime = Math.ceil((60 - (Date.now() - oldestRequest.getTime()) / 1000 / 60));
        
        return res.status(429).json({
          success: false,
          message: `Too many OTP requests. Please wait ${waitTime} minutes before requesting again.`
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in database (expires in 5 minutes)
      await pool.query(`
        INSERT INTO otp_verifications (phone, otp, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
      `, [formattedPhone, otp]);

      // Send OTP via 2Factor.in
      const sent = await TwoFactorService.sendOTP(formattedPhone, otp);

      if (!sent) {
        // Delete the OTP if sending failed
        await pool.query(`
          DELETE FROM otp_verifications 
          WHERE phone = $1 AND otp = $2
        `, [formattedPhone, otp]);

        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }

      logger.info(`OTP sent successfully to ${formattedPhone}`);

      return res.json({
        success: true,
        message: 'OTP sent to your phone number'
        // NOTE: Never send OTP in response!
      });

    } catch (error) {
      logger.error('OTP request error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }
  }
);

// POST /api/auth/check-phone - Pre-check if user exists (for signup/login flow)
router.post('/check-phone',
  [
    body('phone').isMobilePhone('any').withMessage('Valid phone number required')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { phone } = req.body;

      // Normalize phone number
      let formattedPhone = phone.replace(/\s/g, '').trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      }

      logger.info(`Phone check for: ${formattedPhone}`);

      // Check if user exists
      const user = await pool.query(
        'SELECT id, phone, email, first_name, last_name FROM users WHERE phone = $1',
        [formattedPhone]
      );

      const exists = user.rows.length > 0;
      const userData = exists ? user.rows[0] : null;

      return res.json({
        success: true,
        exists,
        data: exists ? {
          id: userData.id,
          phone: userData.phone,
          email: userData.email,
          name: `${userData.first_name} ${userData.last_name}`.trim() || 'User'
        } : null
      });

    } catch (error) {
      logger.error('Phone check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check phone number'
      });
    }
  }
);

// POST /api/auth/verify-otp - Verify OTP (for both login and signup)
router.post('/verify-otp',
  [
    body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { phone, otp } = req.body;

      // Normalize phone number: remove spaces, ensure starts with +
      let formattedPhone = phone.replace(/\s/g, '').trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      }

      // Normalize OTP: remove any whitespace, ensure it's exactly 6 digits
      const normalizedOtp = otp.toString().replace(/\s/g, '').trim();

      logger.info(`OTP verification attempt for phone: ${formattedPhone}, OTP: ${normalizedOtp}`);

      // Find valid OTP
      const otpRecord = await pool.query(`
        SELECT * FROM otp_verifications 
        WHERE phone = $1 
          AND otp = $2 
          AND expires_at > NOW()
          AND used = false
        ORDER BY created_at DESC 
        LIMIT 1
      `, [formattedPhone, normalizedOtp]);

      if (otpRecord.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Mark OTP as used
      await pool.query(`
        UPDATE otp_verifications 
        SET used = true 
        WHERE id = $1
      `, [otpRecord.rows[0].id]);

      // Check if user exists
      const user = await pool.query(
        'SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE phone = $1',
        [formattedPhone]
      );

      const isNewUser = user.rows.length === 0;

      if (isNewUser) {
        // For new users: create temporary user account (will be completed in complete-signup)
        const placeholderEmail = `${formattedPhone.replace(/\+/g, '')}@phone.otp`;
        
        const newUser = await pool.query(`
          INSERT INTO users (phone, email, first_name, last_name, password, is_active, is_verified, created_at)
          VALUES ($1, $2, $3, $4, NULL, true, true, NOW())
          RETURNING id, phone, first_name, last_name, email, created_at
        `, [formattedPhone, placeholderEmail, 'User', '']);
        
        const userData = newUser.rows[0];

        // Generate temporary tokens (user needs to complete signup)
        const tempToken = generateAccessToken(
          userData.id,
          userData.email || formattedPhone,
          'user'
        );

        logger.info(`New user created via OTP (pending signup completion): ${userData.id}`);

        return res.json({
          success: true,
          message: 'OTP verified successfully',
          requiresSignup: true,
          data: {
            tempToken,
            user: {
              id: userData.id,
              phone: userData.phone
            }
          }
        });
      } else {
        // Existing user: login immediately
        const userData = user.rows[0];

        // Update last_login and is_verified (phone verified via OTP)
        await pool.query(
          `UPDATE users 
           SET last_login = NOW(), 
               is_verified = true,
               updated_at = NOW()
           WHERE id = $1`,
          [userData.id]
        );

        // Generate JWT tokens
        const accessToken = generateAccessToken(
          userData.id,
          userData.email || formattedPhone,
          'user'
        );
        const refreshToken = generateRefreshToken(userData.id);

        logger.info(`User logged in via OTP: ${userData.id}`);

        return res.json({
          success: true,
          message: 'OTP verified successfully',
          requiresSignup: false,
          data: {
            user: {
              id: userData.id,
              phone: userData.phone,
              name: `${userData.first_name} ${userData.last_name}`.trim() || 'User',
              email: userData.email,
              createdAt: userData.created_at
            },
            accessToken,
            refreshToken
          }
        });
      }

    } catch (error) {
      logger.error('OTP verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify OTP'
      });
    }
  }
);

// POST /api/auth/complete-signup - Complete signup after OTP verification (for new users)
router.post('/complete-signup',
  authenticateToken,
  [
    body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const authUser = req.user;
      if (!authUser) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const { name, email } = req.body;

      // Get user from database
      const user = await pool.query(
        'SELECT id, phone, email, first_name, last_name FROM users WHERE id = $1',
        [authUser.id]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = user.rows[0];

      // Check if user already completed signup (has real name, not "User")
      if (userData.first_name !== 'User' || userData.last_name !== '') {
        return res.status(400).json({
          success: false,
          message: 'Signup already completed'
        });
      }

      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Email is required - check if email is already taken
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.trim(), authUser.id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }

      // Update user with name and email (both required)
      // Also set last_login and ensure is_verified is true (phone already verified via OTP)
      const updateFields: string[] = ['first_name = $1', 'last_name = $2', 'email = $3', 'last_login = NOW()', 'is_verified = true', 'updated_at = NOW()'];
      const updateValues: any[] = [firstName, lastName, email.trim()];

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $4
        RETURNING id, phone, email, first_name, last_name, created_at
      `;
      updateValues.push(authUser.id);

      const updatedUser = await pool.query(updateQuery, updateValues);
      const finalUser = updatedUser.rows[0];

      // Generate final tokens
      const accessToken = generateAccessToken(
        finalUser.id,
        finalUser.email || userData.phone,
        'user'
      );
      const refreshToken = generateRefreshToken(finalUser.id);

      logger.info(`User signup completed: ${finalUser.id}`);

      return res.json({
        success: true,
        message: 'Signup completed successfully',
        data: {
          user: {
            id: finalUser.id,
            phone: finalUser.phone,
            name: `${finalUser.first_name} ${finalUser.last_name}`.trim(),
            email: finalUser.email,
            createdAt: finalUser.created_at
          },
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      logger.error('Complete signup error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete signup'
      });
    }
  }
);

// GET /api/auth/debug/users - Debug endpoint to view all users (for testing)
// TODO: Remove or restrict this endpoint in production
router.get('/debug/users',
  async (req: express.Request, res: express.Response) => {
    try {
      // Get all users with their data
      const usersResult = await pool.query(`
        SELECT 
          id,
          email,
          phone,
          first_name,
          last_name,
          CONCAT(first_name, ' ', last_name) as name,
          password IS NOT NULL as has_password,
          is_active,
          is_verified,
          created_at,
          updated_at,
          last_login
        FROM users
        ORDER BY created_at DESC
      `);

      const users = usersResult.rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        name: user.name || 'User',
        hasPassword: user.has_password,
        isActive: user.is_active,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      }));

      logger.info(`Debug: User list requested - ${users.length} users found`);

      res.json({
        success: true,
        message: 'User data retrieved successfully',
        count: users.length,
        data: users
      });
    } catch (error: any) {
      logger.error('Debug users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    }
  }
);

export default router;
