import { MetricDownloadParamsSchema } from '@buster/server-shared/metrics';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import { downloadMetricFileHandler } from './download-metric-file';

const app = new Hono()
  // Apply authentication middleware to all routes
  .use('*', requireAuth)

  // GET /metric_files/:id/download - Download metric file data as CSV
  .get('/:id/download', zValidator('param', MetricDownloadParamsSchema), async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('busterUser');

    const response = await downloadMetricFileHandler(id, user);

    // Option 1: Return JSON with download URL for client to handle
    return c.json(response);

    // Option 2: Redirect directly to download URL (uncomment if preferred)
    // return c.redirect(response.downloadUrl);
  })

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
