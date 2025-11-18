/**
 * Client-side request throttling to prevent rapid successive API calls
 * This helps avoid hitting rate limits by spacing out requests
 */

interface ThrottleEntry {
  lastRequestTime: number;
  requestCount: number;
  resetTime: number;
}

// Store throttle state per endpoint
const throttleMap = new Map<string, ThrottleEntry>();

// Default throttle settings
const DEFAULT_MAX_REQUESTS = 10; // Max requests per window
const DEFAULT_WINDOW_MS = 1000; // 1 second window
const DEFAULT_MIN_DELAY_MS = 100; // Minimum delay between requests (100ms)

/**
 * Throttle a request to prevent rapid successive calls
 * @param endpoint The API endpoint being called
 * @param maxRequests Maximum requests allowed in the window (default: 10)
 * @param windowMs Time window in milliseconds (default: 1000ms = 1 second)
 * @param minDelayMs Minimum delay between requests in milliseconds (default: 100ms)
 * @returns Promise that resolves when it's safe to make the request
 */
export const throttleRequest = async (
  endpoint: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowMs: number = DEFAULT_WINDOW_MS,
  minDelayMs: number = DEFAULT_MIN_DELAY_MS
): Promise<void> => {
  const now = Date.now();
  const key = endpoint.split('?')[0]; // Use base path without query params
  
  let entry = throttleMap.get(key);
  
  // Initialize or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      lastRequestTime: 0,
      requestCount: 0,
      resetTime: now + windowMs
    };
    throttleMap.set(key, entry);
  }
  
  // Check if we've exceeded the request limit
  if (entry.requestCount >= maxRequests) {
    const waitTime = entry.resetTime - now;
    if (waitTime > 0) {
      console.log(`⏳ Throttling request to ${key}: waiting ${waitTime}ms (${entry.requestCount}/${maxRequests} requests in window)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Reset after waiting
      entry.requestCount = 0;
      entry.resetTime = Date.now() + windowMs;
    }
  }
  
  // Enforce minimum delay between requests
  const timeSinceLastRequest = now - entry.lastRequestTime;
  if (timeSinceLastRequest < minDelayMs) {
    const waitTime = minDelayMs - timeSinceLastRequest;
    console.log(`⏳ Throttling request to ${key}: minimum delay ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update entry
  entry.lastRequestTime = Date.now();
  entry.requestCount++;
  throttleMap.set(key, entry);
};

/**
 * Clear throttle state for an endpoint (useful for testing or reset)
 */
export const clearThrottle = (endpoint: string): void => {
  const key = endpoint.split('?')[0];
  throttleMap.delete(key);
};

/**
 * Clear all throttle state
 */
export const clearAllThrottles = (): void => {
  throttleMap.clear();
};

