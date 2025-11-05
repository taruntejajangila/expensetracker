#!/bin/bash

# Connect to Android device via Wireless ADB

echo "📱 Wireless ADB Connection Setup"
echo ""
echo "On your phone:"
echo "1. Go to Settings → Developer Options"
echo "2. Enable 'Wireless Debugging'"
echo "3. Tap 'Pair device with pairing code'"
echo "4. You'll see an IP address and pairing code"
echo ""
read -p "Enter the pairing code: " PAIRING_CODE
read -p "Enter the IP address (e.g., 192.168.1.100): " IP_ADDRESS

# First pair (needs port 37XXX)
echo "Pairing device..."
adb pair $IP_ADDRESS

# Then connect (different port)
echo ""
echo "Now tap 'Connect' on your phone and note the new port (like 44XXX)"
read -p "Enter the connection port (from 'Wireless Debugging' screen): " PORT

echo "Connecting to device..."
adb connect $IP_ADDRESS:$PORT

echo ""
echo "Checking devices..."
adb devices

