import { pinoLogger } from 'hono-pino';
import pino from 'pino';
import 'pino-pretty';

const isDev = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || 'info';

let isPinoPrettyAvailable = true;

// Create base pino instance for console capture
const baseLogger = pino({
  level: logLevel,
  transport: isDev && isPinoPrettyAvailable
    ? {
        target: 'pino-pretty',
        options: { colorize: true },
      }
    : undefined,
});

// Simple console capture - only override if LOG_LEVEL is set
if (process.env.LOG_LEVEL) {
  const originalConsole = {
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  console.info = (...args) => baseLogger.info(args.join(' '));
  console.warn = (...args) => baseLogger.warn(args.join(' '));
  console.error = (...args) => baseLogger.error(args.join(' '));
  
  // Suppress debug logs when LOG_LEVEL is info or higher
  if (logLevel !== 'debug' && logLevel !== 'trace') {
    console.debug = () => {};
  }
}

// Create logger with fallback for pino-pretty failures
function createLogger() {
  // Try pino-pretty in development
  if (isDev && isPinoPrettyAvailable) {
    try {
      return pinoLogger({
        pino: baseLogger,
      });
    } catch (error) {
      console.error('pino-pretty not available, falling back to JSON logging', error);
      isPinoPrettyAvailable = false;
    }
  }

  // Fallback to simple JSON logging
  return pinoLogger({
    pino: {
      level: logLevel,
    },
  });
}

export const loggerMiddleware = createLogger();
