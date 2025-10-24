/**
 * Admin Panel API Configuration
 * Centralized API URL management
 */

// Get API URL from environment variable or use default
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expensetracker-production-eb9c.up.railway.app/api';

// Get server URL (without /api) for image paths
export const SERVER_BASE_URL = API_BASE_URL.replace('/api', '');

// Export configuration object
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  SERVER_URL: SERVER_BASE_URL,
};

// Log configuration (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🌐 Admin Panel API Configuration:');
  console.log(`   API URL: ${API_BASE_URL}`);
  console.log(`   Server URL: ${SERVER_BASE_URL}`);
}

