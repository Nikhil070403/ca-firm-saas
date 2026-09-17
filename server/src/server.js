require('./models/registerModels');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');
const { registerJobs } = require('./jobs');
const logger = require('./utils/logger');

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });

  if (env.nodeEnv !== 'test') {
    registerJobs();
  }

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
