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

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const navigation = useNavigation();
  const { login } = useAuth();
  const { theme } = useTheme();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
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
      paddingTop: 60,
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
    loginButton: {
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
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    loginButtonDisabled: {
      backgroundColor: '#CCCCCC',
      shadowOpacity: 0,
      elevation: 0,
    },
    footer: {
      alignItems: 'center',
      marginTop: 32,
    },
    registerText: {
      fontSize: 12,
      color: '#666666',
    },
    registerLink: {
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
              <Text style={styles.title} allowFontScaling={false}>Welcome Back</Text>
              <Text style={styles.subtitle} allowFontScaling={false}>Sign in to continue tracking your expenses</Text>
            </View>

            <View style={styles.form}>
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
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText} allowFontScaling={false}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText} allowFontScaling={false}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.registerText} allowFontScaling={false}>
                Don't have an account?{' '}
                <Text style={styles.registerLink}
                  onPress={() => navigation.navigate('Register' as never)}
                >
                  Create Account
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LoginScreen; 