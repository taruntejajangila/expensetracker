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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
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
    // Simple network detection using periodic checks
    const checkNetwork = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const wasOnline = isOnline;
        const nowOnline = response.ok;
        
        setIsOnline(nowOnline);
        
        if (!wasOnline && nowOnline) {
          console.log('🌐 AuthContext: Back online - attempting to sync');
          setIsOfflineMode(false);
          // Try to refresh token when back online
          refreshToken().catch(() => {
            console.log('🌐 AuthContext: Token refresh failed after coming online');
          });
        } else if (wasOnline && !nowOnline) {
          console.log('🌐 AuthContext: Gone offline - switching to offline mode');
          setIsOfflineMode(true);
        }
      } catch (error) {
        const wasOnline = isOnline;
        setIsOnline(false);
        if (wasOnline) {
          console.log('🌐 AuthContext: Gone offline - switching to offline mode');
          setIsOfflineMode(true);
        }
      }
    };
    
    // Check network status every 10 seconds
    const interval = setInterval(checkNetwork, 10000);
    
    // Initial check
    checkNetwork();
    
    return () => clearInterval(interval);
  };

  const loadUser = async () => {
    try {
      // Check if there's a stored auth token
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        console.log('🔍 AuthContext: Found stored token, validating...');
        const apiClient = ApiClient.getInstance();

        try {
          const userData = await apiClient.get(`${API_BASE_URL}/auth/me`, {
            'Authorization': `Bearer ${token}`,
          });

          if (userData.success && userData.data) {
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
            console.log('🔍 AuthContext: User restored from valid token and cached for offline mode');
          } else {
            console.log('🔍 AuthContext: Invalid token response, attempting refresh...');
            // Try one refresh before clearing
            const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
            if (storedRefreshToken) {
              const refreshOk = await refreshToken();
              if (refreshOk) {
                const newToken = await AsyncStorage.getItem('authToken');
                if (newToken) {
                  const retryData = await apiClient.get(`${API_BASE_URL}/auth/me`, {
                    'Authorization': `Bearer ${newToken}`,
                  });
                  if (retryData.success && retryData.data) {
                    const retryUser: User = {
                      id: retryData.data.id,
                      email: retryData.data.email,
                      name: retryData.data.name,
                      phone: retryData.data.phone,
                      avatar: undefined,
                      createdAt: retryData.data.createdAt,
                    };
                    setUser(retryUser);
                    console.log('🔍 AuthContext: User restored after refresh');
                    return;
                  }
                }
              }
            }
            // If refresh failed
            await AsyncStorage.clear();
            setUser(null);
          }
        } catch (error) {
          console.log('🔍 AuthContext: Token validation error, checking if it\'s network issue...', error);
          
          // Check if it's a network error (no internet)
          const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
          const isTimeoutError = error instanceof Error && (error.message.includes('timeout') || error.message.includes('network'));
          const isConnectionError = error instanceof Error && (
            error.message.includes('Network request failed') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('Connection refused')
          );
          
          if (isNetworkError || isTimeoutError || isConnectionError || !isOnline) {
            console.log('🔍 AuthContext: Network error detected - keeping user logged in with stored data');
            setIsOfflineMode(true);
            
            // Try to get cached user data from AsyncStorage
            try {
              const cachedUserData = await AsyncStorage.getItem('cachedUserData');
              if (cachedUserData) {
                const user: User = JSON.parse(cachedUserData);
                setUser(user);
                console.log('🔍 AuthContext: User restored from cache (offline mode)');
                return;
              }
            } catch (cacheError) {
              console.log('🔍 AuthContext: No cached user data available');
            }
            
            // If no cached data, but we have a token, assume user is valid (offline mode)
            console.log('🔍 AuthContext: No internet - user stays logged in (offline mode)');
            setUser({ 
              id: 'offline-user', 
              email: 'offline@user.com', 
              name: 'Offline User',
              createdAt: new Date().toISOString()
            } as User);
            return;
          }
          
          // If it's not a network error, proceed with normal token refresh
          console.log('🔍 AuthContext: Non-network error, attempting token refresh...');
          const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
          if (storedRefreshToken) {
            const refreshOk = await refreshToken();
            if (refreshOk) {
              const newToken = await AsyncStorage.getItem('authToken');
              if (newToken) {
                try {
                  const retryData = await apiClient.get(`${API_BASE_URL}/auth/me`, {
                    'Authorization': `Bearer ${newToken}`,
                  });
                  if (retryData.success && retryData.data) {
                    const retryUser: User = {
                      id: retryData.data.id,
                      email: retryData.data.email,
                      name: retryData.data.name,
                      phone: retryData.data.phone,
                      avatar: undefined,
                      createdAt: retryData.data.createdAt,
                    };
                    setUser(retryUser);
                    console.log('🔍 AuthContext: User restored after refresh');
                    return;
                  }
                } catch {}
              }
            }
          }
          await AsyncStorage.clear();
          setUser(null);
        }
      } else {
        console.log('🔍 AuthContext: No stored token - user must login');
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 AuthContext: Starting login process...');
      
      // Check if we're offline
      if (!isOnline) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      const apiClient = ApiClient.getInstance();
      
      // Call the backend login API with retry logic
      const result = await apiClient.post(`${API_BASE_URL}/auth/login`, {
        email: email,
        password: password,
      });

      console.log('🔍 AuthContext: Login API success:', result);

      if (result.success && result.data) {
        const { user: userData, accessToken, refreshToken } = result.data;
        
        // Clear any existing local data first
        await clearAllUserData();
        
        // Create user object (no local storage)
        const user: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          avatar: undefined,
          createdAt: userData.createdAt,
        };
        
        console.log('🔍 AuthContext: Creating user (no local storage):', user);
        
        // Store auth tokens temporarily in memory only
        // These will be cleared on logout
        console.log('🔍 AuthContext: Storing auth token:', accessToken ? 'Token stored' : 'No token');
        await AsyncStorage.setItem('authToken', accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }
        console.log('🔍 AuthContext: Auth tokens stored successfully');
        
        setUser(user);
        
        // Cache user data for offline mode
        await AsyncStorage.setItem('cachedUserData', JSON.stringify(user));
        console.log('✅ AuthContext: Login successful - cloud data only, cached for offline mode');
        
        // Auto-register for push notifications after login
        await registerForPushNotifications();
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

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

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 AuthContext: Starting registration process...');
      
      // Check if we're offline
      if (!isOnline) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      const apiClient = ApiClient.getInstance();
      
      // Call the backend registration API with retry logic
      const registerData: any = {
        name: name,
        email: email,
        password: password
      };
      
      if (phone) {
        registerData.phone = phone;
      }
      
      const result = await apiClient.post(`${API_BASE_URL}/auth/register`, registerData);

      console.log('🔍 AuthContext: Registration API success:', result);

      if (result.success && result.data) {
        const { user: userData, accessToken, refreshToken } = result.data;
        
        // Clear any existing local data first
        await clearAllUserData();
        
        // Create user object (no local storage)
        const newUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          avatar: undefined,
          createdAt: userData.createdAt,
        };
        
        console.log('🔍 AuthContext: Creating user (no local storage):', newUser);
        
        // Store auth tokens temporarily in memory only
        // These will be cleared on logout
        console.log('🔍 AuthContext: Storing auth token:', accessToken ? 'Token stored' : 'No token');
        await AsyncStorage.setItem('authToken', accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }
        console.log('🔍 AuthContext: Auth tokens stored successfully');
        
        setUser(newUser);
        console.log('✅ AuthContext: Registration successful - cloud data only');
        
        // Auto-register for push notifications after registration
        await registerForPushNotifications();
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };


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
    login,
    register,
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



