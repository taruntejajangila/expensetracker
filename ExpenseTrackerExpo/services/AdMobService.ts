import Constants from 'expo-constants';

// Detect if running in Expo Go or production build
const isExpoGo = !Constants.executionEnvironment || Constants.executionEnvironment === 'storeClient';
const isProduction = Constants.executionEnvironment === 'storeClient';

console.log('🔍 AdMob Environment Check:');
console.log(`Execution Environment: ${Constants.executionEnvironment}`);
console.log(`Is Expo Go: ${isExpoGo}`);
console.log(`Is Production: ${isProduction}`);

// Conditionally import based on environment
let AdMobService: any;

if (isProduction || !isExpoGo) {
  // Production build: Use real AdMob
  try {
    AdMobService = require('./AdMobServiceReal').default;
    console.log('📱 Using REAL AdMob implementation');
  } catch (error) {
    console.log('⚠️ Real AdMob not available, falling back to mock');
    AdMobService = require('./AdMobServiceMock').default;
  }
} else {
  // Expo Go: Use mock ads
  AdMobService = require('./AdMobServiceMock').default;
  console.log('🎭 Using MOCK AdMob implementation (Expo Go)');
}

export default AdMobService;
