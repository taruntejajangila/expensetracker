#!/bin/bash

cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

echo "🔨 Starting build (this may take 10-15 minutes)..."
echo ""

eas build --platform android --profile preview --local

