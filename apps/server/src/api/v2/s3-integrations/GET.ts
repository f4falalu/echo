import { Hono } from 'hono';
import type { User } from '@buster/database';
import { getS3IntegrationHandler } from './get-s3-integration';
import type { GetS3IntegrationResponse } from '@buster/server-shared';

const app = new Hono();

export const getS3IntegrationRoute = app.get('/', async (c) => {
  const user = c.get('busterUser') as User;

  const response = await getS3IntegrationHandler(user);
  return c.json(response as GetS3IntegrationResponse);
});

export default app;