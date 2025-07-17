import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import PUT from './PUT';

const app = new Hono()
  // Apply authentication globally to ALL routes in this router
  .use('*', requireAuth)
  // Mount the modular routes
  .route('/', PUT);

export default app;
