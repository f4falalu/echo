import { getUserToOrganization } from '@buster/database';
import {
  GetUserToOrganizationRequestSchema,
  type GetUserToOrganizationResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';

import { Hono } from 'hono';

const app = new Hono().get(
  '/',
  zValidator('query', GetUserToOrganizationRequestSchema),
  async (c) => {
    const { id: userId } = c.get('busterUser');
    const { page, page_size, filters } = c.req.valid('query');

    console.log('page', page);
    console.log('page_size', page_size);
    console.log('filters', filters);

    const result: GetUserToOrganizationResponse = await getUserToOrganization({
      userId,
      page,
      page_size,
      filters,
    });

    console.log('result', result);

    return c.json(result);
  }
);

export default app;
