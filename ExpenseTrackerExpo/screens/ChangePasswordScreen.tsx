import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ApiClient from '../utils/ApiClient';
import { API_BASE_URL } from '../config/api.config';

const ChangePasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const apiClient = ApiClient.getInstance();
      
      const response = await apiClient.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword,
          newPassword,
        }
      );

      if (response.success) {
        Alert.alert(
          'Success', 
          'Password changed successfully. Please login again with your new password.',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack()
            }
          ]
        );
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ChangePasswordHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
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
              Change Password
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Keep your account secure
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
    warningBox: {
      backgroundColor: '#FFF3CD',
      borderRadius: 12,
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: '#FFC107',
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: '#856404',
      marginLeft: theme.spacing.sm,
      lineHeight: 18,
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
    passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 12,
      paddingRight: 12,
    },
    input: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: theme.colors.text,
    },
    eyeButton: {
      padding: 8,
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 12,
      marginTop: 4,
      marginLeft: 12,
      fontWeight: '500',
    },
    passwordStrength: {
      marginTop: 8,
      marginLeft: 12,
    },
    strengthText: {
      fontSize: 12,
      fontWeight: '500',
    },
    requirementsList: {
      marginTop: theme.spacing.md,
      marginLeft: 12,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    requirementText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    requirementMet: {
      color: '#34C759',
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
    },
    saveButtonDisabled: {
      backgroundColor: '#CCCCCC',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
  });

  const getPasswordStrength = (password: string) => {
    if (!password) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Weak', color: '#FF3B30' };
    if (password.length < 8) return { text: 'Fair', color: '#FF9500' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { text: 'Strong', color: '#34C759' };
    }
    return { text: 'Good', color: '#007AFF' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <View style={styles.container}>
      <ChangePasswordHeader theme={theme} insets={insets} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={20} color="#856404" />
          <Text style={styles.warningText} allowFontScaling={false}>
            Make sure to remember your new password. You'll need it to login next time.
          </Text>
        </View>

        {/* Password Fields Section */}
        <View style={styles.section}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel} allowFontScaling={false}>Current Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (errors.currentPassword) {
                      setErrors(prev => ({ ...prev, currentPassword: '' }));
                    }
                  }}
                  placeholder="Enter your current password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showCurrentPassword}
                  allowFontScaling={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {errors.currentPassword && (
              <Text style={styles.errorText} allowFontScaling={false}>{errors.currentPassword}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel} allowFontScaling={false}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) {
                      setErrors(prev => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  placeholder="Enter your new password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showNewPassword}
                  allowFontScaling={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {errors.newPassword && (
              <Text style={styles.errorText} allowFontScaling={false}>{errors.newPassword}</Text>
            )}
            {newPassword.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text 
                  style={[styles.strengthText, { color: passwordStrength.color }]}
                  allowFontScaling={false}
                >
                  Strength: {passwordStrength.text}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel} allowFontScaling={false}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="Re-enter your new password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  allowFontScaling={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText} allowFontScaling={false}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={newPassword.length >= 6 ? '#34C759' : theme.colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.requirementText, 
                  newPassword.length >= 6 && styles.requirementMet
                ]}
                allowFontScaling={false}
              >
                At least 6 characters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={/[A-Z]/.test(newPassword) ? '#34C759' : theme.colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.requirementText, 
                  /[A-Z]/.test(newPassword) && styles.requirementMet
                ]}
                allowFontScaling={false}
              >
                One uppercase letter (recommended)
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={/[0-9]/.test(newPassword) ? '#34C759' : theme.colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.requirementText, 
                  /[0-9]/.test(newPassword) && styles.requirementMet
                ]}
                allowFontScaling={false}
              >
                One number (recommended)
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText} allowFontScaling={false}>
                Change Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ChangePasswordScreen;

