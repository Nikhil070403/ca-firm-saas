const dotenv = require('dotenv');

dotenv.config();

const REQUIRED_IN_PRODUCTION = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const nodeEnv = process.env.NODE_ENV || 'development';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Browser origins allowed to call the API cross-origin. In the intended
// setups (Vite dev proxy, nginx in production) the client is same-origin and
// CORS never applies — this list is the fallback for direct cross-origin use.
// Extra origins come from the comma-separated CORS_ORIGINS env var; outside
// production the common Vite dev ports are pre-allowed so an auto-shifted
// port (5173 -> 5174) or 127.0.0.1 vs localhost never causes a CORS failure.
const devOrigins = nodeEnv === 'production' ? [] : [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];
const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  clientUrl,
  corsOrigins: [...new Set([clientUrl, ...extraOrigins, ...devOrigins])],

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ca-firm-saas',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    emailSecret: process.env.JWT_EMAIL_SECRET || 'dev-email-secret',
  },

  // Left null unless explicitly set, giving a host-only refresh cookie that
  // just works on any single host (e.g. your-app.onrender.com). Only set
  // COOKIE_DOMAIN when the cookie must span subdomains (api.x.com + app.x.com).
  cookieDomain: process.env.COOKIE_DOMAIN || null,

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM || 'CA Firm SaaS <no-reply@example.com>',
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
  },

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
    firmName: process.env.SEED_FIRM_NAME || 'Demo & Associates',
  },
};

function assertProductionConfig() {
  if (env.nodeEnv !== 'production') return;
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
}

assertProductionConfig();

module.exports = env;
