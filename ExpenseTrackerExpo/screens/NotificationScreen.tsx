import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import NotificationNavigationService from '../services/NotificationNavigationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications, 
    isLoading 
  } = useNotifications();

  useEffect(() => {
    // Refresh notifications when screen loads
    refreshNotifications();
  }, []);

  const handleNotificationPress = async (notification: any) => {
    console.log('🔔 handleNotificationPress called with notification:', notification);
    console.log('🔔 Notification data:', notification.data);
    
    // Mark as read when pressed
    markAsRead(notification.id);
    
    // Handle notification data if available
    if (notification.data) {
      console.log('🔔 Processing notification data...');
      console.log('🔔 Data type:', notification.data.type);
      console.log('🔔 Custom notification ID:', notification.data.customNotificationId);
      
      // Check if it's a custom notification
      if (notification.data.type === 'custom' && notification.data.customNotificationId) {
        console.log('📱 Custom notification detected! Fetching full content...');
        console.log('📱 Custom notification ID:', notification.data.customNotificationId);
        
        try {
          // Fetch full custom notification content
          const authToken = await AsyncStorage.getItem('authToken');
          if (!authToken) {
            console.error('❌ No auth token available');
            return;
          }

          const API_BASE_URL = 'http://192.168.1.4:5000/api';
          const response = await fetch(`${API_BASE_URL}/notifications/custom/${notification.data.customNotificationId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const customData = await response.json();
            console.log('📱 Fetched custom notification content:', customData);
            
            // Navigate with full custom content
            const navigateAction = CommonActions.navigate({
              name: 'NotificationDetail',
              params: {
                notificationId: notification.data.customNotificationId,
                notification: {
                  id: customData.id || notification.data.customNotificationId,
                  title: customData.title || notification.title,
                  body: customData.body || notification.body,
                  type: customData.type || notification.data.notificationType || 'general',
                  publishedAt: customData.publishedAt || notification.createdAt,
                  author: customData.author || 'System',
                  content: customData.content || customData.body || notification.body,
                  actionButton: customData.actionButton,
                  tags: customData.tags,
                  imageUrl: customData.imageUrl
                }
              }
            });
            
            console.log('📱 Using CommonActions.navigate with full content');
            navigation.dispatch(navigateAction);
            console.log('✅ Navigation with full content completed');
          } else {
            console.error('❌ Failed to fetch custom content, using basic data');
            // Fallback to basic navigation
            const navigateAction = CommonActions.navigate({
              name: 'NotificationDetail',
              params: {
                notificationId: notification.data.customNotificationId,
                notification: {
                  id: notification.data.customNotificationId,
                  title: notification.title,
                  body: notification.body,
                  type: notification.data.notificationType || 'general',
                  publishedAt: notification.createdAt,
                  author: 'System',
                  content: notification.body,
                  actionButton: notification.data.actionButton,
                  tags: notification.data.tags
                }
              }
            });
            navigation.dispatch(navigateAction);
          }
        } catch (error) {
          console.error('❌ Error fetching custom content:', error);
          // Fallback to basic navigation
          const navigateAction = CommonActions.navigate({
            name: 'NotificationDetail',
            params: {
              notificationId: notification.data.customNotificationId,
              notification: {
                id: notification.data.customNotificationId,
                title: notification.title,
                body: notification.body,
                type: notification.data.notificationType || 'general',
                publishedAt: notification.createdAt,
                author: 'System',
                content: notification.body,
                actionButton: notification.data.actionButton,
                tags: notification.data.tags
              }
            }
          });
          navigation.dispatch(navigateAction);
        }
      } else if (notification.data.screen) {
        console.log('🔔 Regular notification with screen navigation');
        // Handle other notification types with screen navigation
        navigation.navigate(notification.data.screen as never);
      } else {
        console.log('🔔 No specific navigation for this notification type');
      }
    } else {
      console.log('🔔 No notification data available');
    }
  };

  const handleMarkAllRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark All Read', 
          onPress: markAllAsRead 
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} allowFontScaling={false}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationBody} allowFontScaling={false}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime} allowFontScaling={false}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999999" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle} allowFontScaling={false}>No Notifications</Text>
      <Text style={styles.emptyMessage} allowFontScaling={false}>
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  // Header Component
  const ScreenHeader: React.FC = () => {
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Notifications
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity 
                style={styles.markAllButton}
                onPress={handleMarkAllRead}
              >
                <Text style={styles.markAllText} allowFontScaling={false}>
                  Mark All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Safe Area */}
      <ScreenHeader />

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshNotifications}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Styles - Matching Account Screen
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  markAllText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FF',
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationScreen;
