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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../config/api.config';

const OTPRequestScreen: React.FC = () => {
  const [phone, setPhone] = useState('+91');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleRequestOTP = async () => {
    // Ensure +91 is present
    let formattedPhone = phone.trim();
    
    if (!formattedPhone || formattedPhone === '+91') {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Ensure it starts with +91
    if (!formattedPhone.startsWith('+91')) {
      formattedPhone = `+91${formattedPhone.replace(/^\+/, '').replace(/\s/g, '')}`;
    } else {
      formattedPhone = formattedPhone.replace(/\s/g, '');
    }

    // Validate Indian phone number format (+91 followed by 10 digits)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(formattedPhone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit Indian phone number');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to OTP verification screen
        navigation.navigate('OTPVerify' as never, { phone: formattedPhone } as never);
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP request error:', error);
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
    },
    form: {
      width: '100%',
      maxWidth: 320,
      alignSelf: 'center',
    },
    inputContainer: {
      marginBottom: 20,
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
      fontSize: 16,
      color: '#000000',
      paddingLeft: 90,
      height: 56,
      textAlignVertical: 'center',
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
      left: 16,
      top: 16,
      zIndex: 1,
    },
    countryCodeContainer: {
      position: 'absolute',
      left: 50,
      top: 0,
      bottom: 0,
      zIndex: 2,
      justifyContent: 'center',
      paddingRight: 8,
    },
    countryCode: {
      fontSize: 16,
      color: '#666666',
      fontWeight: '400',
      lineHeight: 20,
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo} allowFontScaling={false}>📱</Text>
              </View>
              <Text style={styles.title} allowFontScaling={false}>Phone Verification</Text>
              <Text style={styles.subtitle} allowFontScaling={false}>
                Enter your phone number to receive OTP
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="call-outline" 
                    size={20} 
                    color="#999999" 
                    style={styles.inputIcon}
                  />
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput && styles.inputFocused,
                    ]}
                    placeholder="9876543210"
                    placeholderTextColor="#999999"
                    value={phone.replace('+91', '')}
                    onChangeText={(text) => {
                      // Only allow digits, limit to 10 digits
                      const digits = text.replace(/\D/g, '').slice(0, 10);
                      setPhone(`+91${digits}`);
                    }}
                    onFocus={() => setFocusedInput(true)}
                    onBlur={() => setFocusedInput(false)}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    allowFontScaling={false}
                  />
                </View>
                <Text style={styles.infoText} allowFontScaling={false}>
                  We'll send a 6-digit OTP to this number (India: +91)
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleRequestOTP}
                disabled={isLoading}
              >
                <Text style={styles.buttonText} allowFontScaling={false}>
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText} allowFontScaling={false}>
                Already have an account?{' '}
                <Text 
                  style={styles.footerLink}
                  onPress={() => navigation.navigate('Login' as never)}
                  allowFontScaling={false}
                >
                  Login with Email
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default OTPRequestScreen;

