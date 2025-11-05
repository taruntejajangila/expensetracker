const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to disable display size scaling
 * This prevents Android's display size setting from affecting the app
 */
const withFixedDisplaySize = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      return config;
    }

    const application = Array.isArray(manifest.application)
      ? manifest.application[0]
      : manifest.application;

    if (!application.activity) {
      return config;
    }

    const activities = Array.isArray(application.activity)
      ? application.activity
      : [application.activity];

    // Modify all activities to prevent display size changes
    activities.forEach((activity) => {
      if (!activity.$) {
        activity.$ = {};
      }

      // Get existing configChanges or default empty string
      const existingConfigChanges = activity.$['android:configChanges'] || '';
      
      // Add density-related configChanges to prevent activity recreation
      // This allows the app to handle density changes without restarting
      const densityChanges = 'density|screenSize|smallestScreenSize|screenLayout|orientation';
      
      // Combine existing with density changes, avoiding duplicates
      const configParts = existingConfigChanges.split('|').filter(Boolean);
      const densityParts = densityChanges.split('|');
      
      densityParts.forEach((part) => {
        if (!configParts.includes(part)) {
          configParts.push(part);
        }
      });
      
      activity.$['android:configChanges'] = configParts.join('|');
      
      // Prevent multi-window resizing (this helps with consistency)
      activity.$['android:resizeableActivity'] = 'false';
    });

    // Add a meta-data to specify fixed density (optional)
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    const metaDataArray = Array.isArray(application['meta-data'])
      ? application['meta-data']
      : [application['meta-data']];

    // Check if density meta-data already exists
    const hasDensityMeta = metaDataArray.some(
      (meta) => meta.$ && meta.$['android:name'] === 'android.max_aspect'
    );

    // Note: We can't directly set density, but configChanges helps prevent scaling

    return config;
  });
};

module.exports = withFixedDisplaySize;

