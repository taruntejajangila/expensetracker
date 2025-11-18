import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';
import { throttleRequest } from '../utils/requestThrottle';

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

/**
 * Check if token is close to expiration and refresh proactively
 * This prevents 401 errors by refreshing tokens before they expire
 */
const checkAndRefreshTokenProactively = async (): Promise<void> => {
  try {
    const token = await getAccessToken();
    if (!token) return;

    // Decode token to check expiration (without verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;

      // Refresh if token expires within 5 minutes (300 seconds)
      // This gives us plenty of time to refresh before expiration
      if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
        const minutesLeft = Math.floor(timeUntilExpiry / 60);
        console.log(`🔄 authenticatedRequest: Token expires in ${minutesLeft} minutes, refreshing proactively...`);
        await refreshToken();
      }
    } catch (decodeError) {
      // If we can't decode the token, it might be invalid - don't refresh proactively
      console.warn('⚠️ authenticatedRequest: Could not decode token for proactive refresh check');
    }
  } catch (error) {
    console.error('❌ authenticatedRequest: Error checking token expiration:', error);
  }
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
  // Client-side throttling: prevent rapid successive calls
  await throttleRequest(url, 10, 1000, 100); // Max 10 requests per second, min 100ms between requests
  
  // Proactively refresh token if it's close to expiration (before making the request)
  // This prevents 401 errors and keeps the user logged in seamlessly
  await checkAndRefreshTokenProactively();
  
  let response = await fetch(url, {
    ...options,
    headers: await buildHeaders(options.headers),
  });

  // Handle 401 - token refresh
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: await buildHeaders(options.headers),
      });
    }
  }

  // Handle 429 - rate limit with retry (exponential backoff)
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000; // Default 2 seconds
    
    console.warn(`⏳ Rate limit hit (429), waiting ${waitTime}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Retry once after waiting
    response = await fetch(url, {
      ...options,
      headers: await buildHeaders(options.headers),
    });
    
    // If still rate limited, throw a more user-friendly error
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({ message: 'Too many requests' }));
      throw new Error(`Rate limit exceeded. Please wait a moment and try again. ${errorData.message || ''}`);
    }
  }

  return response;
};

