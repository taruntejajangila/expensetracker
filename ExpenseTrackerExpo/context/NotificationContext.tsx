import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  createdAt: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  registerForPushNotifications: () => Promise<string | null>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Configure notification behavior
  useEffect(() => {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (error) {
      console.warn('Notifications not available:', error);
    }
  }, []);

  // Register for push notifications
  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push notification token:', token);

      // Register token with backend
      await registerTokenWithBackend(token);

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  };

  // Register token with backend
  const registerTokenWithBackend = async (token: string) => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      const API_BASE_URL = 'http://192.168.29.14:5001/api';
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const deviceId = await AsyncStorage.getItem('deviceId') || 'unknown';

      const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform,
          deviceId,
        }),
      });

      if (response.ok) {
        console.log('Push notification token registered with backend');
      } else {
        console.error('Failed to register token with backend');
      }
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  };

  // Poll for new notifications
  const refreshNotifications = async () => {
    try {
      setIsLoading(true);
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      const API_BASE_URL = 'http://192.168.29.14:5001/api';
      const response = await fetch(`${API_BASE_URL}/notifications/poll`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.length);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Set up notification polling
  useEffect(() => {
    // Initial load
    refreshNotifications();

    // Poll every 30 seconds
    const interval = setInterval(refreshNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Listen for incoming notifications
  useEffect(() => {
    try {
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        // Refresh notifications when a new one is received
        refreshNotifications();
      });

      return () => subscription.remove();
    } catch (error) {
      console.warn('Could not set up notification listener:', error);
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    registerForPushNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
