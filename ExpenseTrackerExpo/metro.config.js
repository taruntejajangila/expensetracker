const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Hermes _toString issue
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Note: sourceExts and assetExts are inherited from getDefaultConfig
// No need to override them unless adding custom extensions

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

// Ensure proper asset resolution (these are already in defaults, but keeping for clarity)
config.resolver.assetExts = [
  ...(config.resolver.assetExts || []),
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

// Block problematic .bin directories from being resolved
config.resolver.blockList = [
  /node_modules\/\.bin\/.*/,
  /.*\.bin\/\..*/,
];

// Configure watcher to ignore problematic paths
config.watchFolders = [__dirname];
config.resolver.sourceExts = config.resolver.sourceExts || [];
config.resolver.assetExts = config.resolver.assetExts || [];

// Use a more permissive watcher configuration
if (!config.watcher) {
  config.watcher = {};
}
// Ignore node_modules in watcher (should be default, but being explicit)
config.watcher.watchman = config.watcher.watchman || {};
config.watcher.watchman.ignore_dirs = [
  'node_modules',
  '.git',
  '.expo',
  'android',
  'ios',
];

module.exports = config;