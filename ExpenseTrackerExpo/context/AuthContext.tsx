import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiClient from '../utils/ApiClient';
import { API_BASE_URL } from '../config/api.config';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  // DEPRECATED: Email/password login removed - use OTP authentication instead
  // login: (email: string, password: string) => Promise<void>;
  // register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAllUserData: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isLoading: boolean;
  isOnline: boolean;
  isOfflineMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    loadUser();
    setupNetworkListener();
  }, []);

  const setupNetworkListener = () => {
    // Simplified: Just assume online and let the app handle network errors gracefully
    // Don't do aggressive network checks that can cause false positives
    return () => {};
  };

  const loadUser = async () => {
    try {
      console.log('🔄 AuthContext: Loading user from storage...');
      
      // Check if there's a stored auth token
      const token = await AsyncStorage.getItem('authToken');
      const refreshTokenValue = await AsyncStorage.getItem('refreshToken');
      
      console.log('🔄 AuthContext: Token check:', { 
        hasAuthToken: !!token, 
        hasRefreshToken: !!refreshTokenValue 
      });
      
      if (token) {
        const apiClient = ApiClient.getInstance();

        try {
          console.log('🔄 AuthContext: Attempting to fetch user profile...');
          const userData = await apiClient.get(`${API_BASE_URL}/auth/me`, {
            'Authorization': `Bearer ${token}`,
          });

          if (userData.success && userData.data) {
            console.log('✅ AuthContext: User profile loaded successfully');
            const user: User = {
              id: userData.data.id,
              email: userData.data.email,
              name: userData.data.name,
              phone: userData.data.phone,
              avatar: undefined,
              createdAt: userData.data.createdAt,
            };
            setUser(user);
            
            // Cache user data for offline mode
            await AsyncStorage.setItem('cachedUserData', JSON.stringify(user));
            setIsLoading(false);
            return;
          } else {
            console.log('⚠️ AuthContext: /auth/me returned unsuccessful, trying refresh...');
            // Try one refresh before clearing
            if (refreshTokenValue) {
              const refreshOk = await refreshToken();
              if (refreshOk) {
                const newToken = await AsyncStorage.getItem('authToken');
                if (newToken) {
                  const retryData = await apiClient.get(`${API_BASE_URL}/auth/me`, {
                    'Authorization': `Bearer ${newToken}`,
                  });
                  if (retryData.success && retryData.data) {
                    console.log('✅ AuthContext: User profile loaded after token refresh');
                    const retryUser: User = {
                      id: retryData.data.id,
                      email: retryData.data.email,
                      name: retryData.data.name,
                      phone: retryData.data.phone,
                      avatar: undefined,
                      createdAt: retryData.data.createdAt,
                    };
                    setUser(retryUser);
                    await AsyncStorage.setItem('cachedUserData', JSON.stringify(retryUser));
                    setIsLoading(false);
                    return;
                  }
                }
              }
            }
            // If refresh failed, only clear if we got a 401 (unauthorized)
            console.log('❌ AuthContext: Token refresh failed, checking error type...');
            // Don't clear tokens yet - might be a temporary network issue
            // Only clear if we explicitly get a 401
            const cachedUserData = await AsyncStorage.getItem('cachedUserData');
            if (cachedUserData) {
              try {
                const user: User = JSON.parse(cachedUserData);
                console.log('⚠️ AuthContext: Using cached user data due to auth failure');
                setUser(user);
                setIsLoading(false);
                return;
              } catch {}
            }
            // Last resort: clear tokens only if we have no cached data
            console.log('❌ AuthContext: No cached data, clearing tokens');
            await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
            setUser(null);
          }
        } catch (error: any) {
          console.log('⚠️ AuthContext: Error fetching user profile:', error?.message || error);
          
          // Check if it's a network error (no internet)
          const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
          const isTimeoutError = error instanceof Error && (error.message.includes('timeout') || error.message.includes('network'));
          const isConnectionError = error instanceof Error && (
            error.message.includes('Network request failed') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('Connection refused')
          );
          
          // Check if it's a 401 (unauthorized) - token is invalid
          const isUnauthorized = error?.response?.status === 401 || 
                                 error?.status === 401 ||
                                 (error?.message && error.message.includes('401'));
          
          if (isNetworkError || isTimeoutError || isConnectionError || !isOnline) {
            console.log('🌐 AuthContext: Network error detected, using offline mode');
            setIsOfflineMode(true);
            
            // Try to get cached user data from AsyncStorage
            try {
              const cachedUserData = await AsyncStorage.getItem('cachedUserData');
              if (cachedUserData) {
                const user: User = JSON.parse(cachedUserData);
                console.log('✅ AuthContext: Using cached user data (offline mode)');
                setUser(user);
                setIsLoading(false);
                return;
              }
            } catch (cacheError) {
              console.log('⚠️ AuthContext: Error reading cached user data:', cacheError);
            }
            
            // If no cached data but we have tokens, keep them and show offline user
            // Don't clear tokens on network errors - they might still be valid
            console.log('⚠️ AuthContext: No cached data, but keeping tokens for offline mode');
            setUser({ 
              id: 'offline-user', 
              email: 'offline@user.com', 
              name: 'Offline User',
              createdAt: new Date().toISOString()
            } as User);
            setIsLoading(false);
            return;
          }
          
          // If it's a 401 (unauthorized), the token is invalid - try refresh
          if (isUnauthorized) {
            console.log('🔐 AuthContext: 401 Unauthorized - token invalid, trying refresh...');
            if (refreshTokenValue) {
              const refreshOk = await refreshToken();
              if (refreshOk) {
                const newToken = await AsyncStorage.getItem('authToken');
                if (newToken) {
                  try {
                    const retryData = await apiClient.get(`${API_BASE_URL}/auth/me`, {
                      'Authorization': `Bearer ${newToken}`,
                    });
                    if (retryData.success && retryData.data) {
                      console.log('✅ AuthContext: User profile loaded after refresh');
                      const retryUser: User = {
                        id: retryData.data.id,
                        email: retryData.data.email,
                        name: retryData.data.name,
                        phone: retryData.data.phone,
                        avatar: undefined,
                        createdAt: retryData.data.createdAt,
                      };
                      setUser(retryUser);
                      await AsyncStorage.setItem('cachedUserData', JSON.stringify(retryUser));
                      setIsLoading(false);
                      return;
                    }
                  } catch (retryError) {
                    console.log('⚠️ AuthContext: Retry after refresh failed:', retryError);
                  }
                }
              } else {
                console.log('❌ AuthContext: Token refresh failed');
              }
            }
            
            // Only clear tokens if refresh failed AND we got a 401
            // Try to use cached data first
            const cachedUserData = await AsyncStorage.getItem('cachedUserData');
            if (cachedUserData) {
              try {
                const user: User = JSON.parse(cachedUserData);
                console.log('⚠️ AuthContext: Using cached user data (auth failed, refresh failed)');
                setUser(user);
                setIsLoading(false);
                return;
              } catch {}
            }
            
            // Last resort: clear tokens only if refresh failed and no cached data
            console.log('❌ AuthContext: Clearing tokens - refresh failed and no cached data');
            await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
            setUser(null);
          } else {
            // For other errors (500, etc.), don't clear tokens - might be server issue
            console.log('⚠️ AuthContext: Non-auth error, keeping tokens and trying cached data');
            const cachedUserData = await AsyncStorage.getItem('cachedUserData');
            if (cachedUserData) {
              try {
                const user: User = JSON.parse(cachedUserData);
                setUser(user);
                setIsLoading(false);
                return;
              } catch {}
            }
            // Keep tokens but set user to null temporarily
            setUser(null);
          }
        }
      } else {
        console.log('ℹ️ AuthContext: No auth token found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error loading user:', error);
      // Don't clear tokens on unexpected errors - might be a bug
      const cachedUserData = await AsyncStorage.getItem('cachedUserData');
      if (cachedUserData) {
        try {
          const user: User = JSON.parse(cachedUserData);
          setUser(user);
        } catch {}
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // DEPRECATED: Email/password login removed - app is now fully passwordless
  // Use OTP authentication flow instead (OTPRequestScreen -> OTPVerifyScreen)
  /*
  const login = async (email: string, password: string) => {
    throw new Error('Email/password login is no longer supported. Please use OTP authentication.');
  };
  */

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('🔄 AuthContext: Attempting token refresh...');
      
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        console.log('🔄 AuthContext: No refresh token found');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        console.log('🔄 AuthContext: Token refresh failed');
        return false;
      }

      const data = await response.json();
      console.log('🔄 AuthContext: Token refreshed successfully');
      
      // Store new access token
      await AsyncStorage.setItem('authToken', data.data.accessToken);
      
      return true;
    } catch (error) {
      console.error('🔄 AuthContext: Token refresh error:', error);
      return false;
    }
  };

  // DEPRECATED: Email/password registration removed - app is now fully passwordless
  // Use OTP signup flow instead (OTPRequestScreen -> OTPVerifyScreen -> CompleteSignupScreen)
  /*
  const register = async (name: string, email: string, password: string, phone?: string) => {
    throw new Error('Email/password registration is no longer supported. Please use OTP signup.');
  };
  */


  const logout = async () => {
    try {
      console.log('🔍 AuthContext: Starting logout - clearing all data...');
      
      // Clear ALL local data including user data, tokens, and any cached data
      await clearAllUserData();
      
      setUser(null);
      console.log('✅ Logout successful - all local data cleared, cloud data only');
    } catch (error) {
      console.error('❌ AuthContext: Error during logout:', error);
    }
  };

  const registerForPushNotifications = async () => {
    try {
      console.log('📱 AuthContext: Starting push notification registration...');
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('📱 AuthContext: Push notification permission denied by user');
        return;
      }

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 AuthContext: Push notification token received:', token);

      // Register token with backend
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('📱 AuthContext: No auth token, skipping push registration');
        return;
      }

      const platform = Platform.OS;

      const response = await fetch(`${API_BASE_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform,
          deviceInfo: {
            brand: Platform.OS === 'ios' ? 'Apple' : 'Google',
            modelName: 'Unknown',
            osName: Platform.OS,
            osVersion: 'Unknown',
          },
        }),
      });

      if (response.ok) {
        console.log('✅ AuthContext: Push notification token registered successfully');
      } else {
        console.error('❌ AuthContext: Failed to register push token:', response.status);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error registering for push notifications:', error);
      // Don't throw - this is non-critical
    }
  };

  const clearAllUserData = async () => {
    try {
      console.log('🔍 AuthContext: Clearing all local data...');
      
      // Check what's in AsyncStorage before clearing
      const authToken = await AsyncStorage.getItem('authToken');
      console.log('🔍 AuthContext: Auth token before clear:', authToken ? 'Token exists' : 'No token');
      
      // Clear all AsyncStorage data
      await AsyncStorage.clear();
      
      // Verify tokens are cleared
      const clearedToken = await AsyncStorage.getItem('authToken');
      console.log('🔍 AuthContext: Auth token after clear:', clearedToken ? 'Token still exists' : 'Token cleared');
      
      // Reset user state
      setUser(null);
      
      console.log('✅ AuthContext: All local data cleared - app now uses cloud data only');
    } catch (error) {
      console.error('❌ AuthContext: Error clearing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    setUser,
    // login, // Removed - use OTP authentication
    // register, // Removed - use OTP signup
    logout,
    clearAllUserData,
    refreshToken,
    isLoading,
    isOnline,
    isOfflineMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



