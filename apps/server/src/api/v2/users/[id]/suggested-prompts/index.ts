import { Hono } from 'hono';
import GET from './GET';

const app = new Hono()
  // Authentication is already applied at the users level
  // Mount the route handlers
  .route('/', GET);

export default app;
