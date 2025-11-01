import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ApiClient from '../utils/ApiClient';
import { API_BASE_URL } from '../config/api.config';

const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('🔍 EditProfileScreen: Starting profile update...');
    console.log('🔍 EditProfileScreen: Current form data:', { name, phone });
    
    if (!validateForm()) {
      console.log('❌ EditProfileScreen: Form validation failed');
      return;
    }

    try {
      setLoading(true);
      const apiClient = ApiClient.getInstance();
      
      const updateData: any = {
        name: name.trim(),
      };

      if (phone && phone.trim()) {
        updateData.phone = phone.trim();
      }

      console.log('🔍 EditProfileScreen: Sending update data:', updateData);
      console.log('🔍 EditProfileScreen: Making API call to profile endpoint...');

      const response = await apiClient.patch(
        `${API_BASE_URL}/auth/profile`,
        updateData
      );

      console.log('🔍 EditProfileScreen: API response:', response);

      if (response.success) {
        // Update user in AuthContext
        if (setUser && user) {
          setUser({
            ...user,
            name: updateData.name,
            phone: updateData.phone,
          });
        }

        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EditProfileHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Edit Profile
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Update your information
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    backButton: {
      padding: theme.spacing.xs,
      marginRight: theme.spacing.sm,
    },
    titleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 13,
      fontWeight: '400',
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    inputWrapper: {
      position: 'relative',
    },
    floatingLabel: {
      position: 'absolute',
      top: -8,
      left: 12,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 4,
      fontSize: 12,
      fontWeight: '600',
      color: '#000000',
      zIndex: 1,
    },
    input: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: theme.colors.text,
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 12,
      marginTop: 4,
      marginLeft: 12,
      fontWeight: '500',
    },
    infoBox: {
      backgroundColor: '#F0F8FF',
      borderRadius: 12,
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: '#007AFF20',
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
      lineHeight: 18,
    },
    readOnlyInfo: {
      backgroundColor: '#F5F5F5',
      borderRadius: 12,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    readOnlyLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    readOnlyValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    buttonContainer: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    saveButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    saveButtonDisabled: {
      backgroundColor: '#CCCCCC',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    changePasswordButton: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#007AFF',
    },
    changePasswordText: {
      color: '#007AFF',
      fontSize: 12,
      fontWeight: '700',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <EditProfileHeader theme={theme} insets={insets} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText} allowFontScaling={false}>
            Update your profile information. Changes will be reflected across the app.
          </Text>
        </View>

        {/* Read-only Email */}
        <View style={styles.readOnlyInfo}>
          <Text style={styles.readOnlyLabel} allowFontScaling={false}>Email (Cannot be changed)</Text>
          <Text style={styles.readOnlyValue} allowFontScaling={false}>{user?.email}</Text>
        </View>

        {/* Editable Fields Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Personal Information</Text>
          
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel} allowFontScaling={false}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textSecondary}
                allowFontScaling={false}
              />
            </View>
            {errors.name && <Text style={styles.errorText} allowFontScaling={false}>{errors.name}</Text>}
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel} allowFontScaling={false}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) {
                    setErrors(prev => ({ ...prev, phone: '' }));
                  }
                }}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                allowFontScaling={false}
              />
            </View>
            {errors.phone && <Text style={styles.errorText} allowFontScaling={false}>{errors.phone}</Text>}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText} allowFontScaling={false}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => navigation.navigate('ChangePassword' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.changePasswordText} allowFontScaling={false}>
              Change Password
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

