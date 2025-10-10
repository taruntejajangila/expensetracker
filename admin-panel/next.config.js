/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: 'my-value',
    // API URL will be loaded from .env.local file
    // For local development: http://192.168.29.14:5000/api
    // For production: https://your-backend.railway.app/api
  },
}

module.exports = nextConfig
