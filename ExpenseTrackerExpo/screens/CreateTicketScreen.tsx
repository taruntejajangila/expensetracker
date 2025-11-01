import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import ApiClient from '../utils/ApiClient';
import { API_BASE_URL } from '../config/api.config';

const CreateTicketScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);

  // Get prefill params from navigation (if any)
  const params = route.params as { prefillCategory?: string; prefillSubject?: string } | undefined;

  const [formData, setFormData] = useState({
    subject: params?.prefillSubject || '',
    description: '',
    category: params?.prefillCategory || '',
    priority: 'medium'
  });

  const [attachments, setAttachments] = useState<any[]>([]);

  const categories = [
    { value: 'account', label: 'Account Issues', icon: 'person-outline' },
    { value: 'transaction', label: 'Transaction Problems', icon: 'swap-horizontal-outline' },
    { value: 'budget', label: 'Budget & Goals', icon: 'pie-chart-outline' },
    { value: 'technical', label: 'Technical Issue', icon: 'bug-outline' },
    { value: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
    { value: 'other', label: 'Other', icon: 'help-circle-outline' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#34C759' },
    { value: 'medium', label: 'Medium', color: '#FF9500' },
    { value: 'high', label: 'High', color: '#FF3B30' },
    { value: 'urgent', label: 'Urgent', color: '#AF52DE' },
  ];

  const testTickets = [
    {
      subject: 'App crashes when adding transaction',
      description: 'The app suddenly closes when I try to add a new transaction with a large amount. This happens consistently on iOS.',
      category: 'technical',
      priority: 'high'
    },
    {
      subject: 'Unable to login to my account',
      description: 'I keep getting "Invalid credentials" error even though I\'m sure my password is correct. I tried resetting it but didn\'t receive the email.',
      category: 'account',
      priority: 'urgent'
    },
    {
      subject: 'Request: Dark mode feature',
      description: 'It would be great if the app had a dark mode option. The current bright theme is hard on the eyes at night.',
      category: 'feature',
      priority: 'low'
    },
    {
      subject: 'Transactions not syncing properly',
      description: 'I added several transactions yesterday but they\'re not showing up on my other device. The sync seems to be broken.',
      category: 'transaction',
      priority: 'medium'
    },
    {
      subject: 'Budget goals not calculating correctly',
      description: 'My monthly budget shows I\'ve spent more than I actually have. The calculations seem off by about 20%.',
      category: 'budget',
      priority: 'high'
    }
  ];

  const handleAutoFill = () => {
    const randomTicket = testTickets[Math.floor(Math.random() * testTickets.length)];
    setFormData(randomTicket);
    Alert.alert('Auto-Fill', 'Form filled with test data!');
  };

  const pickImage = async () => {
    try {
      if (attachments.length >= 5) {
        Alert.alert('Limit Reached', 'You can upload maximum 5 attachments per ticket.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Camera roll access is needed to upload screenshots. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const remainingSlots = 5 - attachments.length;
        const assetsToAdd = result.assets.slice(0, remainingSlots);
        
        if (result.assets.length > remainingSlots) {
          Alert.alert(
            'Too Many Files',
            `You can only add ${remainingSlots} more attachment(s). Only the first ${remainingSlots} will be added.`
          );
        }

        const newAttachments = assetsToAdd.map(asset => ({
          uri: asset.uri,
          type: 'image',
          name: asset.uri.split('/').pop() || 'image.jpg',
          base64: asset.base64,
        }));
        
        setAttachments([...attachments, ...newAttachments]);
        Alert.alert('Success', `${newAttachments.length} image(s) added successfully!`);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Upload Error', error.message || 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      if (attachments.length >= 5) {
        Alert.alert('Limit Reached', 'You can upload maximum 5 attachments per ticket.');
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take photos. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment = {
          uri: asset.uri,
          type: 'image',
          name: asset.uri.split('/').pop() || 'photo.jpg',
          base64: asset.base64,
        };
        setAttachments([...attachments, newAttachment]);
        Alert.alert('Success', 'Photo added successfully!');
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Camera Error', error.message || 'Failed to take photo. Please try again.');
    }
  };

  const removeAttachment = (index: number) => {
    Alert.alert(
      'Remove Attachment',
      'Are you sure you want to remove this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newAttachments = [...attachments];
            newAttachments.splice(index, 1);
            setAttachments(newAttachments);
          }
        }
      ]
    );
  };

  const showAttachmentOptions = () => {
    Alert.alert(
      'Add Attachment',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please describe your issue');
      return;
    }

    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      setLoading(true);

      if (attachments.length > 0) {
        // Use FormData for multipart upload with attachments
        const ticketData = new FormData() as any;
        ticketData.append('subject', formData.subject);
        ticketData.append('description', formData.description);
        ticketData.append('category', formData.category);
        ticketData.append('priority', formData.priority);

        // Add attachments
        attachments.forEach((attachment, index) => {
          ticketData.append('attachments', {
            uri: attachment.uri,
            type: 'image/jpeg',
            name: attachment.name || `attachment_${index}.jpg`,
          });
        });

        // Use fetch directly for FormData
        const token = await ApiClient.getInstance().getToken();
        const response = await fetch(`${API_BASE_URL}/support-tickets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: ticketData,
        });

        const data = await response.json();
        
        if (data.success) {
          Alert.alert(
            'Success',
            `Your support ticket #${data.data.ticket_number} has been created successfully. Our team will respond soon.`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
          
          // Clear form and attachments
          setFormData({
            subject: '',
            description: '',
            category: '',
            priority: 'medium'
          });
          setAttachments([]);
        } else {
          Alert.alert('Error', data.message || 'Failed to create ticket');
        }
      } else {
        // No attachments - use regular API client
        const apiClient = ApiClient.getInstance();
        const response = await apiClient.post(`${API_BASE_URL}/support-tickets`, formData);

        if (response.success) {
          Alert.alert(
            'Success',
            `Your support ticket #${response.data.ticket_number} has been created successfully. Our team will respond soon.`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
          
          // Clear form
          setFormData({
            subject: '',
            description: '',
            category: '',
            priority: 'medium'
          });
        } else {
          Alert.alert('Error', response.message || 'Failed to create ticket');
        }
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', error.message || 'Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    backButton: {
      padding: 4,
      width: 32,
    },
    titleContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 4,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: '400',
      opacity: 0.8,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    required: {
      color: '#FF3B30',
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: 14,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    categoryCard: {
      width: '48%',
      marginHorizontal: '1%',
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    selectedCategory: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    categoryIcon: {
      marginBottom: theme.spacing.xs,
    },
    categoryLabel: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
    },
    prioritiesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    priorityButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    selectedPriority: {
      borderWidth: 2,
    },
    priorityLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    infoBox: {
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoIcon: {
      marginRight: theme.spacing.sm,
      marginTop: 2,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.text,
      lineHeight: 18,
    },
    autoFillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF950020',
      borderWidth: 1,
      borderColor: '#FF9500',
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    autoFillText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FF9500',
      marginLeft: theme.spacing.xs,
    },
    attachmentCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    addAttachmentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    addAttachmentText: {
      fontSize: 14,
      fontWeight: '500',
      marginLeft: theme.spacing.sm,
    },
    attachmentsPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    attachmentItem: {
      width: 100,
      height: 100,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    attachmentImage: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surface,
    },
    removeAttachmentButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
    },
  });

  const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Create Support Ticket
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              We're here to help you
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Auto-Fill Button (Testing) */}
        <TouchableOpacity
          style={styles.autoFillButton}
          onPress={handleAutoFill}
          activeOpacity={0.7}
        >
          <Ionicons name="flash" size={16} color="#FF9500" />
          <Text style={styles.autoFillText} allowFontScaling={false}>
            Auto-Fill (Test Data)
          </Text>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} style={styles.infoIcon} />
          <Text style={styles.infoText} allowFontScaling={false}>
            Our support team typically responds within 24 hours. For urgent issues, please mark the priority accordingly.
          </Text>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.label} allowFontScaling={false}>
            Subject <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your issue"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            maxLength={100}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label} allowFontScaling={false}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryCard,
                  formData.category === category.value && styles.selectedCategory
                ]}
                onPress={() => setFormData({ ...formData, category: category.value })}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={formData.category === category.value ? theme.colors.primary : theme.colors.textSecondary}
                  style={styles.categoryIcon}
                />
                <Text style={styles.categoryLabel} allowFontScaling={false}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label} allowFontScaling={false}>
            Priority
          </Text>
          <View style={styles.prioritiesRow}>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority.value}
                style={[
                  styles.priorityButton,
                  formData.priority === priority.value && {
                    ...styles.selectedPriority,
                    borderColor: priority.color,
                    backgroundColor: priority.color + '20',
                  }
                ]}
                onPress={() => setFormData({ ...formData, priority: priority.value })}
                activeOpacity={0.7}
              >
                <Text 
                  style={[
                    styles.priorityLabel,
                    formData.priority === priority.value && { color: priority.color }
                  ]} 
                  allowFontScaling={false}
                >
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label} allowFontScaling={false}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please provide detailed information about your issue..."
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={6}
            maxLength={1000}
          />
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
            <Text style={styles.label} allowFontScaling={false}>
              Attachments (Optional)
            </Text>
            <Text style={styles.attachmentCount} allowFontScaling={false}>
              {attachments.length}/5
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.addAttachmentButton}
            onPress={showAttachmentOptions}
            activeOpacity={0.7}
            disabled={attachments.length >= 5}
          >
            <Ionicons name="camera" size={20} color={attachments.length >= 5 ? theme.colors.textSecondary : theme.colors.primary} />
            <Text style={[styles.addAttachmentText, { color: attachments.length >= 5 ? theme.colors.textSecondary : theme.colors.primary }]} allowFontScaling={false}>
              {attachments.length >= 5 ? 'Maximum 5 attachments' : 'Add Screenshot or Photo'}
            </Text>
          </TouchableOpacity>

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsPreview}>
              {attachments.map((attachment, index) => (
                <View key={index} style={styles.attachmentItem}>
                  <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                  <TouchableOpacity
                    style={styles.removeAttachmentButton}
                    onPress={() => removeAttachment(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText} allowFontScaling={false}>
              Submit Ticket
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTicketScreen;


