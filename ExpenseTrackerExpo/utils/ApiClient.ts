/**
 * Enhanced API Client with retry logic, exponential backoff, rate limiting handling, and automatic token refresh
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleNetworkError } from './NetworkErrorHandler';
import { API_BASE_URL } from '../config/api.config';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

class ApiClient {
  private static instance: ApiClient;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private minRequestInterval = 500; // Minimum 500ms between requests to same endpoint (increased to reduce rate limiting)
  private isRefreshing = false; // Prevent multiple simultaneous refresh attempts
  private refreshPromise: Promise<string | null> | null = null; // Cache refresh promise

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Get stored auth token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Public method to get auth token (for FormData uploads)
  public async getToken(): Promise<string | null> {
    return this.getAuthToken();
  }

  /**
   * Store auth token
   */
  private async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  }

  /**
   * Get stored refresh token
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('🔄 ApiClient: Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    // Start new refresh process
    this.isRefreshing = true;
    this.refreshPromise = this._performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Store refresh token
   */
  private async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('refreshToken', token);
    } catch (error) {
      console.error('Error storing refresh token:', error);
    }
  }

  /**
   * Perform the actual token refresh with automatic refresh token renewal
   */
  private async _performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        console.log('❌ ApiClient: No refresh token available');
        return null;
      }

      console.log('🔄 ApiClient: Refreshing access token...');
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.log('❌ ApiClient: Token refresh failed:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success && result.data?.accessToken) {
        const newAccessToken = result.data.accessToken;
        await this.setAuthToken(newAccessToken);
        
        // Check if refresh token was also renewed
        if (result.data.refreshToken && result.data.refreshToken !== refreshToken) {
          console.log('🔄 ApiClient: Refresh token was renewed automatically');
          await this.setRefreshToken(result.data.refreshToken);
        }
        
        console.log('✅ ApiClient: Access token refreshed successfully');
        return newAccessToken;
      } else {
        console.log('❌ ApiClient: Invalid refresh response:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ ApiClient: Token refresh error:', error);
      handleNetworkError(error);
      return null;
    }
  }

  /**
   * Check if token is close to expiration and refresh proactively
   */
  private async checkAndRefreshTokenProactively(): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) return;

      // Decode token to check expiration (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;

      // Refresh if token expires within 120 seconds
      if (timeUntilExpiry < 120 && timeUntilExpiry > 0) {
        console.log(`🔄 ApiClient: Token expires in ${Math.floor(timeUntilExpiry / 3600)} hours, refreshing proactively...`);
        await this.refreshAccessToken();
      }
    } catch (error) {
      console.error('❌ ApiClient: Error checking token expiration:', error);
    }
  }

  /**
   * Make API request with retry logic, rate limiting protection, and automatic token refresh
   */
  async request<T = any>(
    url: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2
    } = retryOptions;

    const requestKey = `${options.method || 'GET'}:${url}`;
    
    // Check if there's already a request in progress for this endpoint
    if (this.requestQueue.has(requestKey)) {
      console.log('🔄 ApiClient: Request already in progress, waiting...');
      return this.requestQueue.get(requestKey)!;
    }

    // Throttle requests to prevent rapid-fire calls
    const lastRequest = this.lastRequestTime.get(requestKey);
    const now = Date.now();
    if (lastRequest && (now - lastRequest) < this.minRequestInterval) {
      const delay = this.minRequestInterval - (now - lastRequest);
      console.log(`⏱️ ApiClient: Throttling request, waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Check and refresh token proactively before making request
    await this.checkAndRefreshTokenProactively();

    const requestPromise = this._makeRequestWithRetryAndTokenRefresh<T>(
      url,
      options,
      maxRetries,
      baseDelay,
      maxDelay,
      backoffMultiplier
    );

    this.requestQueue.set(requestKey, requestPromise);
    this.lastRequestTime.set(requestKey, Date.now());

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(requestKey);
    }
  }

  /**
   * Make request with retry logic and automatic token refresh
   */
  private async _makeRequestWithRetryAndTokenRefresh<T>(
    url: string,
    options: RequestInit,
    maxRetries: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;
    let hasTriedTokenRefresh = false;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 ApiClient: Attempt ${attempt + 1}/${maxRetries + 1} - ${options.method || 'GET'} ${url}`);
        
        // Get current auth token and add to headers if present
        const authToken = await this.getAuthToken();
        const headers = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        // Add authorization header if token exists and URL is not auth-related
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this._calculateBackoffDelay(attempt, baseDelay, maxDelay, backoffMultiplier);
          
          console.log(`⏳ ApiClient: Rate limited (429), waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
        }

        // Handle authentication errors with automatic token refresh
        // Allow refresh for all non-auth endpoints AND specifically for /auth/me validation
        const isAuthEndpoint = url.includes('/auth/');
        const isAuthMe = url.includes('/auth/me');
        if (response.status === 401 && !hasTriedTokenRefresh && authToken && (!isAuthEndpoint || isAuthMe)) {
          console.log('🔄 ApiClient: 401 error detected, attempting token refresh...');
          
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            console.log('✅ ApiClient: Token refreshed, retrying request...');
            hasTriedTokenRefresh = true;
            // Retry the same attempt with new token
            attempt--;
            continue;
          } else {
            console.log('❌ ApiClient: Token refresh failed, user needs to re-login');
            throw new Error('Authentication expired. Please login again.');
          }
        }

        // Handle other HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log(`✅ ApiClient: Request successful on attempt ${attempt + 1}`);
        return result;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ApiClient: Attempt ${attempt + 1} failed:`, error);

        // Handle network errors
        handleNetworkError(error);

        // Don't retry on certain errors
        if (this._isNonRetryableError(error as Error)) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this._calculateBackoffDelay(attempt, baseDelay, maxDelay, backoffMultiplier);
        console.log(`⏳ ApiClient: Waiting ${delay}ms before retry ${attempt + 2}/${maxRetries + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private async _makeRequestWithRetry<T>(
    url: string,
    options: RequestInit,
    maxRetries: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 ApiClient: Attempt ${attempt + 1}/${maxRetries + 1} - ${options.method || 'GET'} ${url}`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this._calculateBackoffDelay(attempt, baseDelay, maxDelay, backoffMultiplier);
          
          console.log(`⏳ ApiClient: Rate limited (429), waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
        }

        // Handle other HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log(`✅ ApiClient: Request successful on attempt ${attempt + 1}`);
        return result;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ApiClient: Attempt ${attempt + 1} failed:`, error);

        // Handle network errors
        handleNetworkError(error);

        // Don't retry on certain errors
        if (this._isNonRetryableError(error as Error)) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this._calculateBackoffDelay(attempt, baseDelay, maxDelay, backoffMultiplier);
        console.log(`⏳ ApiClient: Waiting ${delay}ms before retry ${attempt + 2}/${maxRetries + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private _calculateBackoffDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number
  ): number {
    const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelay);
  }

  private _isNonRetryableError(error: Error): boolean {
    const nonRetryablePatterns = [
      /invalid.*token/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /bad request/i,
    ];

    return nonRetryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Convenience method for GET requests with automatic token refresh
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Convenience method for POST requests with automatic token refresh
   */
  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  /**
   * Convenience method for PUT requests with automatic token refresh
   */
  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  /**
   * Convenience method for DELETE requests with automatic token refresh
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * Convenience method for PATCH requests with automatic token refresh
   */
  async patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export default ApiClient;

