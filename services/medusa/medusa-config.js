module.exports = {
  projectConfig: {
    database_url: process.env.DATABASE_URL || "postgres://medusa:medusa@localhost:5432/medusa",
    redis_url: process.env.REDIS_URL || "redis://localhost:6379",
    jwt_secret: process.env.JWT_SECRET || "your-jwt-secret",
    cookie_secret: process.env.COOKIE_SECRET || "your-cookie-secret",
    admin_cors: process.env.MEDUSA_ADMIN_CORS || "http://localhost:3000,http://localhost:3001,http://localhost:3002",
    store_cors: process.env.MEDUSA_STORE_CORS || "http://localhost:3000,http://localhost:3001,http://localhost:3002",
  },
  plugins: [],
};
