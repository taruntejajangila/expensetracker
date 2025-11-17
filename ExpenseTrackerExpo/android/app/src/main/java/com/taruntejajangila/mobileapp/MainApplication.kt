package com.taruntejajangila.mobileapp

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
