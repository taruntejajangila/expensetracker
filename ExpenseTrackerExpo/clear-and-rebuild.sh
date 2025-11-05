#!/bin/bash

cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

echo "🧹 Cleaning caches..."
rm -rf node_modules
rm -rf .expo
rm -rf android
rm -rf ios
rm -rf .git

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building APK..."
eas build --platform android --profile preview --local

