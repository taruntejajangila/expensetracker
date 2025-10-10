/**
 * API Configuration
 * Automatically switches between local and production based on __DEV__
 */

// 🔧 LOCAL DEVELOPMENT - Change this to your computer's IP
const LOCAL_API_URL = 'http://192.168.29.14:5000/api';

// ☁️ PRODUCTION - Change this when you deploy to Railway
const PRODUCTION_API_URL = 'https://your-backend.railway.app/api';

/**
 * Automatically uses:
 * - LOCAL_API_URL when running in development (npm start)
 * - PRODUCTION_API_URL when running in production (APK build)
 */
export const API_BASE_URL = __DEV__ ? LOCAL_API_URL : PRODUCTION_API_URL;

// Export both for manual override if needed
export const API_CONFIG = {
  LOCAL: LOCAL_API_URL,
  PRODUCTION: PRODUCTION_API_URL,
  CURRENT: API_BASE_URL,
};

console.log('🌐 API Configuration Loaded:');
console.log(`   Mode: ${__DEV__ ? '🔧 DEVELOPMENT' : '☁️ PRODUCTION'}`);
console.log(`   API URL: ${API_BASE_URL}`);

