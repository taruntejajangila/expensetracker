import { getPool } from '../config/database';
import { logger } from '../utils/logger';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  userId?: string;
  userEmail?: string;
  targetAll?: boolean;
  // Custom notification fields
  type?: 'simple' | 'custom';
  customContent?: {
    id: string;
    type: 'announcement' | 'blog_post' | 'update' | 'promotion' | 'general';
    content: string;
    author?: string;
    imageUrl?: string;
    actionButton?: {
      text: string;
      url?: string;
      action?: string;
    };
    tags?: string[];
  };
}

export interface NotificationToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  deviceId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class NotificationService {
  private pool = getPool();

  constructor() {
    // Create custom_notifications table if it doesn't exist
    this.initializeCustomNotificationsTable();
  }

  private async initializeCustomNotificationsTable() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS custom_notifications (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          body VARCHAR(500) NOT NULL,
          type VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          author VARCHAR(255),
          image_url VARCHAR(2048),
          action_button_text VARCHAR(100),
          action_button_url VARCHAR(2048),
          action_button_action VARCHAR(100),
          tags JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('✅ Custom notifications table initialized');
    } catch (error) {
      logger.error('❌ Error initializing custom notifications table:', error);
    }
  }

  /**
   * Register a push notification token for a user
   */
  async registerToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
    deviceId?: string
  ): Promise<void> {
    try {
      // Check if token already exists
      const existingToken = await this.pool.query(
        'SELECT id FROM notification_tokens WHERE token = $1 AND user_id = $2',
        [token, userId]
      );

      if (existingToken.rows.length > 0) {
        // Update existing token
        await this.pool.query(
          'UPDATE notification_tokens SET platform = $1, device_id = $2, is_active = true, updated_at = NOW() WHERE token = $3 AND user_id = $4',
          [platform, deviceId, token, userId]
        );
        logger.info(`Updated existing notification token for user ${userId}`);
      } else {
        // Insert new token
        await this.pool.query(
          'INSERT INTO notification_tokens (user_id, token, platform, device_id, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, true, NOW(), NOW())',
          [userId, token, platform, deviceId]
        );
        logger.info(`Registered new notification token for user ${userId}`);
      }
    } catch (error) {
      logger.error('Error registering notification token:', error);
      throw error;
    }
  }

  /**
   * Get all active notification tokens for a user
   */
  async getUserTokens(userId: string): Promise<NotificationToken[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM notification_tokens WHERE user_id = $1 AND is_active = true ORDER BY updated_at DESC',
        [userId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        token: row.token,
        platform: row.platform,
        deviceId: row.device_id,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      logger.error('Error getting user notification tokens:', error);
      throw error;
    }
  }

  /**
   * Get all active notification tokens (for broadcasting)
   */
  async getAllActiveTokens(): Promise<NotificationToken[]> {
    try {
      const result = await this.pool.query(
        'SELECT nt.*, u.email FROM notification_tokens nt JOIN users u ON nt.user_id = u.id WHERE nt.is_active = true ORDER BY nt.updated_at DESC'
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        token: row.token,
        platform: row.platform,
        deviceId: row.device_id,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      logger.error('Error getting all active notification tokens:', error);
      throw error;
    }
  }

  /**
   * Deactivate a notification token
   */
  async deactivateToken(token: string, userId: string): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE notification_tokens SET is_active = false, updated_at = NOW() WHERE token = $1 AND user_id = $2',
        [token, userId]
      );
      logger.info(`Deactivated notification token for user ${userId}`);
    } catch (error) {
      logger.error('Error deactivating notification token:', error);
      throw error;
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendToUser(notificationData: PushNotificationData): Promise<void> {
    try {
      if (!notificationData.userId && !notificationData.userEmail) {
        throw new Error('Either userId or userEmail must be provided');
      }

      let userId = notificationData.userId;
      
      // If userEmail is provided, get userId
      if (!userId && notificationData.userEmail) {
        const userResult = await this.pool.query(
          'SELECT id FROM users WHERE email = $1',
          [notificationData.userEmail]
        );
        
        if (userResult.rows.length === 0) {
          throw new Error(`User with email ${notificationData.userEmail} not found`);
        }
        
        userId = userResult.rows[0].id;
      }

      // Get user's notification tokens
      const tokens = await this.getUserTokens(userId!);
      
      if (tokens.length === 0) {
        logger.warn(`No active notification tokens found for user ${userId}`);
        // Still store the notification for when user gets a token
        await this.storeNotificationInDatabase(notificationData, userId || null);
        return;
      }

      // Store notification in database first
      await this.storeNotificationInDatabase(notificationData, userId || null);

      // Send notification to each token
      for (const token of tokens) {
        await this.sendPushNotification(token.token, notificationData);
      }

      logger.info(`Sent notification to user ${userId} (${tokens.length} tokens)`);
    } catch (error) {
      logger.error('Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Send push notification to all users
   */
  async sendToAll(notificationData: PushNotificationData): Promise<void> {
    try {
      const tokens = await this.getAllActiveTokens();
      
      if (tokens.length === 0) {
        logger.warn('No active notification tokens found');
        return;
      }

      // Store notification in database for all users
      await this.storeNotificationInDatabase(notificationData, null);

      // Send notification to each token
      for (const token of tokens) {
        await this.sendPushNotification(token.token, notificationData);
      }

      logger.info(`Sent notification to all users (${tokens.length} tokens)`);
    } catch (error) {
      logger.error('Error sending notification to all users:', error);
      throw error;
    }
  }

  /**
   * Send push notification using Expo Push API
   */
  private async sendPushNotification(token: string, notificationData: PushNotificationData): Promise<void> {
    try {
      // Check if this is a test token
      if (token.includes('test-dev-') || token.includes('expo-go-mock-')) {
       logger.info(`Test token detected: ${token.substring(0, 20)}... - Storing notification for polling`);
        logger.info(`Would send: "${notificationData.title}" - "${notificationData.body}"`);
        
        // For development, store the notification in database for polling
        await this.storeNotificationForPolling(token, notificationData);
        return;
      }

      // Prepare notification data
      let messageData = notificationData.data || {};
      
      if (notificationData.type === 'custom' && notificationData.customContent) {
        // Store custom content in database
        await this.storeCustomNotification(notificationData.customContent);
        
        messageData = {
          ...messageData,
          type: 'custom',
          customNotificationId: notificationData.customContent.id,
          notificationType: notificationData.customContent.type,
        };
        logger.info(`📱 Sending custom notification: ${notificationData.customContent.id} of type ${notificationData.customContent.type}`);
      }

      const message = {
        to: token,
        title: notificationData.title,
        body: notificationData.body,
        data: messageData,
        sound: 'default',
        badge: 1,
      };

      logger.info(`📤 Push notification message data:`, JSON.stringify(messageData, null, 2));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Expo Push API error: ${response.status} - ${errorData}`);
      }

      const result: any = await response.json();
      
      if (result.data && result.data[0] && result.data[0].status === 'error') {
        throw new Error(`Push notification failed: ${result.data[0].message}`);
      }

      logger.info(`Push notification sent successfully to token ${token.substring(0, 20)}...`);
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Get custom notification content by ID
   */
  async getCustomNotification(id: string): Promise<any> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM custom_notifications WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        body: row.body,
        type: row.type,
        content: row.content,
        author: row.author,
        imageUrl: row.image_url,
        actionButton: row.action_button_text ? {
          text: row.action_button_text,
          url: row.action_button_url,
          action: row.action_button_action
        } : undefined,
        tags: row.tags,
        publishedAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error('Error getting custom notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    usersWithTokens: number;
    platformBreakdown: { ios: number; android: number };
  }> {
    try {
      const [totalResult, activeResult, usersResult, platformResult] = await Promise.all([
        this.pool.query('SELECT COUNT(*) as count FROM notification_tokens'),
        this.pool.query('SELECT COUNT(*) as count FROM notification_tokens WHERE is_active = true'),
        this.pool.query('SELECT COUNT(DISTINCT user_id) as count FROM notification_tokens WHERE is_active = true'),
        this.pool.query('SELECT platform, COUNT(*) as count FROM notification_tokens WHERE is_active = true GROUP BY platform'),
      ]);

      const platformBreakdown = { ios: 0, android: 0 };
      platformResult.rows.forEach((row: any) => {
        platformBreakdown[row.platform as keyof typeof platformBreakdown] = parseInt(row.count);
      });

      return {
        totalTokens: parseInt(totalResult.rows[0].count),
        activeTokens: parseInt(activeResult.rows[0].count),
        usersWithTokens: parseInt(usersResult.rows[0].count),
        platformBreakdown,
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Store custom notification content in database
   */
  private async storeCustomNotification(customContent: any): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO custom_notifications (
          id, title, body, type, content, author, image_url,
          action_button_text, action_button_url, action_button_action, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          body = EXCLUDED.body,
          type = EXCLUDED.type,
          content = EXCLUDED.content,
          author = EXCLUDED.author,
          image_url = EXCLUDED.image_url,
          action_button_text = EXCLUDED.action_button_text,
          action_button_url = EXCLUDED.action_button_url,
          action_button_action = EXCLUDED.action_button_action,
          tags = EXCLUDED.tags,
          updated_at = CURRENT_TIMESTAMP
      `, [
        customContent.id,
        customContent.title || '', // Use title from custom content
        customContent.body || '', // Use body from custom content
        customContent.type,
        customContent.content,
        customContent.author,
        customContent.imageUrl,
        customContent.actionButton?.text,
        customContent.actionButton?.url,
        customContent.actionButton?.action,
        customContent.tags ? JSON.stringify(customContent.tags) : null
      ]);
      
      logger.info(`📝 Stored custom notification content: ${customContent.id}`);
    } catch (error) {
      logger.error('Error storing custom notification:', error);
      // Don't throw error to avoid breaking notification sending
    }
  }

  /**
   * Update custom notification with title and body
   */
  private async updateCustomNotificationTitleAndBody(id: string, title: string, body: string): Promise<void> {
    try {
      await this.pool.query(`
        UPDATE custom_notifications 
        SET title = $2, body = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id, title, body]);
      
      logger.info(`📝 Updated custom notification title/body: ${id}`);
    } catch (error) {
      logger.error('Error updating custom notification title/body:', error);
    }
  }

  /**
   * Store notification in database
   */
  private async storeNotificationInDatabase(notificationData: PushNotificationData, targetUserId: string | null): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO notifications (user_id, title, message, data, type, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'sent', NOW())
      `, [
        targetUserId,
        notificationData.title,
        notificationData.body,
        JSON.stringify(notificationData.data || {}),
        notificationData.data?.type || 'admin_notification'
      ]);
      
      // If this is a custom notification, update the custom notification with title and body
      if (notificationData.type === 'custom' && notificationData.customContent) {
        await this.updateCustomNotificationTitleAndBody(
          notificationData.customContent.id,
          notificationData.title,
          notificationData.body
        );
      }
      
      logger.info(`Notification stored in database for user ${targetUserId || 'all users'}: ${notificationData.title}`);
    } catch (error) {
      logger.error('Error storing notification in database:', error);
    }
  }

  /**
   * Store notification for polling (development mode)
   */
  private async storeNotificationForPolling(token: string, notificationData: PushNotificationData): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO notifications (target_token, title, body, data, status, created_at)
        VALUES ($1, $2, $3, $4, 'pending', NOW())
      `, [
        token,
        notificationData.title,
        notificationData.body,
        JSON.stringify(notificationData.data || {})
      ]);
      
      logger.info(`Notification stored for polling: ${notificationData.title}`);
    } catch (error) {
      logger.error('Error storing notification for polling:', error);
    }
  }

  /**
   * Get recent notifications (for mobile app polling)
   */
  async getRecentNotifications(minutesAgo: number = 5): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT id, title, message as body, data, user_id, target_token, created_at
        FROM notifications
        WHERE created_at >= NOW() - INTERVAL '${minutesAgo} minutes'
        ORDER BY created_at DESC
        LIMIT 10
      `);

      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        body: row.body,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        target_user_id: row.user_id,
        target_token: row.target_token,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('Error getting recent notifications:', error);
      return [];
    }
  }

  /**
   * Get pending notifications for a specific token (for polling)
   */
  async getPendingNotificationsForToken(token: string): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT id, title, body, data, created_at
        FROM notifications
        WHERE target_token = $1 
        AND status = 'pending'
        AND created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY created_at ASC
        LIMIT 1
      `, [token]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting pending notifications for token:', error);
      return [];
    }
  }

  /**
   * Mark notification as delivered
   */
  async markNotificationAsDelivered(notificationId: number): Promise<void> {
    try {
      await this.pool.query(`
        UPDATE notifications 
        SET status = 'delivered', delivered_at = NOW()
        WHERE id = $1
      `, [notificationId]);
    } catch (error) {
      logger.error('Error marking notification as delivered:', error);
    }
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT 
          n.id,
          n.title,
          n.message as body,
          n.data,
          n.type,
          n.status,
          n.created_at,
          n.read_at,
          n.user_id,
          CASE 
            WHEN n.read_at IS NOT NULL THEN true 
            ELSE false 
          END as read
        FROM notifications n
        WHERE n.user_id = $1 OR n.user_id IS NULL
        ORDER BY n.created_at DESC
        LIMIT 50
      `, [userId]);

      const notifications = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        body: row.body,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}),
        type: row.type,
        status: row.status,
        createdAt: row.created_at,
        readAt: row.read_at,
        read: row.read
      }));

      logger.info(`Retrieved ${notifications.length} notifications for user ${userId}`);
      return notifications;
    } catch (error: any) {
      logger.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Get notification history for admin panel
   */
  async getNotificationHistory(days: number = 7, limit: number = 20, offset: number = 0): Promise<{
    notifications: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Calculate the date threshold
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);
      
      // Get total count
      const countResult = await this.pool.query(`
        SELECT COUNT(*) as total
        FROM notifications
        WHERE created_at >= $1
      `, [daysAgo]);
      
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(offset / limit) + 1;

      // Get notifications with user info
      const result = await this.pool.query(`
        SELECT 
          n.id,
          n.title,
          n.body,
          n.message,
          n.data,
          n.type,
          n.status,
          n.created_at,
          n.read_at,
          n.updated_at,
          u.email as user_email,
          u.name
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.created_at >= $3
        ORDER BY n.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset, daysAgo]);

      const notifications = result.rows.map(row => {
        let parsedData = null;
        try {
          if (row.data) {
            parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          }
        } catch (e) {
          logger.warn('Failed to parse notification data:', e);
        }

        return {
          id: row.id,
          title: row.title,
          body: row.body || row.message,
          data: parsedData,
          type: row.type || 'info',
          status: row.status || 'unread',
          createdAt: row.created_at,
          sentAt: row.read_at, // Using read_at as proxy for sent_at since sent_at doesn't exist
          deliveredAt: row.updated_at, // Using updated_at as proxy for delivered_at
          readAt: row.read_at,
          targetUser: row.user_email ? {
            email: row.user_email,
            firstName: row.name?.split(' ')[0] || '',
            lastName: row.name?.split(' ').slice(1).join(' ') || ''
          } : null
        };
      });

      return {
        notifications,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting notification history:', error);
      throw error;
    }
  }

  /**
   * Clean up inactive tokens (older than 30 days)
   */
  async cleanupInactiveTokens(): Promise<number> {
    try {
      const result = await this.pool.query(
        'DELETE FROM notification_tokens WHERE is_active = false AND updated_at < NOW() - INTERVAL \'30 days\''
      );
      
      const deletedCount = result.rowCount || 0;
      logger.info(`Cleaned up ${deletedCount} inactive notification tokens`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up inactive tokens:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
