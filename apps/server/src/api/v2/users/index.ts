import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import GET from './GET';
import POST from './POST';
import GET_ID from './[id]';

const app = new Hono()
  // Apply authentication globally to ALL routes in this router
  .use('*', requireAuth)
  // Mount the modular routes
  .route('/', GET)
  .route('/:id', GET_ID)
  .route('/', POST);

export default app;
