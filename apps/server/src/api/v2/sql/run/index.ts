import { RunSqlRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../../middleware/auth';
import '../../../../types/hono.types';
import { runSqlHandler } from './POST';

const app = new Hono()
  // Apply authentication middleware to all routes
  .use('*', requireAuth)

  // POST /sql/run - Execute SQL query against data source
  .post('/', zValidator('json', RunSqlRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    const response = await runSqlHandler(request, user);

    return c.json(response);
  })

  // Error handler for SQL run routes
  .onError((err, c) => {
    console.error('SQL run API error:', err);

    // Let HTTPException responses pass through
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    // Default error response
    return c.json({ error: 'Internal server error' }, 500);
  });

export default app;
