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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
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
  
  const navigation = useNavigation();
  const { setUser } = useAuth();
  const { theme } = useTheme();

  const keyboardVerticalOffset = Platform.select({
    ios: 24,
    android: (StatusBar.currentHeight ?? 0) + 24,
    default: 0,
  });

  const handleCompleteSignup = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Error', 'Please enter your name (at least 2 characters)');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
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
                setUser({
                  id: userResult.data.id,
                  email: userResult.data.email || '',
                  name: userResult.data.name || 'User',
                  phone: userResult.data.phone,
                  createdAt: userResult.data.createdAt
                });
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
    gradient: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    logo: {
      fontSize: 32,
      color: '#FFFFFF',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#000000',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: '#666666',
      textAlign: 'center',
      lineHeight: 20,
    },
    form: {
      width: '100%',
      maxWidth: 320,
      alignSelf: 'center',
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: '#000000',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E9ECEF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 14,
      color: '#000000',
      paddingRight: 50,
      height: 56,
    },
    inputFocused: {
      borderColor: '#007AFF',
      backgroundColor: '#FFFFFF',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    inputIcon: {
      position: 'absolute',
      right: 16,
      top: 16,
      zIndex: 1,
    },
    registerButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 24,
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    registerButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    buttonDisabled: {
      backgroundColor: '#CCCCCC',
      shadowOpacity: 0,
      elevation: 0,
    },
    infoText: {
      fontSize: 12,
      color: '#666666',
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 18,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <LinearGradient
        colors={['#F8F9FA', '#FFFFFF']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={keyboardVerticalOffset}
          enabled
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo} allowFontScaling={false}>💰</Text>
              </View>
              <Text style={styles.title} allowFontScaling={false}>Complete Your Profile</Text>
              <Text style={styles.subtitle} allowFontScaling={false}>
                Add your name and email to get started
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'name' && styles.inputFocused,
                    ]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999999"
                    value={name}
                    onChangeText={setName}
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
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'email' && styles.inputFocused,
                    ]}
                    placeholder="your@email.com"
                    placeholderTextColor="#999999"
                    value={email}
                    onChangeText={setEmail}
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
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  (isLoading || !name.trim() || !email.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleCompleteSignup}
                disabled={isLoading || !name.trim() || !email.trim()}
              >
                <Text style={styles.registerButtonText} allowFontScaling={false}>
                  {isLoading ? 'Completing...' : 'Complete Signup'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default CompleteSignupScreen;

