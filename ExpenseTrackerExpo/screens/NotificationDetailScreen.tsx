import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// Enhanced Markdown Renderer Component with comprehensive styling
const SimpleMarkdownRenderer: React.FC<{ content: string; theme: any }> = ({ content, theme }) => {
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          elements.push(
            <View key={key++} style={[styles.codeBlock, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.codeBlockText, { color: theme.colors.text }]}>
                {codeBlockContent.join('\n')}
              </Text>
            </View>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Start code block
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Skip empty lines
      if (line.trim() === '') {
        elements.push(<View key={key++} style={{ height: 8 }} />);
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <Text key={key++} style={[styles.markdownH1, { color: theme.colors.text }]}>
            {processInlineFormatting(line.substring(2), theme)}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Text key={key++} style={[styles.markdownH2, { color: theme.colors.text }]}>
            {processInlineFormatting(line.substring(3), theme)}
          </Text>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <Text key={key++} style={[styles.markdownH3, { color: theme.colors.text }]}>
            {processInlineFormatting(line.substring(4), theme)}
          </Text>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <Text key={key++} style={[styles.markdownH4, { color: theme.colors.text }]}>
            {processInlineFormatting(line.substring(5), theme)}
          </Text>
        );
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        elements.push(
          <View key={key++} style={[styles.blockquote, { borderLeftColor: theme.colors.primary }]}>
            <Text style={[styles.blockquoteText, { color: theme.colors.text }]}>
              {processInlineFormatting(line.substring(2), theme)}
            </Text>
          </View>
        );
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <View key={key++} style={styles.listItem}>
            <Text style={[styles.bulletPoint, { color: theme.colors.primary }]}>•</Text>
            <Text style={[styles.listText, { color: theme.colors.text }]}>
              {processInlineFormatting(line.substring(2), theme)}
            </Text>
          </View>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.+)/);
        if (match) {
          elements.push(
            <View key={key++} style={styles.listItem}>
              <Text style={[styles.numberPoint, { color: theme.colors.primary }]}>{match[1]}.</Text>
              <Text style={[styles.listText, { color: theme.colors.text }]}>
                {processInlineFormatting(match[2], theme)}
              </Text>
            </View>
          );
        }
      }
      // Horizontal rule
      else if (line.startsWith('---') || line.startsWith('***')) {
        elements.push(
          <View key={key++} style={[styles.hr, { backgroundColor: theme.colors.border }]} />
        );
      }
      // Regular paragraph
      else {
        elements.push(
          <Text key={key++} style={[styles.markdownParagraph, { color: theme.colors.text }]}>
            {processInlineFormatting(line, theme)}
          </Text>
        );
      }
    }

    return elements;
  };

  const processInlineFormatting = (text: string, theme: any) => {
    // Split by various formatting patterns
    const patterns = [
      { regex: /(\*\*\*.*?\*\*\*)/g, type: 'bolditalic' },
      { regex: /(\*\*.*?\*\*)/g, type: 'bold' },
      { regex: /(\*.*?\*)/g, type: 'italic' },
      { regex: /(`.*?`)/g, type: 'code' },
      { regex: /(~~.*?~~)/g, type: 'strikethrough' },
      { regex: /(==.*?==)/g, type: 'highlight' },
      { regex: /(\[.*?\]\(.*?\))/g, type: 'link' },
      { regex: /(https?:\/\/[^\s]+)/g, type: 'url' },
    ];

    let processedText = text;
    const parts: Array<{ text: string; type: string; start: number; end: number }> = [];

    // Find all matches
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        parts.push({
          text: match[1],
          type: pattern.type,
          start: match.index,
          end: match.index + match[1].length
        });
      }
    });

    // Sort by start position
    parts.sort((a, b) => a.start - b.start);

    // Remove overlapping parts (keep the first one)
    const filteredParts = [];
    let lastEnd = 0;
    parts.forEach(part => {
      if (part.start >= lastEnd) {
        filteredParts.push(part);
        lastEnd = part.end;
      }
    });

    // Build the result
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    filteredParts.forEach((part, index) => {
      // Add text before this part
      if (part.start > lastIndex) {
        result.push(text.slice(lastIndex, part.start));
      }

      // Add the formatted part
      const content = part.text;
      switch (part.type) {
        case 'bolditalic':
          result.push(
            <Text key={`bolditalic-${index}`} style={[styles.boldItalic, { color: theme.colors.text }]}>
              {content.slice(3, -3)}
            </Text>
          );
          break;
        case 'bold':
          result.push(
            <Text key={`bold-${index}`} style={[styles.bold, { color: theme.colors.text }]}>
              {content.slice(2, -2)}
            </Text>
          );
          break;
        case 'italic':
          result.push(
            <Text key={`italic-${index}`} style={[styles.italic, { color: theme.colors.text }]}>
              {content.slice(1, -1)}
            </Text>
          );
          break;
        case 'code':
          result.push(
            <Text key={`code-${index}`} style={[styles.inlineCode, { 
              backgroundColor: theme.colors.background,
              color: theme.colors.text 
            }]}>
              {content.slice(1, -1)}
            </Text>
          );
          break;
        case 'strikethrough':
          result.push(
            <Text key={`strike-${index}`} style={[styles.strikethrough, { color: theme.colors.text }]}>
              {content.slice(2, -2)}
            </Text>
          );
          break;
        case 'highlight':
          result.push(
            <Text key={`highlight-${index}`} style={[styles.highlight, { 
              backgroundColor: theme.colors.primary + '20',
              color: theme.colors.text 
            }]}>
              {content.slice(2, -2)}
            </Text>
          );
          break;
        case 'link':
          const linkMatch = content.match(/\[(.*?)\]\((.*?)\)/);
          if (linkMatch) {
            result.push(
              <Text 
                key={`link-${index}`} 
                style={[styles.link, { color: theme.colors.primary }]}
                onPress={() => Linking.openURL(linkMatch[2])}
              >
                {linkMatch[1]}
              </Text>
            );
          }
          break;
        case 'url':
          result.push(
            <Text 
              key={`url-${index}`} 
              style={[styles.link, { color: theme.colors.primary }]}
              onPress={() => Linking.openURL(content)}
            >
              {content}
            </Text>
          );
          break;
        default:
          result.push(content);
      }

      lastIndex = part.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result.length > 0 ? result : text;
  };

  return (
    <View>
      {renderContent(content)}
    </View>
  );
};

interface NotificationDetail {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'blog_post' | 'update' | 'promotion' | 'general';
  publishedAt: string;
  author?: string;
  imageUrl?: string;
  actionButton?: {
    text: string;
    url?: string;
    action?: string;
  };
  tags?: string[];
}

type RootStackParamList = {
  NotificationDetail: {
    notificationId: string;
    notification?: NotificationDetail;
  };
};

type NotificationDetailScreenRouteProp = RouteProp<RootStackParamList, 'NotificationDetail'>;
type NotificationDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NotificationDetail'>;

const NotificationDetailScreen: React.FC = () => {
  const navigation = useNavigation<NotificationDetailScreenNavigationProp>();
  const route = useRoute<NotificationDetailScreenRouteProp>();
  const { notificationId, notification } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Map custom notification data to NotificationDetail format
  const mapCustomNotificationData = (customData: any): NotificationDetail => {
    return {
      id: customData.id,
      title: customData.title,
      content: customData.content || customData.body || 'No content available',
      type: customData.type || 'general',
      publishedAt: customData.publishedAt || new Date().toISOString(),
      author: customData.author,
      imageUrl: customData.imageUrl,
      actionButton: customData.actionButton,
      tags: customData.tags,
    };
  };

  const [notificationDetail, setNotificationDetail] = useState<NotificationDetail | null>(
    notification ? mapCustomNotificationData(notification) : null
  );

  // Debug logging
  useEffect(() => {
    console.log('🔍 NotificationDetailScreen: Received notification data:', notification);
    console.log('🔍 NotificationDetailScreen: Mapped notification detail:', notificationDetail);
  }, [notification, notificationDetail]);
  const [loading, setLoading] = useState(!notification);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notification) {
      fetchNotificationDetail();
    }
  }, [notificationId]);

  const fetchNotificationDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll create a mock notification detail
      // In a real app, you'd fetch this from your backend API
      const mockNotification: NotificationDetail = {
        id: notificationId,
        title: "Important App Update - New Features Available!",
        content: `
We're excited to announce several new features in our latest app update:

## 🎉 New Features

### 1. Enhanced Budget Tracking
- Set monthly budgets for different categories
- Visual progress indicators
- Smart alerts when approaching limits
- Budget vs actual spending comparisons

### 2. Improved Analytics
- Weekly and monthly spending trends
- Category-wise expense breakdowns
- Interactive charts and graphs
- Export data to CSV format

### 3. Smart Notifications
- Customizable reminder settings
- Bill payment alerts
- Spending threshold notifications
- Weekly spending summaries

### 4. Better User Experience
- Dark mode support
- Improved navigation
- Faster app performance
- Enhanced security features

## 🔧 Bug Fixes
- Fixed transaction synchronization issues
- Resolved login problems on some devices
- Improved offline functionality
- Enhanced data backup reliability

## 📱 How to Update
Simply visit your app store and tap "Update" to get the latest version. The update is free and includes all these improvements.

## 💡 Pro Tips
- Enable notifications to get the most out of the new features
- Set up your budgets early in the month for better tracking
- Use the new analytics to identify spending patterns

Thank you for using our app! We're committed to continuously improving your experience.

Best regards,
The Expense Tracker Team
        `,
        type: 'update',
        publishedAt: new Date().toISOString(),
        author: 'Expense Tracker Team',
        imageUrl: 'https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=App+Update',
        actionButton: {
          text: 'Update App',
          action: 'open_app_store'
        },
        tags: ['update', 'features', 'improvements']
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNotificationDetail(mapCustomNotificationData(mockNotification));
    } catch (err) {
      console.error('Error fetching notification detail:', err);
      setError('Failed to load notification details');
    } finally {
      setLoading(false);
    }
  };

  const handleActionButton = async () => {
    if (!notificationDetail?.actionButton) return;

    const { action, url } = notificationDetail.actionButton;

    try {
      switch (action) {
        case 'open_app_store':
          Alert.alert(
            'Update App',
            'Would you like to visit the app store to update?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Store', 
                onPress: async () => {
                  try {
                    // Try to open the app store URL
                    const appStoreUrl = Platform.OS === 'ios' 
                      ? 'https://apps.apple.com/app/your-app-id' 
                      : 'https://play.google.com/store/apps/details?id=your.package.name';
                    await Linking.openURL(appStoreUrl);
                  } catch (error) {
                    console.error('Error opening app store:', error);
                    Alert.alert('Error', 'Could not open app store');
                  }
                }
              }
            ]
          );
          break;
        case 'open_website':
        case 'open_url':
        default:
          if (url) {
            // For better UX, you can choose to open directly or show confirmation
            // Uncomment the line below to open directly without confirmation:
            // await openUrlDirectly(url);
            
            // Current implementation with confirmation:
            Alert.alert(
              'Open Link',
              `Would you like to open this link?\n\n${url}`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open', 
                  onPress: async () => {
                    await openUrlDirectly(url);
                  }
                }
              ]
            );
          } else {
            Alert.alert('No Action', 'No URL or action specified for this button');
          }
          break;
      }
    } catch (error) {
      console.error('Error handling action button:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  // Helper function to open URL directly
  const openUrlDirectly = async (url: string) => {
    try {
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        console.log('✅ Successfully opened URL:', url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Could not open the link');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return '#EF4444';
      case 'blog_post': return '#3B82F6';
      case 'update': return '#10B981';
      case 'promotion': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return 'megaphone-outline';
      case 'blog_post': return 'document-text-outline';
      case 'update': return 'refresh-outline';
      case 'promotion': return 'gift-outline';
      default: return 'notifications-outline';
    }
  };

  // Header Component - Matching other screens
  const ScreenHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Notification Details
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              View notification information
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* Empty right section for layout balance */}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader theme={theme} insets={insets} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading notification...</Text>
        </View>
      </View>
    );
  }

  if (error || !notificationDetail) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader theme={theme} insets={insets} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{error || 'Notification not found'}</Text>
          <TouchableOpacity
            onPress={fetchNotificationDetail}
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader theme={theme} insets={insets} />

      <ScrollView style={[styles.content, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={[styles.notificationHeader, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.typeIndicator}>
            <Ionicons 
              name={getTypeIcon(notificationDetail.type)} 
              size={16} 
              color={getTypeColor(notificationDetail.type)} 
            />
            <Text style={[styles.typeText, { color: getTypeColor(notificationDetail.type) }]}>
              {notificationDetail.type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {notificationDetail.title || 'No Title Available'}
          </Text>
          
          <View style={styles.metaInfo}>
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
              {formatDate(notificationDetail.publishedAt)}
            </Text>
            {notificationDetail.author && (
              <Text style={[styles.authorText, { color: theme.colors.textSecondary }]}>
                by {notificationDetail.author}
              </Text>
            )}
          </View>

          {notificationDetail.tags && notificationDetail.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {notificationDetail.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Image Section */}
        {notificationDetail.imageUrl && (
          <View style={styles.imageContainer}>
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={48} color="#D1D5DB" />
              <Text style={[styles.imagePlaceholderText, { color: theme.colors.textSecondary }]}>Image</Text>
            </View>
          </View>
        )}

        {/* Content Section */}
        <View style={[styles.contentSection, { backgroundColor: theme.colors.surface }]}>
          <SimpleMarkdownRenderer 
            content={notificationDetail.content ? notificationDetail.content.trim() : notificationDetail.title}
            theme={theme}
          />
        </View>

        {/* Action Button */}
        {notificationDetail.actionButton && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={handleActionButton}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>
                {notificationDetail.actionButton.text}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  notificationHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
  },
  authorText: {
    fontSize: 14,
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  placeholderImage: {
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Enhanced Markdown styles
  markdownH1: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 12,
    lineHeight: 36,
  },
  markdownH2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 10,
    lineHeight: 32,
  },
  markdownH3: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    lineHeight: 28,
  },
  markdownH4: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 6,
    lineHeight: 24,
  },
  markdownParagraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  // List styles
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
    fontWeight: 'bold',
  },
  numberPoint: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
    fontWeight: 'bold',
    minWidth: 20,
  },
  listText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  // Inline formatting styles
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  boldItalic: {
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  highlight: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  // Block styles
  codeBlock: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  blockquote: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginLeft: 0,
    marginVertical: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  blockquoteText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  hr: {
    height: 2,
    marginVertical: 20,
    borderRadius: 1,
  },
  actionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default NotificationDetailScreen;
