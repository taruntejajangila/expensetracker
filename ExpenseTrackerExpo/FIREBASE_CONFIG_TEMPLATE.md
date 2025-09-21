# Firebase Configuration Template

## Mobile App Configuration

### Step 1: Get Firebase Config from Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create new one)
3. Go to Project Settings (⚙️ gear icon)
4. Scroll to "Your apps" section
5. Click on your Android app (or add one if needed)

### Step 2: Add Android App (if needed)

If you don't have an Android app:
1. Click "Add app" → Android
2. Package name: `com.taruntejajangila.mobileapp`
3. App nickname: "Expense Tracker Mobile"
4. Click "Register app"

### Step 3: Get Configuration Values

You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-name.firebaseapp.com",
  projectId: "your-project-name",
  storageBucket: "your-project-name.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:android:abcdef1234567890"
};
```

### Step 4: Update firebase.config.js

Replace the placeholder values in `ExpenseTrackerExpo/firebase.config.js` with your actual values.

### Step 5: Download google-services.json

1. In the same Firebase Console page
2. Click "Download google-services.json"
3. Save it to `ExpenseTrackerExpo/google-services.json`

## Backend Configuration

### Step 1: Get Service Account Key

1. Go to Firebase Console → Project Settings
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file (keep it secure!)

### Step 2: Update backend config

Replace the placeholder values in `backend-api/src/config/firebase.ts` with your service account details.

## Test Configuration

After configuration, you can test with:
- Test phone numbers: +91 9876543210
- Test OTP: 123456

## Security Notes

⚠️ **IMPORTANT**: Never commit these files to version control:
- `google-services.json`
- Service account JSON files
- Any files containing API keys

Add them to `.gitignore` if not already there.
