// Global middleware registration for TanStack Start
import { registerGlobalMiddleware } from '@tanstack/react-start';
import { securityMiddleware } from './middleware/global-security';

// Register global middleware that runs for every server function
registerGlobalMiddleware({
  middleware: [securityMiddleware],
});
