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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
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
      backgroundColor: '#FFFFFF',
    },
    scrollView: {
      flex: 1,
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
    appName: {
      fontSize: 24,
      fontWeight: '700',
      color: '#007AFF',
      marginTop: 12,
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    tagline: {
      fontSize: 14,
      fontWeight: '500',
      color: '#666666',
      marginTop: 4,
      marginBottom: 8,
    },
    greeting: {
      fontSize: 36,
      fontWeight: '700',
      color: '#000000',
      marginBottom: 4,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: '#000000',
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
    inputContainer: {
      marginBottom: 0,
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
      paddingLeft: 50,
      paddingRight: 50,
      borderBottomWidth: 1.5,
      borderBottomColor: '#E0E0E0',
      backgroundColor: 'transparent',
    },
    inputFocused: {
      borderBottomColor: '#007AFF',
    },
    inputIcon: {
      position: 'absolute',
      right: 0,
      top: 14,
      zIndex: 1,
    },
    countryCodeContainer: {
      position: 'absolute',
      left: 0,
      top: 14,
      zIndex: 2,
    },
    countryCode: {
      fontSize: 17,
      color: '#000000',
      fontWeight: '400',
    },
    button: {
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
    buttonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 1.5,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    infoText: {
      fontSize: 12,
      color: '#999999',
      marginTop: 12,
      lineHeight: 16,
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

  const isValidPhone = phone.replace('+91', '').length === 10;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                <Text style={styles.appName} allowFontScaling={false}>PaysaGo</Text>
                <Text style={styles.tagline} allowFontScaling={false}>Finance Manager</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCode} allowFontScaling={false}>+91</Text>
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
                  {isValidPhone && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={26} 
                      color="#34C759" 
                      style={styles.inputIcon}
                    />
                  )}
                </View>
                <Text style={styles.infoText} allowFontScaling={false}>
                  We'll send a 6-digit OTP to this number
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (isLoading || !isValidPhone) && styles.buttonDisabled,
                ]}
                onPress={handleRequestOTP}
                disabled={isLoading || !isValidPhone}
              >
                <Text style={styles.buttonText} allowFontScaling={false}>
                  {isLoading ? 'Sending OTP...' : 'SEND OTP'}
                </Text>
              </TouchableOpacity>
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

export default OTPRequestScreen;

