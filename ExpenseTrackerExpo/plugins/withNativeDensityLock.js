const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to inject native density lock code
 * This ensures the Kotlin files are modified during prebuild,
 * so they persist through EAS builds
 */
const withNativeDensityLock = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      
      // Paths to the Kotlin files
      const mainActivityPath = path.join(
        projectRoot,
        'app/src/main/java/com/taruntejajangila/mobileapp/MainActivity.kt'
      );
      
      const mainApplicationPath = path.join(
        projectRoot,
        'app/src/main/java/com/taruntejajangila/mobileapp/MainApplication.kt'
      );
      
      console.log('🔧 Injecting native density lock code...');
      
      // Replace MainActivity.kt with correct code
      if (fs.existsSync(mainActivityPath)) {
        const mainActivityContent = `package com.taruntejajangila.mobileapp

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.os.Build
import android.os.Bundle
import android.util.DisplayMetrics

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  
  companion object {
    // Use minimum density (2.5) - medium readable size
    private const val MINIMUM_DENSITY = 2.5f
    private const val MINIMUM_SCALED_DENSITY = 2.5f
  }
  
  override fun attachBaseContext(newBase: Context) {
    // ALWAYS use minimum density (2.5) - don't capture system density
    android.util.Log.e("DensityLock", "attachBaseContext - Forcing MINIMUM density: $MINIMUM_DENSITY")
    
    // Create configuration with minimum density
    val configuration = Configuration(newBase.resources.configuration)
    configuration.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    // Create context with fixed configuration
    val context = newBase.createConfigurationContext(configuration)
    
    // Force lock the metrics to minimum in the new context
    val fixedMetrics = context.resources.displayMetrics
    fixedMetrics.density = MINIMUM_DENSITY
    fixedMetrics.scaledDensity = MINIMUM_SCALED_DENSITY
    fixedMetrics.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    android.util.Log.e("DensityLock", "attachBaseContext - MINIMUM density applied: $MINIMUM_DENSITY")
    
    super.attachBaseContext(context)
  }
  
  // CRITICAL: Override getResources() to ALWAYS force MINIMUM density (2.5)
  // This runs EVERY time resources are accessed - most aggressive approach
  override fun getResources(): Resources {
    val res = super.getResources()
    
    // ALWAYS use minimum density (2.5) - don't capture system density
    // This ensures app UI is always small regardless of system settings
    val MINIMUM_DENSITY = 2.5f
    val MINIMUM_SCALED_DENSITY = 2.5f
    
    val metrics = res.displayMetrics
    val currentDensity = metrics.density
    val currentScaledDensity = metrics.scaledDensity
    
    // FORCE MINIMUM DENSITY - Always use 2.5, ignore system density
    if (currentDensity != MINIMUM_DENSITY || currentScaledDensity != MINIMUM_SCALED_DENSITY) {
      android.util.Log.e("DensityLock", "DENSITY_CHANGED Current: $currentDensity -> MINIMUM: $MINIMUM_DENSITY")
    }
    
    // FORCE LOCK TO MINIMUM - No conditions, always apply 2.5
    metrics.density = MINIMUM_DENSITY
    metrics.scaledDensity = MINIMUM_SCALED_DENSITY
    metrics.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    val config = res.configuration
    config.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    // Apply configuration - CRITICAL: This must run every time
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        res.updateConfiguration(config, metrics)
      } else {
        @Suppress("DEPRECATION")
        res.updateConfiguration(config, metrics)
      }
      android.util.Log.e("DensityLock", "DENSITY_LOCKED_TO_MINIMUM: $MINIMUM_DENSITY (forced)")
    } catch (e: Exception) {
      android.util.Log.e("DensityLock", "ERROR locking density: " + e.message)
    }
    
    return res
  }
  
  override fun onCreate(savedInstanceState: Bundle?) {
    // CRITICAL: Force log to verify code is executing
    android.util.Log.e("DensityLock", "onCreate CALLED - Activity starting")
    
    // CRITICAL: Always use MINIMUM density (2.5) - don't capture system density
    val MINIMUM_DENSITY = 2.5f
    val MINIMUM_SCALED_DENSITY = 2.5f
    
    // Lock density MULTIPLE times before React Native starts
      getResources() // Lock via override (forces 2.5)
    getResources() // Lock again
    
    // Force lock metrics directly to minimum as well
    val metrics = resources.displayMetrics
    val currentDensity = metrics.density
    
    android.util.Log.e("DensityLock", "onCreate - Current density: $currentDensity, Locking to MINIMUM: $MINIMUM_DENSITY")
    
    // ALWAYS use minimum density
    metrics.density = MINIMUM_DENSITY
    metrics.scaledDensity = MINIMUM_SCALED_DENSITY
    metrics.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    android.util.Log.e("DensityLock", "onCreate - DENSITY_LOCKED_TO_MINIMUM: $MINIMUM_DENSITY (final)")
    
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
  }
  
  override fun onConfigurationChanged(newConfig: Configuration) {
    // Override configuration changes to force MINIMUM density
    val MINIMUM_DENSITY = 2.5f
    val MINIMUM_SCALED_DENSITY = 2.5f
    
    android.util.Log.e("DensityLock", "onConfigurationChanged - Forcing MINIMUM density: $MINIMUM_DENSITY")
    
    // Always use minimum density
    newConfig.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    // Force update metrics to minimum
    val metrics = resources.displayMetrics
    metrics.density = MINIMUM_DENSITY
    metrics.scaledDensity = MINIMUM_SCALED_DENSITY
    metrics.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    // Apply the fixed configuration
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      resources.updateConfiguration(newConfig, metrics)
    } else {
      @Suppress("DEPRECATION")
      resources.updateConfiguration(newConfig, metrics)
    }
    
    android.util.Log.e("DensityLock", "onConfigurationChanged - MINIMUM density applied: $MINIMUM_DENSITY")
    
    super.onConfigurationChanged(newConfig)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
`;
        
        fs.writeFileSync(mainActivityPath, mainActivityContent, 'utf8');
        console.log('  ✅ MainActivity.kt replaced');
      }
      
      // Replace MainApplication.kt with correct code
      if (fs.existsSync(mainApplicationPath)) {
        const mainApplicationContent = `package com.taruntejajangila.mobileapp

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.os.Build
import android.util.DisplayMetrics

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {
  
  companion object {
    // Use minimum density (2.5) - medium readable size
    private const val MINIMUM_DENSITY = 2.5f
    private const val MINIMUM_SCALED_DENSITY = 2.5f
  }
  
  // Override getResources() at Application level to ALWAYS force MINIMUM density (2.5)
  override fun getResources(): Resources {
    val res = super.getResources()
    
    val metrics = res.displayMetrics
    val currentDensity = metrics.density
    val currentScaledDensity = metrics.scaledDensity
    
    // FORCE MINIMUM DENSITY - Always use 2.5, ignore system density
    if (currentDensity != MINIMUM_DENSITY || currentScaledDensity != MINIMUM_SCALED_DENSITY) {
      android.util.Log.e("DensityLock", "MainApplication - DENSITY_CHANGED Current: $currentDensity -> MINIMUM: $MINIMUM_DENSITY")
    }
    
    // FORCE LOCK TO MINIMUM - No conditions, always apply 2.5
    metrics.density = MINIMUM_DENSITY
    metrics.scaledDensity = MINIMUM_SCALED_DENSITY
    metrics.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    val config = res.configuration
    config.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    // Apply configuration - CRITICAL: This must run every time
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        res.updateConfiguration(config, metrics)
      } else {
        @Suppress("DEPRECATION")
        res.updateConfiguration(config, metrics)
      }
      android.util.Log.e("DensityLock", "MainApplication - DENSITY_LOCKED_TO_MINIMUM: $MINIMUM_DENSITY (forced)")
    } catch (e: Exception) {
      android.util.Log.e("DensityLock", "MainApplication - ERROR locking density: " + e.message)
    }
    
    return res
  }

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    
    // Lock density at Application level BEFORE React Native initializes
    android.util.Log.e("DensityLock", "MainApplication - onCreate CALLED")
    getResources() // This triggers density locking
    
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
  
  override fun onConfigurationChanged(newConfig: Configuration) {
    // Override configuration to force MINIMUM density
    android.util.Log.e("DensityLock", "MainApplication - onConfigurationChanged - Forcing MINIMUM density: $MINIMUM_DENSITY")
    
    newConfig.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    val metrics = resources.displayMetrics
    metrics.density = MINIMUM_DENSITY
    metrics.scaledDensity = MINIMUM_SCALED_DENSITY
    metrics.densityDpi = (MINIMUM_DENSITY * 160).toInt()
    
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      resources.updateConfiguration(newConfig, metrics)
    } else {
      @Suppress("DEPRECATION")
      resources.updateConfiguration(newConfig, metrics)
    }
    
    android.util.Log.e("DensityLock", "MainApplication - onConfigurationChanged - MINIMUM density applied: $MINIMUM_DENSITY")
    
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
`;
        
        fs.writeFileSync(mainApplicationPath, mainApplicationContent, 'utf8');
        console.log('  ✅ MainApplication.kt replaced');
      }
      
      console.log('✅ Native density lock injection complete');
      return config;
    },
  ]);
};

module.exports = withNativeDensityLock;
