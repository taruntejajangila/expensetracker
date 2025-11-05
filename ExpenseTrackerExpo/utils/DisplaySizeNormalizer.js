import { PixelRatio, Dimensions, Platform, AppState } from 'react-native';

/**
 * Display Size Normalizer - ALWAYS USE MINIMUM SIZE
 * 
 * This utility forces the app to ALWAYS use minimum (smallest) display size,
 * regardless of system display size settings.
 * 
 * IMPORTANT: This runs IMMEDIATELY on module load, before any component can use Dimensions
 */

// CRITICAL: Always use minimum density (smallest display size)
// This ensures the app UI is always small and consistent, regardless of system settings
let fixedPixelRatio = null;
let fixedWindowDimensions = null;
let fixedScreenDimensions = null;
let normalized = false;
let originalPixelRatioGet = null;
let originalGet = null;
let originalAddEventListener = null;

// IMMEDIATE OVERRIDES - Force minimum display size
if (Platform.OS === 'android') {
  try {
    // Get current dimensions to calculate minimum
    originalPixelRatioGet = PixelRatio.get.bind(PixelRatio);
    originalGet = Dimensions.get.bind(Dimensions);
    
    // Get system dimensions (these are what Android reports based on display size setting)
    const systemPixelRatio = originalPixelRatioGet();
    const systemWindow = originalGet('window');
    const systemScreen = originalGet('screen');
    
    // UNIVERSAL MINIMUM DENSITY for all Android devices
    // Based on Android CDD and real-world device testing:
    // - Modern phones (2018+): Base density 2.5-3.5, minimum display size = ~2.0
    // - Mid-range phones: Base density 2.0-3.0, minimum display size = ~1.5-2.0
    // - Older/low-end phones: Base density 1.5-2.5, minimum display size = ~1.5
    // 
    // For universal compatibility across ALL devices, we use 1.5 as the minimum
    // This ensures:
    // - Works on all devices (even very old ones)
    // - App UI is always small/compact
    // - Consistent experience regardless of device or user settings
    const UNIVERSAL_MINIMUM_DENSITY = 1.5;
    
    // Use the lower of: universal minimum (1.5) or device's actual minimum
    // This ensures we never go below what the device can handle
    const MINIMUM_DENSITY = Math.min(UNIVERSAL_MINIMUM_DENSITY, systemPixelRatio);
    
    // Calculate dimensions at minimum density
    // Width/height stay same (physical pixels), but scale changes
    fixedPixelRatio = MINIMUM_DENSITY;
    fixedWindowDimensions = {
      width: systemWindow.width, // Physical width stays same
      height: systemWindow.height, // Physical height stays same
    };
    fixedScreenDimensions = {
      width: systemScreen.width, // Physical width stays same
      height: systemScreen.height, // Physical height stays same
    };
    
    // IMMEDIATELY override to force minimum size
    PixelRatio.get = function() {
      return fixedPixelRatio; // Always return minimum density
    };
    
    Dimensions.get = function(dim) {
      const base = dim === 'window' ? fixedWindowDimensions : fixedScreenDimensions;
      return {
        width: base.width,
        height: base.height,
        scale: fixedPixelRatio, // Always use minimum scale
        fontScale: 1.0,
      };
    };
    
    console.log('🔒 FORCING MINIMUM DISPLAY SIZE - Density:', fixedPixelRatio);
    console.log('   System density was:', systemPixelRatio, '→ Using minimum:', fixedPixelRatio);
  } catch (e) {
    console.error('❌ Error in minimum size override:', e);
  }
}

/**
 * Capture and lock display dimensions to prevent scaling
 * This should be called as early as possible (in App.js)
 */
export const normalizeDisplaySize = () => {
  if (Platform.OS !== 'android') {
    console.log('🔧 Display Size Normalizer: Skipping (not Android)');
    return;
  }

  // ALWAYS use minimum density - no need to check AsyncStorage
  // Just ensure overrides are in place with minimum values
  const currentPixelRatio = originalPixelRatioGet ? originalPixelRatioGet() : PixelRatio.get();
  const UNIVERSAL_MINIMUM_DENSITY = 1.5; // Universal minimum for all devices
  const MINIMUM_DENSITY = Math.min(UNIVERSAL_MINIMUM_DENSITY, currentPixelRatio);
  
  // Update fixed values to minimum (in case system changed)
  if (fixedPixelRatio !== MINIMUM_DENSITY) {
    fixedPixelRatio = MINIMUM_DENSITY;
    console.log('🔒 Re-locking to minimum density:', fixedPixelRatio);
  }

  // CRITICAL: Override PixelRatio.get() - Ensure it's locked
  // Note: Already overridden in immediate capture, but ensure it's still correct
  if (!originalPixelRatioGet) {
    originalPixelRatioGet = PixelRatio.get.bind(PixelRatio);
  }
  
  // Ensure override is in place (might have been set in immediate capture)
  PixelRatio.get = function() {
    if (fixedPixelRatio !== null) {
      // Always return the fixed pixel ratio, preventing scaling
      return fixedPixelRatio;
    }
    return originalPixelRatioGet ? originalPixelRatioGet() : 3.0; // Fallback
  };

  // Override PixelRatio.getFontScale() to prevent font scaling
  if (PixelRatio.getFontScale) {
    const originalGetFontScale = PixelRatio.getFontScale.bind(PixelRatio);
    PixelRatio.getFontScale = () => {
      return 1.0; // Always return 1.0 to prevent font scaling
    };
  }

  // Override Dimensions.get() - Ensure it's locked
  // Note: Already overridden in immediate capture, but ensure it's still correct
  if (!originalGet) {
    originalGet = Dimensions.get.bind(Dimensions);
  }
  
  // Ensure override is in place (might have been set in immediate capture)
  Dimensions.get = function(dim) {
    // Always return fixed dimensions if we have them
    if (fixedPixelRatio !== null && fixedWindowDimensions && fixedScreenDimensions) {
      const base = dim === 'window' ? fixedWindowDimensions : fixedScreenDimensions;
      // Always return the fixed dimensions regardless of system changes
      return {
        width: base.width,
        height: base.height,
        scale: fixedPixelRatio,
        fontScale: 1.0, // Font scaling is already disabled via globalFontFix
      };
    }
    // Fallback to original if not normalized yet
    return originalGet ? originalGet(dim) : { width: 0, height: 0, scale: 1, fontScale: 1 };
  };

  // Override Dimensions.addEventListener to prevent updates
  // Only override once to prevent multiple overrides
  if (!originalAddEventListener) {
    originalAddEventListener = Dimensions.addEventListener.bind(Dimensions);
  }
  Dimensions.addEventListener = (type, handler) => {
    // Intercept all dimension change events and normalize them
    return originalAddEventListener(type, (dims) => {
      // Always return fixed dimensions in change events - prevent any dimension changes from propagating
      if (fixedPixelRatio !== null && fixedWindowDimensions && fixedScreenDimensions) {
        // Completely ignore system dimension changes and always return fixed values
        handler({
          window: {
            width: fixedWindowDimensions.width,
            height: fixedWindowDimensions.height,
            scale: fixedPixelRatio,
            fontScale: 1.0,
          },
          screen: {
            width: fixedScreenDimensions.width,
            height: fixedScreenDimensions.height,
            scale: fixedPixelRatio,
            fontScale: 1.0,
          },
        });
      } else {
        handler(dims);
      }
    });
  };

  // Also override removeEventListener to maintain consistency
  if (Dimensions.removeEventListener) {
    const originalRemoveEventListener = Dimensions.removeEventListener.bind(Dimensions);
    Dimensions.removeEventListener = originalRemoveEventListener;
  }

  normalized = true;
  
  console.log('✅ Display Size Normalizer: Overrides installed', {
    pixelRatio: fixedPixelRatio,
    window: fixedWindowDimensions,
    screen: fixedScreenDimensions,
  });
  
  // AGGRESSIVE: Continuously monitor and re-apply minimum size
  // React Native might reset Dimensions, so we need to keep re-applying
  if (Platform.OS === 'android') {
    // Re-apply overrides periodically to catch any resets
    const reapplyMinimumSize = () => {
      const UNIVERSAL_MINIMUM_DENSITY = 1.5;
      const currentSystemRatio = originalPixelRatioGet ? originalPixelRatioGet() : 3.0;
      const MIN_DENSITY = Math.min(UNIVERSAL_MINIMUM_DENSITY, currentSystemRatio);
      
      // ALWAYS force minimum density
      fixedPixelRatio = MIN_DENSITY;
      
      // Re-lock overrides (they might have been reset)
      PixelRatio.get = () => fixedPixelRatio;
      Dimensions.get = (dim) => {
        const base = dim === 'window' ? fixedWindowDimensions : fixedScreenDimensions;
        return {
          width: base.width,
          height: base.height,
          scale: fixedPixelRatio,
          fontScale: 1.0,
        };
      };
    };
    
    // Listen for app state changes
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Re-apply immediately when app becomes active
        reapplyMinimumSize();
        console.log('🔄 App active - Re-applying minimum display size, Density:', fixedPixelRatio);
        
        // Also re-apply after a short delay (in case React Native resets it)
        setTimeout(() => {
          reapplyMinimumSize();
          console.log('🔄 Delayed re-apply - Ensuring minimum size, Density:', fixedPixelRatio);
        }, 500);
      }
    });
    
    // AGGRESSIVE: Also re-apply periodically (every 2 seconds) when app is active
    // This catches any dimension resets that happen after app state change
    let periodicCheckInterval = null;
    const startPeriodicCheck = () => {
      if (periodicCheckInterval) {
        clearInterval(periodicCheckInterval);
      }
      periodicCheckInterval = setInterval(() => {
        if (AppState.currentState === 'active') {
          // Check if overrides are still in place
          const currentRatio = PixelRatio.get();
          if (currentRatio !== fixedPixelRatio && fixedPixelRatio !== null) {
            console.warn('⚠️ Density override was reset! Re-applying minimum...');
            reapplyMinimumSize();
          }
        }
      }, 2000); // Check every 2 seconds
    };
    
    // Start periodic check
    if (AppState.currentState === 'active') {
      startPeriodicCheck();
    }
    
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        startPeriodicCheck();
      } else {
        if (periodicCheckInterval) {
          clearInterval(periodicCheckInterval);
          periodicCheckInterval = null;
        }
      }
    });
  }
};

/**
 * Get normalized dimensions that ignore display size setting
 * @returns {Object} Normalized width and height
 */
export const getNormalizedDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();
  
  // Calculate base dimensions (dp)
  return {
    width: width / pixelRatio,
    height: height / pixelRatio,
    pixelRatio,
    scaledWidth: width,
    scaledHeight: height,
  };
};

/**
 * Normalize a size value to ignore display scaling
 * @param {number} size - Size in pixels
 * @returns {number} Normalized size
 */
export const normalizeSize = (size) => {
  // Since PixelRatio.get() is already overridden to return fixedPixelRatio,
  // this function should just return the size as-is
  // The normalization happens at the PixelRatio/Dimensions level
  return size;
};

export default {
  normalizeDisplaySize,
  getNormalizedDimensions,
  normalizeSize,
};

