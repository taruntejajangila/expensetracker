import React, { useState, useRef, useEffect } from 'react';
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
}

const OTPVerifyScreen: React.FC = () => {
  const route = useRoute();
  const { phone } = (route.params as RouteParams) || { phone: '' };
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  
  const navigation = useNavigation();
  const { setUser } = useAuth();
  const { theme } = useTheme();

  // Auto-focus first input on mount
  useEffect(() => {
    otpInputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'OTP sent successfully');
        setResendCooldown(60); // 60 second cooldown
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const otpString = otpCode || otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpString })
      });

      const result = await response.json();

      if (result.success) {
        // Check if user needs to complete signup
        if (result.requiresSignup) {
          // New user: Store tempToken and navigate to complete signup screen
          if (result.data.tempToken) {
            await AsyncStorage.setItem('authToken', result.data.tempToken);
            console.log('✅ TempToken stored for new user');
          }
          
          console.log('✅ OTP Verified - New user, navigating to CompleteSignup');
          // Navigate directly to complete signup screen (no Alert blocking)
          (navigation as any).navigate('CompleteSignup', { 
            phone: phone,
            tempToken: result.data.tempToken 
          });
        } else {
          // Existing user: Store tokens and login
          if (result.data.accessToken) {
            await AsyncStorage.setItem('authToken', result.data.accessToken);
          }
          if (result.data.refreshToken) {
            await AsyncStorage.setItem('refreshToken', result.data.refreshToken);
          }

          // Update user in context - this will trigger navigation to MainStackNavigator
          if (result.data.user) {
            // Format user object to match AuthContext User interface
            const userData = {
              id: result.data.user.id,
              email: result.data.user.email || '',
              name: result.data.user.name || `${result.data.user.first_name || ''} ${result.data.user.last_name || ''}`.trim() || 'User',
              phone: result.data.user.phone,
              createdAt: result.data.user.created_at
            };
            console.log('✅ OTP Verified - Setting user in context:', userData);
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
        }
      } else {
        Alert.alert('Error', result.message || 'Invalid OTP');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
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
      paddingTop: 60,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
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
      marginBottom: 8,
    },
    phoneNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: '#007AFF',
      textAlign: 'center',
    },
    form: {
      width: '100%',
      maxWidth: 320,
      alignSelf: 'center',
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 32,
    },
    otpInput: {
      width: 45,
      height: 56,
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E9ECEF',
      borderRadius: 12,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '600',
      color: '#000000',
    },
    otpInputFocused: {
      borderColor: '#007AFF',
      backgroundColor: '#FFFFFF',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    button: {
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
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    buttonDisabled: {
      backgroundColor: '#CCCCCC',
      shadowOpacity: 0,
      elevation: 0,
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: 24,
    },
    resendText: {
      fontSize: 14,
      color: '#666666',
    },
    resendLink: {
      color: '#007AFF',
      fontWeight: '600',
    },
    resendDisabled: {
      color: '#CCCCCC',
    },
    footer: {
      alignItems: 'center',
      marginTop: 32,
    },
    footerText: {
      fontSize: 12,
      color: '#666666',
    },
    footerLink: {
      color: '#007AFF',
      fontWeight: '600',
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo} allowFontScaling={false}>🔐</Text>
              </View>
              <Text style={styles.title} allowFontScaling={false}>Enter OTP</Text>
              <Text style={styles.subtitle} allowFontScaling={false}>
                We've sent a 6-digit code to
              </Text>
              <Text style={styles.phoneNumber} allowFontScaling={false}>{phone}</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpInputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFocused,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    allowFontScaling={false}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={() => handleVerifyOTP()}
                disabled={isLoading || otp.some(d => !d)}
              >
                <Text style={styles.buttonText} allowFontScaling={false}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <Text style={styles.resendText} allowFontScaling={false}>
                  Didn't receive OTP?{' '}
                  {resendCooldown > 0 ? (
                    <Text style={styles.resendDisabled} allowFontScaling={false}>
                      Resend in {resendCooldown}s
                    </Text>
                  ) : (
                    <Text
                      style={styles.resendLink}
                      onPress={handleResendOTP}
                      allowFontScaling={false}
                    >
                      Resend OTP
                    </Text>
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText} allowFontScaling={false}>
                Wrong number?{' '}
                <Text 
                  style={styles.footerLink}
                  onPress={() => navigation.navigate('OTPRequest' as never)}
                  allowFontScaling={false}
                >
                  Change Number
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default OTPVerifyScreen;

