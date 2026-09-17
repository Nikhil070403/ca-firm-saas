const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler.middleware');
const logger = require('./utils/logger');

const app = express();

// CSP is disabled because in a single-origin deploy this same server also
// serves the built React app, which loads client-uploaded images from
// Cloudinary — a strict default CSP would block them. Helmet's other
// hardening headers stay on. For a locked-down production, replace `false`
// with an explicit policy that allow-lists your asset hosts.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    // No Origin header means same-origin, a proxied request (Vite dev proxy /
    // nginx), curl, or server-to-server — CORS doesn't apply there. For real
    // cross-origin browser requests, answer without CORS headers when the
    // origin isn't allowed (the browser blocks it) instead of throwing a 500.
    const allowed = !origin || env.corsOrigins.includes(origin);
    callback(null, allowed);
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(apiLimiter);

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } });
});

app.use('/api/v1', routes);

// In production this same process also serves the built React app, so the
// whole thing runs on one origin (no CORS, and the sameSite=lax auth cookie
// works). `npm run build` outputs to client/dist.
if (env.nodeEnv === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET returns index.html so client-side routes
  // (e.g. /crm/clients) survive a hard refresh. Unmatched /api/* paths fall
  // through to notFoundHandler and still get a JSON 404.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
