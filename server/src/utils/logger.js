/**
 * Deliberately not a logging library (no winston) — plain MERN scope. A
 * timestamped console wrapper is enough for this app's log volume and keeps
 * the dependency list minimal.
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function log(level, ...args) {
  if (LEVELS[level] > currentLevel) return;
  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;
  const method = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  method(prefix, ...args);
}

module.exports = {
  error: (...args) => log('error', ...args),
  warn: (...args) => log('warn', ...args),
  info: (...args) => log('info', ...args),
  debug: (...args) => log('debug', ...args),
};
