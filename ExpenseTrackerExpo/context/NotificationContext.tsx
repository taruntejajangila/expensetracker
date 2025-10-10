import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import ApiClient from '../utils/ApiClient';
import { API_BASE_URL } from '../config/api.config';

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
  const isUserInteractingRef = useRef(false);

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
      if (!authToken) {
        console.log('🔕 Skipping token registration: no auth token');
        return;
      }

      const platform = Platform.OS;

      const response = await fetch(`${API_BASE_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform,
          deviceInfo: {
            brand: Platform.OS === 'ios' ? 'Apple' : 'Google',
            modelName: 'Unknown',
            osName: Platform.OS,
            osVersion: 'Unknown',
          },
        }),
      });

      if (response.ok) {
        console.log('✅ Push notification token registered with backend');
      } else {
        console.error('❌ Failed to register token with backend:', response.status);
      }
    } catch (error) {
      console.error('❌ Error registering token with backend:', error);
    }
  };

  // Fetch notifications from backend
  const refreshNotifications = async () => {
    try {
      console.log('🔄 refreshNotifications called - User interacting:', isUserInteractingRef.current);
      setIsLoading(true);

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('🔕 Skipping notifications fetch: no auth token');
        return;
      }

      const apiClient = ApiClient.getInstance();

      const result = await apiClient.get(`${API_BASE_URL}/notifications`);

      if (result.success && result.data) {
        setNotifications(result.data);
        const unreadNotifications = result.data.filter((n: any) => !n.read);
        setUnreadCount(unreadNotifications.length);
        console.log('✅ Notifications loaded:', result.data.length);
      } else {
        console.error('❌ Failed to fetch notifications:', result.message);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      console.log('🔔 markAsRead called for notification:', notificationId);

      // Set user interaction flag to prevent auto-refresh conflicts
      isUserInteractingRef.current = true;
      console.log('🔔 User interaction flag set to true');

      // Optimistically update the UI first
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      const apiClient = ApiClient.getInstance();

      const result = await apiClient.post(`${API_BASE_URL}/notifications/${notificationId}/read`);

      if (result.success) {
        console.log('✅ Notification marked as read successfully:', result);
        // Clear user interaction flag after a short delay
        setTimeout(() => {
          isUserInteractingRef.current = false;
          console.log('🔔 User interaction flag set to false');
        }, 1000);
      } else {
        // Revert the optimistic update if the API call failed
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, read: false }
              : notif
          )
        );
        setUnreadCount(prev => prev + 1);
        isUserInteractingRef.current = false;
        const errorResult = await response.json();
        console.error('❌ Failed to mark notification as read:', errorResult);
      }
    } catch (error) {
      // Revert the optimistic update if there was an error
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read: false }
            : notif
        )
      );
      setUnreadCount(prev => prev + 1);
      isUserInteractingRef.current = false;
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      console.log('🔔 markAllAsRead called');

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('🔕 Skipping mark all as read: no auth token');
        return;
      }

      const apiClient = ApiClient.getInstance();

      const result = await apiClient.post(`${API_BASE_URL}/notifications/mark-all-read`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ All notifications marked as read:', data.data.updatedCount);

        // Update local state
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      } else {
        console.error('❌ Failed to mark all notifications as read:', response.status);
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  // Set up notification polling
  useEffect(() => {
    // Initial load
    refreshNotifications();

    // Poll every 2 minutes (reduced from 30 seconds to prevent race conditions)
    const interval = setInterval(() => {
      // Only auto-refresh if user is not currently interacting
      console.log('⏰ Auto-refresh interval triggered - User interacting:', isUserInteractingRef.current);
      if (!isUserInteractingRef.current) {
        console.log('⏰ Auto-refresh proceeding');
        refreshNotifications();
      } else {
        console.log('⏰ Auto-refresh skipped due to user interaction');
      }
    }, 120000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - interval is created once and never recreated

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
