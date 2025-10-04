/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: 'my-value',
    NEXT_PUBLIC_API_URL: 'http://localhost:5000/api',
  },
}

module.exports = nextConfig
