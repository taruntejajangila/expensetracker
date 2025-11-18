import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';

let refreshPromise: Promise<boolean> | null = null;

const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('🔐 authenticatedRequest: Error reading access token:', error);
    return null;
  }
};

const performTokenRefresh = async (): Promise<boolean> => {
  try {
    const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      console.warn('🔐 authenticatedRequest: No refresh token available');
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
      console.warn('🔐 authenticatedRequest: Refresh token request failed:', response.status);
      return false;
    }

    const result = await response.json();
    if (result.success && result.data?.accessToken) {
      await AsyncStorage.setItem('authToken', result.data.accessToken);
      if (result.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', result.data.refreshToken);
      }
      console.log('✅ authenticatedRequest: Token refreshed successfully');
      return true;
    }

    console.warn('🔐 authenticatedRequest: Refresh response missing tokens');
    return false;
  } catch (error) {
    console.error('❌ authenticatedRequest: Error refreshing token:', error);
    return false;
  }
};

const refreshToken = async (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const buildHeaders = async (existingHeaders?: HeadersInit): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (existingHeaders) {
    Object.entries(existingHeaders).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  const token = await getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let response = await fetch(url, {
    ...options,
    headers: await buildHeaders(options.headers),
  });

  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: await buildHeaders(options.headers),
      });
    }
  }

  return response;
};

