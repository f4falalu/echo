import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import GET from './GET';

const app = new Hono()
  // Apply authentication globally to ALL routes in this router
  .use('*', requireAuth)
  // Mount the GET route
  .route('/', GET);

export default app;
