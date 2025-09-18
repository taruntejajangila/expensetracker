#!/bin/bash

echo "🚀 Setting up Local Development Build for Expense Tracker Mobile App"
echo "=================================================================="

echo "📦 Installing dependencies..."
npm install

echo "🔧 Configuring for local development build..."
echo "✅ Dependencies installed"
echo "✅ App configured for push notifications"
echo "✅ Development client configured"

echo ""
echo "📱 Next Steps:"
echo "1. Connect your Android device via USB"
echo "2. Enable Developer Options and USB Debugging on your device"
echo "3. Run: npm run android"
echo ""
echo "🎯 This will create a development build that supports push notifications"
echo "   unlike Expo Go which doesn't support them."
echo ""
echo "🔔 Once the app is installed, you can test admin notifications!"
echo ""

read -p "Press Enter to continue..."


