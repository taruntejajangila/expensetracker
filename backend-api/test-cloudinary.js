/**
 * Cloudinary Credentials Test Script
 * Run this to verify your Cloudinary credentials are correct
 */

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

console.log('🔍 Testing Cloudinary Configuration...\n');

// Display credentials (masked)
console.log('📋 Current Credentials:');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT SET');
console.log('   API Key:', process.env.CLOUDINARY_API_KEY || '❌ NOT SET');
console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? 
  `${process.env.CLOUDINARY_API_SECRET.substring(0, 5)}...${process.env.CLOUDINARY_API_SECRET.substring(process.env.CLOUDINARY_API_SECRET.length - 5)}` : 
  '❌ NOT SET');
console.log('   API Secret Length:', process.env.CLOUDINARY_API_SECRET?.length || 0, 'characters');
console.log();

// Check for common issues
console.log('🔎 Checking for common issues:');
const secret = process.env.CLOUDINARY_API_SECRET || '';
if (secret.startsWith(' ') || secret.endsWith(' ')) {
  console.log('   ⚠️  WARNING: API Secret has leading/trailing spaces!');
}
if (secret.includes('\n') || secret.includes('\r')) {
  console.log('   ⚠️  WARNING: API Secret contains newline characters!');
}
console.log();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test API connection
console.log('🧪 Testing Cloudinary API connection...\n');

cloudinary.api.ping()
  .then((result) => {
    console.log('✅ SUCCESS! Cloudinary connection is working!');
    console.log('   Status:', result.status);
    console.log();
    console.log('🎉 Your credentials are correct!');
    console.log('   You can now use Cloudinary for image uploads.');
  })
  .catch((error) => {
    console.log('❌ FAILED! Cloudinary connection error:');
    console.log('   Error:', error.message);
    console.log('   HTTP Code:', error.http_code);
    console.log();
    
    if (error.http_code === 401) {
      console.log('🔧 Troubleshooting Guide:');
      console.log('   1. Double-check your API Secret in Cloudinary Dashboard');
      console.log('   2. Make sure there are NO spaces before/after the secret');
      console.log('   3. Copy the secret again from Cloudinary');
      console.log('   4. Try regenerating a new API Secret');
      console.log();
      console.log('📍 Get your credentials from:');
      console.log('   https://console.cloudinary.com/console/settings/security');
    }
    
    process.exit(1);
  });

