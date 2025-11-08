# Push Notifications Setup for Production Builds

## Problem
Push notifications work in development but fail in production APK builds with error:
```
Error: Make sure to complete the guide at https://docs.expo.dev/push-notifications/fcm-credentials/
Default FirebaseApp is not initialized
```

## Current Setup Overview

Your notification system:
- **Backend**: Uses Expo Push Notification API directly (`https://exp.host/--/api/v2/push/send`)
- **Service**: `backend-api/src/services/notificationService.ts` handles sending
- **Admin Panel**: Sends notifications via `/api/notifications/send` endpoint
- **Mobile App**: Registers Expo Push Tokens via `expo-notifications`
- **Database**: Stores tokens in `notification_tokens` table

## How Your Notification System Works

### 1. Token Registration (Mobile App → Backend)
- User logs in/registers → `AuthContext.tsx` calls `registerForPushNotifications()`
- App requests notification permissions
- Gets Expo Push Token via `Notifications.getExpoPushTokenAsync()`
- Token sent to `/api/notifications/register` endpoint
- Token stored in `notification_tokens` table with `user_id`, `platform`, `is_active`

### 2. Sending Notifications (Admin Panel → Backend → Users)
- Admin creates notification in admin panel (`admin-panel/app/notifications/page.tsx`)
- Admin clicks "Send" → POST to `/api/notifications/send` with:
  - `title`, `body`
  - `targetAll` (boolean) or `userEmails` (array)
  - `type` ('simple' or 'custom')
  - `customContent` (if custom type)
- Backend route (`backend-api/src/routes/notifications.ts`) calls:
  - `notificationService.sendToAll()` OR
  - `notificationService.sendToUser()` for each email
- Service (`notificationService.ts`):
  - Gets active tokens from database
  - For each token, calls `sendPushNotification()` which:
    - Sends HTTP POST to `https://exp.host/--/api/v2/push/send`
    - Uses Expo Push API format: `{ to: token, title, body, data, sound, badge }`
  - Stores notification in `notifications` table
  - For custom notifications, also stores in `custom_notifications` table

### 3. Receiving Notifications (Expo → Mobile App)
- Expo Push API receives the request
- For Android: Expo uses FCM under the hood (requires FCM credentials in production)
- For iOS: Uses APNs
- Notification delivered to device
- Mobile app receives via `Notifications.addNotificationReceivedListener()`
- Notification displayed to user

### Why FCM is Required for Production
Even though you're using Expo's API (`exp.host`), Expo still needs FCM credentials to deliver notifications to Android devices in production builds. This is because:
- Expo Push API is just a relay/proxy
- Actual Android notification delivery uses FCM
- Development builds (Expo Go) use test tokens that don't need FCM
- Production APKs need real FCM credentials

## Solution
Android production builds require Firebase Cloud Messaging (FCM) credentials, even when using Expo Push Notifications. Expo uses FCM under the hood for Android, even though you're using Expo's API endpoint.

## Step-by-Step Setup

### Step 1: Create/Use Firebase Project

Since you already have AdMob configured (`ca-app-pub-4113490348002307~1599461669`), you likely have a Firebase project. If not:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing one)
3. Add Android app to Firebase project:
   - Package name: `com.taruntejajangila.mobileapp`
   - App nickname: "PaysaGo Finance Manager" (optional)

### Step 2: Download google-services.json

1. In Firebase Console → Project Settings → Your apps
2. Click on your Android app
3. Click "Download google-services.json"
4. Save the file to: `ExpenseTrackerExpo/google-services.json`

### Step 3: Configure app.json

Update `app.json` to include the google-services.json file:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### Step 4: Generate Service Account Key and Upload to Expo

Since you're using FCM V1 API (recommended), you need a Service Account Key (JSON file), not the legacy Server Key:

1. **Generate Service Account Key:**
   - In Firebase Console → Go to **Project Settings** → **Service accounts** tab
   - Click **"Generate new private key"**
   - A JSON file will download (e.g., `mypaisa-9eeb5-firebase-adminsdk-xxxxx.json`)
   - Save this file securely (you'll need it for Expo)

2. **Upload to Expo using EAS Credentials:**
   ```bash
   cd ExpenseTrackerExpo
   npx eas credentials
   ```
   
   Follow the prompts:
   - Select: **Android**
   - Select: **production** (or **preview** for testing)
   - Select: **Google Service Account**
   - Choose: **"Manage your Google Service Account Key for Push Notifications (FCM V1)"**
   - Select: **"Upload a new service account key"**
   - Upload the JSON file you downloaded

3. **Alternative: If Legacy Server Key is needed** (deprecated):
   - If Expo CLI asks for Legacy Server Key instead:
   - Go back to Firebase Console → **Cloud Messaging** tab
   - Click the three dots (⋮) on **"Cloud Messaging API (Legacy)"** card
   - Enable the Legacy API temporarily
   - Copy the **"Server key"**
   - Enter it in `eas credentials` → Android → Push Notifications

### Step 5: Update app.json Notification Plugin

Ensure your `expo-notifications` plugin is configured correctly:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#007AFF",
        "defaultChannel": "default",
        "sounds": []
      }
    ]
  ]
}
```

### Step 6: Rebuild APK

After adding `google-services.json` and configuring FCM:

```bash
cd ExpenseTrackerExpo
npx eas-cli build --platform android --profile preview --local --non-interactive
```

## Alternative: Using EAS Build (Cloud)

If building with EAS Build cloud service:

1. Upload `google-services.json` to EAS:
   ```bash
   eas credentials
   # Select Android → Upload google-services.json
   ```

2. Build:
   ```bash
   eas build --platform android --profile preview
   ```

## Verification

After setup, test push notifications:

1. Install the new APK on a device
2. Register for notifications in the app
3. Send a test notification from your backend
4. Check device logs:
   ```bash
   adb logcat | grep -i "notification\|fcm\|expo"
   ```

## Important Notes

- **Development builds** (Expo Go) don't need FCM - they use Expo's test tokens
- **Production builds** (standalone APK) require FCM credentials
- The `google-services.json` file must be in `ExpenseTrackerExpo/` directory
- FCM Server Key must be configured in Expo credentials
- After adding `google-services.json`, you MUST rebuild the app

## Troubleshooting

### Error: "google-services.json not found" or "File is not checked in to your repository"
- **For Local Builds**: The file must exist in `ExpenseTrackerExpo/google-services.json`
- **If file is gitignored**: Temporarily add it to git:
  ```bash
  cd ExpenseTrackerExpo
  git add -f google-services.json
  ```
- **For Cloud Builds**: Use EAS file environment variables instead:
  ```bash
  eas credentials
  # Select Android → Upload google-services.json as environment variable
  ```
- Check file name is exact: `google-services.json` (lowercase, with hyphen)

### Error: "FCM credentials not configured"
- Run `npx eas credentials` to configure
- Use Service Account Key (JSON file) for FCM V1 API (recommended)
- OR enable Legacy API temporarily if needed and use Server Key
- Ensure credentials are uploaded to Expo before building

### Notifications still not working
- Check permissions are granted on device
- Verify backend is using correct Expo Push API endpoint
- Check device logs for specific errors
- Ensure app is using production build, not development build

## Current Status

✅ **App Code**: Already configured correctly (using `expo-notifications`)
✅ **Backend**: Already sending via Expo Push API
❌ **Missing**: `google-services.json` file
❌ **Missing**: FCM credentials in Expo

## Next Steps

1. Add `google-services.json` file
2. Configure FCM credentials via `eas credentials`
3. Rebuild APK
4. Test push notifications

