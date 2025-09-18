import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { verifyAccessToken } from '../utils/authUtils';
import { notificationService, PushNotificationData } from '../services/notificationService';
import { logger } from '../utils/logger';
import { getUserById } from '../utils/userUtils';

const router = Router();

/**
 * Register push notification token
 * POST /api/notifications/register-token
 */
router.post('/register-token', authenticateToken, async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!token || !platform) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and platform are required' 
      });
    }

    if (!['ios', 'android'].includes(platform)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Platform must be either ios or android' 
      });
    }

    await notificationService.registerToken(userId, token, platform, deviceId);

    logger.info(`Push notification token registered for user ${userId}`);
    return res.json({ 
      success: true, 
      message: 'Push notification token registered successfully' 
    });
  } catch (error) {
    logger.error('Error registering push notification token:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to register push notification token' 
    });
  }
});

/**
 * Deactivate push notification token
 * DELETE /api/notifications/token
 */
router.delete('/token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }

    await notificationService.deactivateToken(token, userId);

    logger.info(`Push notification token deactivated for user ${userId}`);
    return res.json({ 
      success: true, 
      message: 'Push notification token deactivated successfully' 
    });
  } catch (error) {
    logger.error('Error deactivating push notification token:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to deactivate push notification token' 
    });
  }
});

/**
 * Get user's notification tokens (for debugging)
 * GET /api/notifications/tokens
 */
router.get('/tokens', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const tokens = await notificationService.getUserTokens(userId);

    return res.json({ 
      success: true, 
      data: { tokens } 
    });
  } catch (error) {
    logger.error('Error getting user notification tokens:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get notification tokens' 
    });
  }
});

/**
 * Send push notification to specific user (Admin only)
 * POST /api/notifications/send
 */
router.post('/send', async (req, res) => {
  try {
    const { title, body, data, userId, userEmail, targetAll } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    // Handle test tokens for development
    if (token && (token.includes('test-dev-') || token.includes('expo-go-mock-'))) {
      logger.info('Development mode: Processing notification with test token');
      
      if (!title || !body) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title and body are required' 
        });
      }

      // Store notification in in-memory array for mobile app polling
      const notification = {
        id: Date.now(),
        title,
        body,
        data: data || {},
        createdAt: new Date().toISOString()
      };
      recentNotifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (recentNotifications.length > 50) {
        recentNotifications = recentNotifications.slice(0, 50);
      }

      return res.json({ 
        success: true, 
        message: 'Test notification sent successfully' 
      });
    }

    // For production tokens, use normal authentication
    // We need to manually authenticate here since we removed the middleware
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token'
      });
    }

    // Get user from database
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    if (!title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and body are required' 
      });
    }

    const notificationData: PushNotificationData = {
      title,
      body,
      data,
      userId,
      userEmail,
      targetAll
    };

    let notificationResult;
    if (targetAll) {
      notificationResult = await notificationService.sendToAll(notificationData);
      logger.info(`Push notification sent to all users by admin ${user.id}`);
    } else {
      if (!userId && !userEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Either userId or userEmail must be provided' 
        });
      }
      notificationResult = await notificationService.sendToUser(notificationData);
      logger.info(`Push notification sent to user by admin ${user.id}`);
    }

    return res.json({ 
      success: true, 
      message: 'Push notification sent successfully' 
    });
  } catch (error) {
    logger.error('Error sending push notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send push notification' 
    });
  }
});

/**
 * Get notification statistics (Admin only)
 * GET /api/notifications/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const stats = await notificationService.getNotificationStats();

    return res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    logger.error('Error getting notification stats:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get notification statistics' 
    });
  }
});

// Simple in-memory notification store for development
let recentNotifications: any[] = [];

/**
 * Test endpoint to verify routes are working
 * GET /api/notifications/test
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Notification routes are working!',
    timestamp: new Date().toISOString()
  });
});

/**
 * Poll for new notifications (Mobile app)
 * GET /api/notifications/poll
 */
router.get('/poll', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // Get recent notifications from database (last 5 minutes)
    const recentNotifications = await notificationService.getRecentNotifications(5);
    
    // Get user's notification tokens to check for token-based notifications
    let tokenStrings: string[] = [];
    try {
      const userTokens = await notificationService.getUserTokens(userId);
      tokenStrings = userTokens.map(token => token.token);
    } catch (error) {
      // If user has no tokens, continue with empty array
      logger.info(`No notification tokens found for user ${userId}`);
    }
    
    // Filter notifications that are relevant to this user
    // Include notifications that are:
    // 1. Sent to all users (target_user_id is null)
    // 2. Sent specifically to this user (target_user_id matches)
    // 3. Sent to user's notification tokens (target_token matches)
    const userNotifications = recentNotifications.filter(notif => 
      !notif.target_user_id || 
      notif.target_user_id === userId ||
      (notif.target_token && tokenStrings.includes(notif.target_token))
    );
    
    return res.json({
      success: true,
      notifications: userNotifications,
      hasNew: userNotifications.length > 0
    });
  } catch (error) {
    logger.error('Error polling notifications:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to poll notifications' 
    });
  }
});

/**
 * Get recent notifications (Mobile app)
 * GET /api/notifications/recent
 */
router.get('/recent', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization token required' 
      });
    }

    const token = authHeader.substring(7);
    
    // For development mode with test tokens, return recent notifications
    if (token.includes('test-dev-') || token.includes('expo-go-mock-')) {
      // Filter notifications from the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recent = recentNotifications.filter(notif => 
        new Date(notif.createdAt) > fiveMinutesAgo
      );
      
      return res.json({
        success: true,
        notifications: recent
      });
    }

    // For production tokens, return empty array for now
    return res.json({
      success: true,
      notifications: []
    });
  } catch (error) {
    logger.error('Error getting recent notifications:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get recent notifications' 
    });
  }
});

/**
 * Get notification history (Admin only)
 * GET /api/notifications/history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { page = 1, limit = 20, days = 7 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await notificationService.getNotificationHistory(
      Number(days),
      Number(limit),
      offset
    );

    return res.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    logger.error('Error getting notification history:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get notification history' 
    });
  }
});

/**
 * Clean up inactive tokens (Admin only)
 * POST /api/notifications/cleanup
 */
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const deletedCount = await notificationService.cleanupInactiveTokens();

    return res.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} inactive tokens`,
      data: { deletedCount }
    });
  } catch (error) {
    logger.error('Error cleaning up inactive tokens:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to clean up inactive tokens' 
    });
  }
});

export default router;
