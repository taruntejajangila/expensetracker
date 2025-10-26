/**
 * API Configuration
 * Automatically switches between local and production based on __DEV__
 */

// 🔧 LOCAL DEVELOPMENT - Change this to your computer's IP
const LOCAL_API_URL = 'http://192.168.29.14:5000/api';

// ☁️ PRODUCTION - Railway Backend URL
const PRODUCTION_API_URL = 'https://generous-miracle-production-245f.up.railway.app/api';

// 🔀 FORCE CLOUD MODE - Set to true to use cloud backend even in development
const FORCE_CLOUD_MODE = true;

/**
 * Automatically uses:
 * - PRODUCTION_API_URL when FORCE_CLOUD_MODE is true (for testing with cloud)
 * - LOCAL_API_URL when running in development (npm start)
 * - PRODUCTION_API_URL when running in production (APK build)
 */
export const API_BASE_URL = FORCE_CLOUD_MODE ? PRODUCTION_API_URL : (__DEV__ ? LOCAL_API_URL : PRODUCTION_API_URL);

// Export both for manual override if needed
export const API_CONFIG = {
  LOCAL: LOCAL_API_URL,
  PRODUCTION: PRODUCTION_API_URL,
  CURRENT: API_BASE_URL,
};

console.log('🌐 API Configuration Loaded:');
console.log(`   Mode: ${__DEV__ ? '🔧 DEVELOPMENT' : '☁️ PRODUCTION'}`);
console.log(`   API URL: ${API_BASE_URL}`);

