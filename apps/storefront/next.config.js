/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MEDUSA_BASE_URL: process.env.MEDUSA_BASE_URL || 'http://localhost:9000',
    ORCHESTRATOR_URL: process.env.ORCHESTRATOR_URL || 'http://localhost:4002',
    EVENT_SERVER_URL: process.env.EVENT_SERVER_URL || 'http://localhost:4003',
  },
}

module.exports = nextConfig
