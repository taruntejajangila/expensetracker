import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface CustomNotificationData {
  id: string;
  title: string;
  body: string;
  type: 'announcement' | 'blog_post' | 'update' | 'promotion' | 'general';
  content?: string;
  publishedAt?: string;
  author?: string;
  imageUrl?: string;
  actionButton?: {
    text: string;
    url?: string;
    action?: string;
  };
  tags?: string[];
}

class NotificationNavigationService {
  private static instance: NotificationNavigationService;
  private navigationRef: any = null;
  private pendingNotification: CustomNotificationData | null = null;

  static getInstance(): NotificationNavigationService {
    if (!NotificationNavigationService.instance) {
      NotificationNavigationService.instance = new NotificationNavigationService();
    }
    return NotificationNavigationService.instance;
  }

  // Set navigation reference (call this from App.js)
  setNavigationRef(ref: any) {
    this.navigationRef = ref;
  }

  // Handle notification response
  async handleNotificationResponse(response: Notifications.NotificationResponse) {
    console.log('🔔 NotificationNavigationService: Handling notification response');
    console.log('📱 Notification content:', response.notification.request.content);
    console.log('📱 Notification data:', response.notification.request.content.data);

    const notificationData = response.notification.request.content.data;
    
    // Handle support ticket reply notifications
    if (notificationData && notificationData.type === 'support_ticket_reply') {
      console.log('🎫 Support ticket reply notification detected');
      console.log('🎫 Ticket ID:', notificationData.ticketId);
      
      // Navigate to ticket detail screen
      if (notificationData.ticketId) {
        this.navigateToTicketDetail(notificationData.ticketId);
      }
      return;
    }
    
    if (notificationData && notificationData.type === 'custom' && notificationData.customNotificationId) {
      console.log('📱 Custom notification detected');
      console.log('📱 Custom notification ID:', notificationData.customNotificationId);
      console.log('📱 Notification type:', notificationData.notificationType);
      
      // Fetch the full custom notification content from the API
      try {
        const fullCustomContent = await this.fetchCustomNotificationContent(notificationData.customNotificationId);
        
        if (fullCustomContent) {
          const customNotificationData: CustomNotificationData = {
            id: fullCustomContent.id,
            title: fullCustomContent.title,
            body: fullCustomContent.body,
            type: fullCustomContent.type,
            content: fullCustomContent.content,
            publishedAt: fullCustomContent.publishedAt,
            author: fullCustomContent.author,
            imageUrl: fullCustomContent.imageUrl,
            actionButton: fullCustomContent.actionButton,
            tags: fullCustomContent.tags,
          };
          
          console.log('📱 Fetched full custom notification content:', customNotificationData);
          
          // Store the notification data
          await this.storePendingNotification(customNotificationData);

          // Navigate to detail screen if navigation is available
          if (this.navigationRef) {
            console.log('🧭 Navigation ref available, navigating to detail screen');
            this.navigateToDetailScreen(customNotificationData);
          } else {
            console.log('⏳ Navigation not ready, notification stored for later');
            console.log('⏳ Navigation ref:', this.navigationRef);
          }
        } else {
          console.log('❌ Failed to fetch custom notification content');
          // Fallback to basic notification data
          const fallbackData: CustomNotificationData = {
            id: notificationData.customNotificationId,
            title: response.notification.request.content.title,
            body: response.notification.request.content.body,
            type: notificationData.notificationType || 'general',
            content: 'Content could not be loaded. Please try again later.',
            publishedAt: new Date().toISOString(),
            author: 'System',
          };
          
          await this.storePendingNotification(fallbackData);
          if (this.navigationRef) {
            this.navigateToDetailScreen(fallbackData);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching custom notification content:', error);
        // Fallback to basic notification data
        const fallbackData: CustomNotificationData = {
          id: notificationData.customNotificationId,
          title: response.notification.request.content.title,
          body: response.notification.request.content.body,
          type: notificationData.notificationType || 'general',
          content: 'Content could not be loaded. Please try again later.',
          publishedAt: new Date().toISOString(),
          author: 'System',
        };
        
        await this.storePendingNotification(fallbackData);
        if (this.navigationRef) {
          this.navigateToDetailScreen(fallbackData);
        }
      }
    } else {
      console.log('🔔 Simple notification - handling normally');
      // Handle simple notifications (existing logic)
    }
  }

  // Store pending notification
  private async storePendingNotification(notification: CustomNotificationData) {
    try {
      await AsyncStorage.setItem('pendingNotification', JSON.stringify(notification));
      this.pendingNotification = notification;
      console.log('💾 Notification stored for navigation');
    } catch (error) {
      console.error('❌ Error storing notification:', error);
    }
  }

  // Get pending notification
  async getPendingNotification(): Promise<CustomNotificationData | null> {
    if (this.pendingNotification) {
      return this.pendingNotification;
    }

    try {
      const stored = await AsyncStorage.getItem('pendingNotification');
      if (stored) {
        this.pendingNotification = JSON.parse(stored);
        return this.pendingNotification;
      }
    } catch (error) {
      console.error('❌ Error retrieving notification:', error);
    }
    
    return null;
  }

  // Clear pending notification
  async clearPendingNotification() {
    try {
      await AsyncStorage.removeItem('pendingNotification');
      this.pendingNotification = null;
      console.log('🗑️ Pending notification cleared');
    } catch (error) {
      console.error('❌ Error clearing notification:', error);
    }
  }

  // Fetch custom notification content from API
  private async fetchCustomNotificationContent(id: string): Promise<any> {
    try {
      console.log('📡 Fetching custom notification content for ID:', id);
      
      // Get auth token
      const authToken = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`http://192.168.1.4:5000/api/notifications/custom/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch custom notification:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Successfully fetched custom notification content');
        return result.data;
      } else {
        console.error('❌ Invalid response format:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching custom notification content:', error);
      return null;
    }
  }

  // Navigate to detail screen
  public navigateToDetailScreen(notification: CustomNotificationData) {
    if (this.navigationRef) {
      console.log('🧭 Navigating to NotificationDetail screen with data:', notification);
      try {
        this.navigationRef.navigate('NotificationDetail', {
          notificationId: notification.id,
          notification: notification
        });
        console.log('✅ Navigation call completed');
        
        // Clear the pending notification since we're navigating
        this.clearPendingNotification();
      } catch (error) {
        console.error('❌ Navigation error:', error);
      }
    } else {
      console.log('❌ Navigation ref not available');
    }
  }

  // Navigate to support ticket detail screen
  public navigateToTicketDetail(ticketId: string) {
    if (this.navigationRef) {
      console.log('🎫 Navigating to Ticket Detail screen:', ticketId);
      try {
        // Add a timestamp to force re-render even if on same screen
        this.navigationRef.navigate('TicketDetail', {
          ticketId: ticketId,
          refresh: Date.now() // Force refresh param
        });
        console.log('✅ Ticket navigation completed');
      } catch (error) {
        console.error('❌ Ticket navigation error:', error);
      }
    } else {
      console.log('❌ Navigation ref not available for ticket');
    }
  }

  // Check for pending notifications when app starts
  async checkPendingNotification() {
    const pending = await this.getPendingNotification();
    if (pending && this.navigationRef) {
      console.log('🔄 Found pending notification, navigating...');
      this.navigateToDetailScreen(pending);
    }
    return pending;
  }

  // Simulate notification for testing
  async simulateCustomNotification() {
    const testNotification: CustomNotificationData = {
      id: 'test-notification-' + Date.now(),
      title: '🚀 Test Custom Notification',
      body: 'This is a test notification with custom content',
      type: 'update',
      content: `# Test Custom Notification

This is a test notification to verify that the custom notification system is working properly.

## Features Being Tested:
- Custom notification detection
- Navigation to detail screen
- Content display
- Action buttons

## Test Data:
- ID: ${Date.now()}
- Type: Update
- Content: This test message

Thank you for testing!`,
      author: 'Test Team',
      actionButton: {
        text: 'Test Action',
        action: 'test_action'
      },
      tags: ['test', 'notification', 'custom']
    };

    await this.storePendingNotification(testNotification);
    
    if (this.navigationRef) {
      this.navigateToDetailScreen(testNotification);
    } else {
      console.log('⏳ Navigation not ready, test notification stored');
    }
  }
}

export default NotificationNavigationService;
