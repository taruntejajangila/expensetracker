import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationTesterProps {
  onClose?: () => void;
}

const NotificationTester: React.FC<NotificationTesterProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const testDailyNotification = async () => {
    setIsLoading(true);
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

      // Schedule evening notification to trigger in 3 seconds
      const eveningId = await Notifications.scheduleNotificationAsync({
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
        trigger: { seconds: 3 },
      });

      // Schedule morning notification to trigger in 6 seconds
      const morningId = await Notifications.scheduleNotificationAsync({
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
        trigger: { seconds: 6 },
      });

      console.log('✅ Test notifications scheduled:', { eveningId, morningId });
      Alert.alert(
        'Test Notifications Scheduled', 
        'The daily 8PM notification will appear in 3 seconds, and morning reminder in 6 seconds. Check your notification panel!',
        [{ text: 'OK' }]
      );

      await updateScheduledCount();

    } catch (error) {
      console.error('❌ Error testing daily notification:', error);
      Alert.alert('Error', 'Failed to test notification: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showImmediateNotification = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const updateScheduledCount = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledCount(notifications.length);
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
    }
  };

  const cancelTestNotifications = async () => {
    setIsLoading(true);
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
      Alert.alert('Success', `Cancelled ${cancelled} test notifications`);
      await updateScheduledCount();

    } catch (error) {
      console.error('❌ Error cancelling test notifications:', error);
      Alert.alert('Error', 'Failed to cancel notifications: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const viewScheduledNotifications = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Scheduled Notifications:', notifications);
      
      const notificationList = notifications.map((n, index) => 
        `• ${n.content.title} (${n.content.data?.reminderType || 'unknown'})`
      ).join('\n');

      Alert.alert(
        'Scheduled Notifications',
        notifications.length > 0 
          ? `Found ${notifications.length} scheduled notifications:\n\n${notificationList}`
          : 'No notifications scheduled',
        [{ text: 'OK' }]
      );

      setScheduledCount(notifications.length);
    } catch (error) {
      console.error('❌ Error viewing scheduled notifications:', error);
      Alert.alert('Error', 'Failed to view notifications: ' + error.message);
    }
  };

  React.useEffect(() => {
    updateScheduledCount();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Daily Notification Tester</Text>
        <Text style={styles.subtitle}>Test the daily 8PM reminder system</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Test Daily Notifications</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={testDailyNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Testing...' : '🚀 Test 8PM & 9AM Notifications'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={showImmediateNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Sending...' : '⚡ Show Immediate Notification'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Manage Notifications</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.infoButton]} 
          onPress={viewScheduledNotifications}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            📋 View Scheduled ({scheduledCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={cancelTestNotifications}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Cancelling...' : '🗑️ Cancel Test Notifications'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📱 How to Test:</Text>
          <Text style={styles.infoText}>
            1. Tap "Test 8PM & 9AM Notifications"{'\n'}
            2. Wait 3 seconds for evening reminder{'\n'}
            3. Wait 6 seconds for morning reminder{'\n'}
            4. Check your device's notification panel
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔍 What You'll See:</Text>
          <Text style={styles.infoText}>
            • Evening: "🔔 Reminder: Log Today's Expenses"{'\n'}
            • Morning: "🌅 Morning Check: Log Yesterday's Expenses"
          </Text>
        </View>

        {onClose && (
          <TouchableOpacity 
            style={[styles.button, styles.closeButton]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>✖️ Close Tester</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#FF9800',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  warningButton: {
    backgroundColor: '#F44336',
  },
  closeButton: {
    backgroundColor: '#9E9E9E',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default NotificationTester;

