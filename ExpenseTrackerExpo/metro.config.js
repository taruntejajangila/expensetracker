const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Hermes _toString issue
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure proper module resolution
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];

// Comprehensive Hermes fixes
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
  compress: {
    keep_fnames: true,
  },
};

// Disable Hermes optimizations that cause _toString issues
config.transformer.hermesParser = false;

// Ensure proper asset resolution
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
];

// Additional resolver configuration
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Suppress package warnings
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
