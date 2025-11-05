EXPO Go and APK Build Workflow (Ads Toggle)

Purpose
- Run the app in Expo Go for fast, live edits by disabling all AdMob code safely
- Re-enable ads for APK/dev-client builds without code churn

Overview
- Expo Go cannot load native modules like react-native-google-mobile-ads
- We use an environment switch to no-op all ad code in Expo Go (and dev), and enable it for builds

Environment Switch
- Use one public env var read at runtime:
  - EXPO_PUBLIC_DISABLE_ADS=1 → All ad modules/services become no-op
  - EXPO_PUBLIC_DISABLE_ADS=0 (or unset) → Real ads enabled

Where to Read the Flag
- At the top of ad entry points, e.g.:
  - ExpenseTrackerExpo/services/AdMobService.ts
  - ExpenseTrackerExpo/services/AppOpenAdService.ts
- Pseudocode (documentation only; implement after this doc):
  - const disableAds = process.env.EXPO_PUBLIC_DISABLE_ADS === '1';
  - export default disableAds ? NoopAdMobService : RealAdMobService;
  - In AppOpenAdService methods, if (disableAds) return early

Expo Go (Live Changes) – How To Run
1) Set env to disable ads
   - Windows PowerShell (one-off):
     - setx EXPO_PUBLIC_DISABLE_ADS 1
     - Close and reopen terminal after setx
   - Or via .env.local (Expo reads EXPO_PUBLIC_*)
2) Start Metro in project folder
   - cd "E:\expensetracker new\ExpenseTrackerExpo"
   - npx expo start
3) Open Expo Go on the phone and scan QR
   - Ads will be completely skipped; no crashes

Switch Back to Build Mode (Enable Ads)
1) Ensure env enables ads
   - Windows PowerShell:
     - setx EXPO_PUBLIC_DISABLE_ADS 0
     - Close and reopen terminal
2) Optional sanity check
   - npx expo config --json | findstr EXPO_PUBLIC_DISABLE_ADS
3) Build
   - Dev client (live reload + native modules):
     - eas build --platform android --profile development --local
   - Release APK (internal testing):
     - eas build --platform android --profile preview --local

Local EAS Build (WSL) – Reference
1) Ensure ADB device connected (on Windows):
   - adb devices -l
2) In Ubuntu 22.04 terminal (not via wsl -d if flaky):
   - cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"
   - export ANDROID_HOME=/home/taruntejajangila/android-sdk
   - export ANDROID_SDK_ROOT=$ANDROID_HOME
   - export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
   - export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/tools/bin:$PATH"
   - printf "sdk.dir=$ANDROID_HOME\n" > android/local.properties
   - export EAS_SKIP_AUTO_FINGERPRINT=1
   - npx --yes eas-cli@latest build --platform android --profile preview --local --non-interactive
3) Install built APK (Windows PowerShell):
   - adb install -r "E:\expensetracker new\ExpenseTrackerExpo\build-<timestamp>.apk"

No-Op Ad Services (What They Do)
- AdMobService.initialize(): returns immediately
- Banner components: render a minimal placeholder or nothing
- AppOpenAdService/Interstitial: short-circuit and resolve promises

Pre-Build Checklist (Avoid Expo Go crashes)
- [ ] EXPO_PUBLIC_DISABLE_ADS set to 0 (or unset)
- [ ] Ad services not importing any Expo Go–unsupported modules at the top level when disabled
- [ ] App opens without calling showAppOpenAd on first frame in Expo Go (guarded)

Troubleshooting
- Expo Go still crashes → Confirm env propagated (restart terminal + expo start)
- ADB device missing → Reconnect USB, enable USB debugging, run: adb kill-server && adb start-server
- WSL crash (E_UNEXPECTED) → wsl --shutdown, restart LxssManager, then reopen Ubuntu app

Notes
- This doc describes the toggle plan; the small code guards will be added in AdMobService.ts and AppOpenAdService.ts when enabling Expo Go mode.

