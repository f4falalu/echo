import { pinoLogger } from 'hono-pino';
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || 'info';

// Create base pino instance
const createBaseLogger = () => {
  if (isDev) {
    try {
      // Only use pino-pretty transport in development
      return pino({
        level: logLevel,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      });
    } catch (error) {
      console.warn('pino-pretty not available, falling back to JSON logging');
      console.error(error);
    }
  }

  // Production or fallback: use standard JSON logging
  return pino({
    level: logLevel,
  });
};

const baseLogger = createBaseLogger();

// Simple console capture - only override if LOG_LEVEL is set
if (process.env.LOG_LEVEL) {
  console.info = (obj, ...args) => {
    if (typeof obj === 'string') {
      baseLogger.info(obj, ...args);
    } else {
      baseLogger.info({ data: obj }, ...args);
    }
  };
  console.warn = (obj, ...args) => {
    if (typeof obj === 'string') {
      baseLogger.warn(obj, ...args);
    } else {
      baseLogger.warn({ data: obj }, ...args);
    }
  };
  console.error = (obj, ...args) => {
    if (typeof obj === 'string') {
      baseLogger.error(obj, ...args);
    } else {
      baseLogger.error({ data: obj }, ...args);
    }
  };

  // Suppress debug logs when LOG_LEVEL is info or higher
  if (logLevel !== 'debug' && logLevel !== 'trace') {
    console.debug = () => {};
  }
}

// Create logger middleware
export const loggerMiddleware = pinoLogger({
  pino: baseLogger,
  http: false, // Disable automatic HTTP request logging
});
