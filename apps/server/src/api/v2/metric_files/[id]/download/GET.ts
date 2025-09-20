import { MetricDownloadParamsSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../../utils/response';
import { downloadMetricFileHandler } from './download-metric-file';

const app = new Hono()
  // GET /metric_files/:id/download - Download metric file data as CSV
  .get('/', zValidator('param', MetricDownloadParamsSchema), async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('busterUser');

    const response = await downloadMetricFileHandler(id, user);

    return c.json(response);
  })
  .onError(standardErrorHandler);

export default app;
