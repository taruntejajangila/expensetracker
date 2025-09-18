@echo off
echo Building Expense Tracker Mobile App Locally...
echo.

echo Step 1: Installing dependencies...
call npm install
echo.

echo Step 2: Starting development server...
echo You can now run: npm run android
echo.
echo For local development build with push notifications:
echo 1. Connect your Android device via USB
echo 2. Enable Developer Options and USB Debugging
echo 3. Run: npm run android
echo.

echo Note: This will create a development build that supports push notifications
echo unlike Expo Go which doesn't support them.
echo.

pause


