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
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const RegisterScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const navigation = useNavigation();
  const { register } = useAuth();
  const { theme } = useTheme();

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return '#FF6B6B';
    if (strength <= 3) return '#FFD93D';
    return '#6BCF7F';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  const handleRegister = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (phone.trim().length !== 10 || !/^[0-9]{10}$/.test(phone.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await register(name.trim(), email.trim(), password, phone.trim());
      Alert.alert('Success', 'Account created successfully! You are now logged in.');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
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
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: 40,
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
    passwordToggle: {
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
    registerButtonDisabled: {
      backgroundColor: '#CCCCCC',
      shadowOpacity: 0,
      elevation: 0,
    },
    footer: {
      alignItems: 'center',
      marginTop: 32,
    },
    loginText: {
      fontSize: 12,
      color: '#666666',
    },
    loginLink: {
      color: '#007AFF',
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#E9ECEF',
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 12,
      color: '#666666',
    },
    passwordStrength: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    strengthText: {
      fontSize: 12,
      color: '#666666',
      marginLeft: 8,
    },
    strengthIndicator: {
      height: 4,
      borderRadius: 2,
      backgroundColor: '#E9ECEF',
      flex: 1,
    },
    strengthFill: {
      height: '100%',
      borderRadius: 2,
    },
  });

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = getPasswordStrengthColor(passwordStrength);
  const strengthText = getPasswordStrengthText(passwordStrength);

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
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo} allowFontScaling={false}>💰</Text>
              </View>
              <Text style={styles.title} allowFontScaling={false}>Create Account</Text>
              <Text style={styles.subtitle} allowFontScaling={false}>Join us to start tracking your expenses</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={[
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
                  <TextInput style={[
                      styles.input,
                      focusedInput === 'email' && styles.inputFocused,
                    ]}
                    placeholder="Enter your email"
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

              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={[
                      styles.input,
                      focusedInput === 'phone' && styles.inputFocused,
                    ]}
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor="#999999"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="phone-pad"
                    maxLength={10}
                    allowFontScaling={false}
                  />
                  <Ionicons 
                    name="call-outline" 
                    size={20} 
                    color="#999999" 
                    style={styles.inputIcon}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={[
                      styles.input,
                      focusedInput === 'password' && styles.inputFocused,
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor="#999999"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    allowFontScaling={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#999999" 
                    />
                  </TouchableOpacity>
                </View>
                {password.length > 0 && (
                  <View style={styles.passwordStrength}>
                    <View style={styles.strengthIndicator}>
                      <View 
                        style={[
                          styles.strengthFill, 
                          { 
                            width: `${(passwordStrength / 5) * 100}%`, 
                            backgroundColor: strengthColor 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: strengthColor }]} allowFontScaling={false}>
                      {strengthText}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label} allowFontScaling={false}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={[
                      styles.input,
                      focusedInput === 'confirmPassword' && styles.inputFocused,
                    ]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    allowFontScaling={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#999999" 
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Text style={[styles.strengthText, { color: '#FF6B6B' }]} allowFontScaling={false}>
                    Passwords do not match
                  </Text>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <Text style={[styles.strengthText, { color: '#6BCF7F' }]} allowFontScaling={false}>
                    Passwords match ✓
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.registerButtonText} allowFontScaling={false}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText} allowFontScaling={false}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.loginText} allowFontScaling={false}>
                Already have an account?{' '}
                <Text style={styles.loginLink}
                  onPress={() => navigation.navigate('Login' as never)}
                  allowFontScaling={false}
                >
                  Sign In
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default RegisterScreen; 