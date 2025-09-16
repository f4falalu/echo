import { Hono } from 'hono';
import run from './run';

const app = new Hono()
  // Mount the /run subrouter
  .route('/run', run);

export default app;
