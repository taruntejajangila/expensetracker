/**
 * Test script to trigger the daily 8PM notification immediately
 * This allows us to see the notification without waiting until 8PM
 */

import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Test function to trigger the daily 8PM notification immediately
 */
export const testDailyNotification = async () => {
  try {
    console.log('🔔 Testing Daily 8PM Notification...');
    
    // Request permissions first
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Notification permission is required to test notifications');
      return;
    }

    // Cancel any existing test notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'daily_spending_reminder' || 
          notification.content.data?.test === true) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    // Schedule notification to trigger in 3 seconds
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Reminder: Log Today's Expenses",
        body: "Tap here to add what you spent today.",
        data: { 
          type: 'daily_spending_reminder',
          reminderType: 'evening',
          action: 'add_transaction',
          test: true // Mark as test notification
        },
        sound: 'default',
      },
      trigger: { seconds: 3 }, // Trigger in 3 seconds
    });

    console.log('✅ Test notification scheduled with ID:', notificationId);
    Alert.alert(
      'Test Notification Scheduled', 
      'The daily 8PM notification will appear in 3 seconds. Check your notification panel!',
      [{ text: 'OK' }]
    );

    // Also schedule the morning reminder test
    const morningNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌅 Morning Check: Log Yesterday's Expenses",
        body: "Did you forget to log any expenses from yesterday?",
        data: { 
          type: 'daily_spending_reminder',
          reminderType: 'morning',
          action: 'add_transaction',
          test: true
        },
        sound: 'default',
      },
      trigger: { seconds: 6 }, // Trigger in 6 seconds
    });

    console.log('✅ Morning test notification scheduled with ID:', morningNotificationId);

    return {
      eveningNotificationId: notificationId,
      morningNotificationId: morningNotificationId
    };

  } catch (error) {
    console.error('❌ Error testing daily notification:', error);
    Alert.alert('Error', 'Failed to test notification: ' + error.message);
    return null;
  }
};

/**
 * Test function to show immediate notification (no delay)
 */
export const showImmediateNotification = async () => {
  try {
    console.log('🔔 Showing Immediate Daily Notification...');
    
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Notification permission is required');
      return;
    }

    // Show immediate notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Reminder: Log Today's Expenses",
        body: "Tap here to add what you spent today.",
        data: { 
          type: 'daily_spending_reminder',
          reminderType: 'evening',
          action: 'add_transaction',
          test: true
        },
        sound: 'default',
      },
      trigger: null, // Immediate
    });

    console.log('✅ Immediate notification sent!');
    Alert.alert('Success', 'Daily notification sent immediately!');

  } catch (error) {
    console.error('❌ Error showing immediate notification:', error);
    Alert.alert('Error', 'Failed to show notification: ' + error.message);
  }
};

/**
 * Get all scheduled notifications for debugging
 */
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Scheduled Notifications:', notifications);
    return notifications;
  } catch (error) {
    console.error('❌ Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Cancel all test notifications
 */
export const cancelTestNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    let cancelled = 0;
    
    for (const notification of notifications) {
      if (notification.content.data?.test === true) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        cancelled++;
      }
    }
    
    console.log(`✅ Cancelled ${cancelled} test notifications`);
    return cancelled;
  } catch (error) {
    console.error('❌ Error cancelling test notifications:', error);
    return 0;
  }
};

// Export all functions for use in the app
export default {
  testDailyNotification,
  showImmediateNotification,
  getScheduledNotifications,
  cancelTestNotifications
};
