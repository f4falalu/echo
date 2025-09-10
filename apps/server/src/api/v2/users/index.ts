import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import GET from './GET';
import POST from './POST';
import userIdRoute from './[id]/GET';

const app = new Hono()
  // Apply authentication globally to ALL routes in this router
  .use('*', requireAuth)
  // Mount the modular routes
  .route('/', GET)
  .route('/', POST)
  .route('/:id', userIdRoute);

export default app;
