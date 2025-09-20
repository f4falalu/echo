import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import { standardErrorHandler } from '../../../utils/response';
import dashboardByIdRoutes from './[id]';

const app = new Hono()
  // Apply authentication middleware to all routes
  .use('*', requireAuth)
  //  /dashboards/:id
  .route('/:id', dashboardByIdRoutes)
  .onError(standardErrorHandler);

export default app;
