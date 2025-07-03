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
  console.info = (...args) => baseLogger.info(...args);
  console.warn = (...args) => baseLogger.warn(...args);
  console.error = (...args) => baseLogger.error(...args);

  // Suppress debug logs when LOG_LEVEL is info or higher
  if (logLevel !== 'debug' && logLevel !== 'trace') {
    console.debug = () => {};
  }
}

// Create logger middleware
export const loggerMiddleware = pinoLogger({
  pino: baseLogger,
});
