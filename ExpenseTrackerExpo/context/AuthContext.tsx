import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAllUserData: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Check if there's a stored auth token
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        console.log('🔍 AuthContext: Found stored token, validating...');
        
        // Validate token with backend
        const API_BASE_URL = 'http://192.168.29.14:5001/api';
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.success && userData.data) {
              const user: User = {
                id: userData.data.id,
                email: userData.data.email,
                name: userData.data.name,
                avatar: undefined,
                createdAt: userData.data.createdAt,
              };
              setUser(user);
              console.log('🔍 AuthContext: User restored from valid token');
            } else {
              console.log('🔍 AuthContext: Invalid token response, clearing...');
              await AsyncStorage.clear();
              setUser(null);
            }
          } else {
            console.log('🔍 AuthContext: Token validation failed, clearing...');
            await AsyncStorage.clear();
            setUser(null);
          }
        } catch (error) {
          console.log('🔍 AuthContext: Token validation error, clearing...', error);
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
      
      const API_BASE_URL = 'http://192.168.29.14:5001/api';
      
      // Call the backend login API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      console.log('🔍 AuthContext: Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 AuthContext: Login API error:', errorData);
        throw new Error(errorData.message || `Login failed with status ${response.status}`);
      }

      const result = await response.json();
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
        console.log('✅ AuthContext: Login successful - cloud data only');
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

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 AuthContext: Starting registration process...');
      
      const API_BASE_URL = 'http://192.168.29.14:5001/api';
      
      // Call the backend registration API
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password
          // phone field removed to avoid validation issues
        }),
      });

      console.log('🔍 AuthContext: Registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 AuthContext: Registration API error:', errorData);
        throw new Error(errorData.message || `Registration failed with status ${response.status}`);
      }

      const result = await response.json();
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
    login,
    register,
    logout,
    clearAllUserData,
    isLoading,
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

