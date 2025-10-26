import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';
import notificationService from '../services/notificationService';
import { getPool } from '../config/database';

const router = express.Router();

// Validation middleware for token registration
const validateTokenRegistration = [
  body('token').isString().notEmpty().withMessage('Push token is required'),
  body('platform').optional().isIn(['ios', 'android', 'web', 'mobile']).withMessage('Invalid platform'),
  body('deviceInfo').optional().isObject().withMessage('Device info must be an object'),
];

// POST /api/notifications/register - Register push notification token
router.post('/register', authenticateToken, validateTokenRegistration, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { token, platform = 'mobile', deviceInfo } = req.body;

    // Store the token in the database
    try {
      await notificationService.registerToken(
        userId,
        token,
        platform as 'ios' | 'android',
        deviceInfo?.modelName
      );
      logger.info(`Push token registered for user ${userId}: ${token} (platform: ${platform})`);
    } catch (dbError) {
      logger.error('Error storing notification token:', dbError);
      // Continue with response even if database storage fails
    }
    
    if (deviceInfo) {
      logger.info(`Device info: ${JSON.stringify(deviceInfo)}`);
    }

    res.json({
      success: true,
      message: 'Push token registered successfully',
      data: {
        userId,
        token,
        platform,
        deviceInfo,
        registeredAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error registering push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register push token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/notifications - Get user notifications
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    // Fetch notifications from database
    const notifications = await notificationService.getUserNotifications(userId);

    logger.info(`Retrieved ${notifications.length} notifications for user ${userId}`);

    res.json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error retrieving notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Update notification as read in database
    const pool = getPool();
    const result = await pool.query(`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
      RETURNING id, read_at
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or not accessible to user'
      });
    }

    logger.info(`Notification ${notificationId} marked as read by user ${userId}`);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notificationId,
        userId,
        readAt: result.rows[0].read_at
      }
    });
  } catch (error: any) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    // Update all notifications as read in database
    const pool = getPool();
    const result = await pool.query(`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE (user_id = $1 OR user_id IS NULL) AND read_at IS NULL
    `, [userId]);

    const updatedCount = result.rowCount || 0;

    logger.info(`Marked ${updatedCount} notifications as read for user ${userId}`);

    res.json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      data: {
        userId,
        updatedCount,
        readAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/notifications/send - Send notification (admin only)
router.post('/send', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { title, body, targetAll, userEmail, userEmails, data, type, customContent } = req.body;
    
    logger.info('📥 Received notification request:', {
      title,
      body,
      targetAll,
      userEmails,
      type,
      customContent: customContent ? 'Present' : 'Not present',
      customContentType: customContent?.type,
      customContentId: customContent?.id
    });

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    if (targetAll) {
      const notificationData = {
        title,
        body,
        data: type === 'custom' && customContent ? {
          type: 'custom',
          from: 'admin_panel',
          notificationType: customContent.type,
          customNotificationId: customContent.id,
          actionButton: customContent.actionButton,
          tags: customContent.tags
        } : (data || { type: 'admin_notification', from: 'admin_panel' }),
        targetAll,
        userEmail: undefined,
        ...(type === 'custom' && customContent ? {
          type: 'custom' as const,
          customContent: customContent
        } : {
          type: 'simple' as const
        })
      };

      await notificationService.sendToAll(notificationData);
      
      logger.info(`Notification sent to all users by admin: ${title}`);

      return res.json({
        success: true,
        message: 'Notification sent to all users successfully',
        data: {
          title,
          body,
          targetAll: true,
          userEmails: null,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      // Handle multiple users or single user
      const emails = userEmails || (userEmail ? [userEmail] : []);
      
      if (emails.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one user email is required when not targeting all users'
        });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      // Send to each user individually
      for (const email of emails) {
        try {
          const notificationData = {
            title,
            body,
            data: data || { type: 'admin_notification', from: 'admin_panel' },
            targetAll: false,
            userEmail: email,
            ...(type === 'custom' && customContent ? {
              type: 'custom' as const,
              customContent: customContent
            } : {
              type: 'simple' as const
            })
          };

          await notificationService.sendToUser(notificationData);
          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push({ email, error: error.message });
          logger.error(`Failed to send notification to ${email}:`, error);
        }
      }

      logger.info(`Notification sent by admin: ${title} - ${successCount} successful, ${errorCount} failed`);

      res.json({
        success: errorCount === 0,
        message: errorCount === 0 
          ? `Notification sent to ${successCount} user(s) successfully`
          : `Notification sent to ${successCount} user(s), ${errorCount} failed`,
        data: {
          title,
          body,
          targetAll: false,
          userEmails: emails,
          successCount,
          errorCount,
          errors: errors.length > 0 ? errors : undefined,
          sentAt: new Date().toISOString()
        }
      });
    }
  } catch (error: any) {
    logger.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/notifications/custom/:id - Get custom notification content
router.get('/custom/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Custom notification ID is required'
      });
    }

    const customNotification = await notificationService.getCustomNotification(id);
    
    if (!customNotification) {
      return res.status(404).json({
        success: false,
        message: 'Custom notification not found'
      });
    }

    res.json({
      success: true,
      data: customNotification
    });
  } catch (error: any) {
    logger.error('Error fetching custom notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom notification'
    });
  }
});

// GET /api/notifications/history - Get notification history (admin only)
router.get('/history', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await notificationService.getNotificationHistory(days, limit, offset);

    res.json({
      success: true,
      data: history,
      message: 'Notification history retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error retrieving notification history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;