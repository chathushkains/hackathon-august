/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    EVENT_SERVER_URL: process.env.EVENT_SERVER_URL || 'http://localhost:4003',
  },
}

module.exports = nextConfig
