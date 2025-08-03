import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import GET from './GET';
import PUT_ID from './[id]';

const app = new Hono()
  .use('*', requireAuth)
  .route('/', GET)
  .route('/:id', PUT_ID);

export default app;
