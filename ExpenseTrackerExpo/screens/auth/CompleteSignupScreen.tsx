import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api.config';

interface RouteParams {
  phone: string;
  tempToken?: string;
}

const CompleteSignupScreen: React.FC = () => {
  const route = useRoute();
  const { phone } = (route.params as RouteParams) || { phone: '' };
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const navigation = useNavigation();
  const { setUser } = useAuth();
  const { theme } = useTheme();

  const keyboardVerticalOffset = Platform.select({
    ios: 0,
    android: 20,
    default: 0,
  });

  // Filter name input to only allow alphabets and spaces
  const handleNameChange = (text: string) => {
    // Remove all characters that are not letters or spaces
    const filteredText = text.replace(/[^a-zA-Z\s]/g, '');
    setName(filteredText);
    
    // Real-time validation
    const trimmed = filteredText.trim();
    if (trimmed.length === 0) {
      setNameError(null);
    } else if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
    } else if (trimmed.length > 50) {
      setNameError('Name must not exceed 50 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
      setNameError('Only alphabets and spaces allowed');
    } else {
      setNameError(null);
    }
  };

  // Filter email input to only allow valid email characters
  const handleEmailChange = (text: string) => {
    // Allow letters, numbers, dots, hyphens, underscores, and @ symbol
    // Email format: user@domain.com
    const filteredText = text.replace(/[^a-zA-Z0-9.@_-]/g, '');
    setEmail(filteredText);
    
    // Real-time validation
    const trimmed = filteredText.trim();
    if (trimmed.length === 0) {
      setEmailError(null);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        setEmailError('Invalid email format');
      } else {
        const allowedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
        const emailDomain = trimmed.split('@')[1]?.toLowerCase();
        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
          setEmailError('Use Gmail, Outlook, Hotmail, or Yahoo');
        } else {
          setEmailError(null);
        }
      }
    }
  };

  // Check if email format is valid and domain is allowed
  const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return false;
    }
    
    // Only allow specific email domains
    const allowedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
    const emailDomain = email.trim().split('@')[1]?.toLowerCase();
    return allowedDomains.includes(emailDomain);
  };

  const handleCompleteSignup = async () => {
    // Name Validation
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert('Error', 'Full name must be at least 2 characters long');
      return;
    }
    if (trimmedName.length > 50) {
      Alert.alert('Error', 'Full name must not exceed 50 characters');
      return;
    }
    // Allow only alphabets (letters) and spaces - no numbers or symbols
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      Alert.alert('Error', 'Full name can only contain alphabets and spaces. No numbers or symbols allowed');
      return;
    }

    // Email Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    // Check if email domain is allowed
    const allowedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
    const emailDomain = email.trim().split('@')[1]?.toLowerCase();
    if (!allowedDomains.includes(emailDomain)) {
      Alert.alert('Error', 'Please use Gmail, Outlook, Hotmail, or Yahoo email address');
      return;
    }

    try {
      setIsLoading(true);

      // Get tempToken from AsyncStorage (stored during OTP verification)
      const tempToken = await AsyncStorage.getItem('authToken');
      if (!tempToken) {
        Alert.alert('Error', 'Session expired. Please verify OTP again.');
        navigation.navigate('OTPRequest' as never);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        // Store final tokens
        if (result.data.accessToken) {
          await AsyncStorage.setItem('authToken', result.data.accessToken);
        }
        if (result.data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', result.data.refreshToken);
        }

        // Update user in context - format user object to match AuthContext User interface
        if (result.data.user) {
          const userData = {
            id: result.data.user.id,
            email: result.data.user.email || '',
            name: result.data.user.name || `${result.data.user.first_name || ''} ${result.data.user.last_name || ''}`.trim() || 'User',
            phone: result.data.user.phone,
            createdAt: result.data.user.created_at || result.data.user.createdAt
          };
          console.log('✅ CompleteSignup - Setting user in context:', userData);
          
          // Cache user data for offline mode and app reload persistence
          await AsyncStorage.setItem('cachedUserData', JSON.stringify(userData));
          
          setUser(userData);
          console.log('✅ User set in context, navigation should happen automatically');
        } else {
          // If user data not in response, fetch it
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            try {
              const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const userResult = await userResponse.json();
              if (userResult.success && userResult.data) {
                const userData = {
                  id: userResult.data.id,
                  email: userResult.data.email || '',
                  name: userResult.data.name || 'User',
                  phone: userResult.data.phone,
                  createdAt: userResult.data.createdAt
                };
                // Cache user data for offline mode and app reload persistence
                await AsyncStorage.setItem('cachedUserData', JSON.stringify(userData));
                setUser(userData);
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }
        }
        // Navigation will happen automatically via AuthContext when user is set
      } else {
        Alert.alert('Error', result.message || 'Failed to complete signup');
      }
    } catch (error: any) {
      console.error('Complete signup error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    scrollView: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    logo: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#000000',
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: '#666666',
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 4,
      marginBottom: 8,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      marginTop: 10,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 6,
    },
    form: {
      width: '100%',
    },
    inputContainer: {
      marginBottom: 32,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: '#007AFF',
      marginBottom: 16,
    },
    inputWrapper: {
      position: 'relative',
      paddingBottom: 8,
    },
    input: {
      fontSize: 17,
      color: '#000000',
      paddingVertical: 14,
      paddingLeft: 16,
      paddingRight: 50,
      borderBottomWidth: 1.5,
      borderBottomColor: '#E0E0E0',
      backgroundColor: 'transparent',
    },
    inputFocused: {
      borderBottomColor: '#007AFF',
    },
    inputError: {
      borderBottomColor: '#FF6B6B',
      backgroundColor: '#FFF5F5',
    },
    inputIcon: {
      position: 'absolute',
      right: 0,
      top: 14,
      zIndex: 1,
    },
    registerButton: {
      borderRadius: 20,
      paddingVertical: 20,
      alignItems: 'center',
      marginTop: 24,
      backgroundColor: '#007AFF',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    registerButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 1.5,
    },
    buttonDisabled: {
      backgroundColor: '#CCCCCC',
      shadowOpacity: 0,
      elevation: 0,
    },
    errorText: {
      fontSize: 12,
      color: '#FF6B6B',
      marginTop: 6,
      marginLeft: 4,
    },
    footer: {
      alignItems: 'center',
      paddingBottom: 20,
      paddingTop: 10,
    },
    footerText: {
      fontSize: 12,
      color: '#999999',
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title} allowFontScaling={false}>Complete Your Profile</Text>
              <Text style={styles.subtitle} allowFontScaling={false}>
                Add your name and email to get started
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'name' && styles.inputFocused,
                      nameError && styles.inputError,
                    ]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999999"
                    value={name}
                    onChangeText={handleNameChange}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    allowFontScaling={false}
                  />
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color="#999999" 
                    style={styles.inputIcon}
                  />
                </View>
                {nameError && (
                  <Text style={styles.errorText} allowFontScaling={false}>
                    {nameError}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'email' && styles.inputFocused,
                      emailError && styles.inputError,
                    ]}
                    placeholder="Enter Gmail, Outlook, Hotmail, or Yahoo email"
                    placeholderTextColor="#999999"
                    value={email}
                    onChangeText={handleEmailChange}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    allowFontScaling={false}
                  />
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color="#999999" 
                    style={styles.inputIcon}
                  />
                </View>
                {emailError && (
                  <Text style={styles.errorText} allowFontScaling={false}>
                    {emailError}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  (isLoading || !name.trim() || !email.trim() || nameError || emailError) && styles.buttonDisabled,
                ]}
                onPress={handleCompleteSignup}
                disabled={isLoading || !name.trim() || !email.trim() || !!nameError || !!emailError}
              >
                <Text style={styles.registerButtonText} allowFontScaling={false}>
                  {isLoading ? 'Completing...' : 'Complete Signup'}
                </Text>
              </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.footer}>
            <Text style={styles.footerText} allowFontScaling={false}>
              Made with ❤️ in India
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default CompleteSignupScreen;

