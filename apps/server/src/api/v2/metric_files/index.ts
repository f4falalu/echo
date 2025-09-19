import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import metricByIdRoutes from './[id]';

const app = new Hono()
  // Apply authentication middleware to all routes
  .use('*', requireAuth)

  // GET /metric_files/:id - Get metric details
  .route('/:id', metricByIdRoutes)

  // Error handler for metric_files routes
  .onError((err, c) => {
    console.error('Metric files API error:', err);

    // Let HTTPException responses pass through
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    // Default error response
    return c.json({ error: 'Internal server error' }, 500);
  });

export default app;
