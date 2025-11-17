#!/usr/bin/env node

/**
 * Patch all React Native and Expo modules' build.gradle files to disable lint tasks.
 * This avoids IntelliJ / lint class loading errors during Android builds.
 */

const fs = require('fs');
const path = require('path');

function patchBuildGradle(buildGradlePath, moduleName) {
  if (!fs.existsSync(buildGradlePath)) {
    return false;
  }

  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

  // Check if already patched
  if (buildGradle.includes('// PATCHED: Lint disabled')) {
    return true; // Already patched
  }

  // Find the android block and add lint configuration
  const androidBlockRegex = /(android\s*\{[^}]*)(\})/s;

  if (androidBlockRegex.test(buildGradle)) {
    buildGradle = buildGradle.replace(androidBlockRegex, (match, androidBlock, closingBrace) => {
      // If a lint block already exists, replace it
      if (androidBlock.includes('lint {')) {
        return androidBlock.replace(
          /lint\s*\{[^}]*\}/s,
          `lint {
        // PATCHED: Lint disabled to avoid IntelliJ class loading errors
        abortOnError false
        checkReleaseBuilds false
        checkDependencies false
        disable 'all'
    }`
        ) + closingBrace;
      } else {
        // Otherwise add a new lint block
        return androidBlock + `
    // PATCHED: Lint disabled to avoid IntelliJ class loading errors
    lint {
        abortOnError false
        checkReleaseBuilds false
        checkDependencies false
        disable 'all'
    }` + closingBrace;
      }
    });

    // Also add task disabling at the end of the file
    if (!buildGradle.includes('tasks.whenTaskAdded')) {
      buildGradle += `

// PATCHED: Disable all lint tasks to avoid IntelliJ class loading errors
tasks.whenTaskAdded { task ->
    if (task.name.contains("lint") || task.name.contains("Lint")) {
        task.enabled = false
        task.onlyIf { false }
    }
}

tasks.all { task ->
    if (task.name.contains("lint") || task.name.contains("Lint")) {
        task.enabled = false
        task.onlyIf { false }
    }
}
`;
    }

    fs.writeFileSync(buildGradlePath, buildGradle, 'utf8');
    console.log(`✅ Patched ${moduleName} build.gradle`);
    return true;
  } else {
    console.log(`⚠️  Could not find android block in ${moduleName} build.gradle`);
    return false;
  }
}

// Find all React Native and Expo modules with Android build.gradle files
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const modulesToPatch = [
  '@react-native-async-storage/async-storage',
  '@react-native-community/datetimepicker',
  'react-native-gesture-handler',
  'react-native-svg',
  'react-native-screens',
  'react-native-safe-area-context',
  'react-native-pager-view',
  'react-native-google-mobile-ads',
  'react-native-quick-base64',
  'react-native-get-random-values',
  'expo-modules-core',
  'expo',
  'expo-constants',
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
  'expo-json-utils',
  'expo-manifests',
  'expo-updates-interface'
];

let patchedCount = 0;
let skippedCount = 0;

modulesToPatch.forEach(moduleName => {
  const buildGradlePath = path.join(nodeModulesPath, moduleName, 'android', 'build.gradle');
  if (patchBuildGradle(buildGradlePath, moduleName)) {
    patchedCount++;
  } else {
    skippedCount++;
  }
});

// Also search for any other react-native-* or expo-* modules automatically
try {
  const nodeModules = fs.readdirSync(nodeModulesPath);
  nodeModules.forEach(entry => {
    // Skip already-handled scoped packages above; handle top-level react-native-* and expo-* only
    if (entry.startsWith('react-native-') || entry.startsWith('expo-')) {
      const buildGradlePath = path.join(nodeModulesPath, entry, 'android', 'build.gradle');
      if (patchBuildGradle(buildGradlePath, entry)) {
        patchedCount++;
      } else {
        skippedCount++;
      }
    }
  });
} catch (e) {
  console.log('⚠️  Error scanning node_modules for extra modules:', e.message);
}

console.log(`\n✅ Patch complete: ${patchedCount} modules patched, ${skippedCount} skipped`);
