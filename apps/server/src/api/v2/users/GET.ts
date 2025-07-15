import { getUserToOrganization } from '@buster/database';
import {
  GetUserToOrganizationRequestSchema,
  type GetUserToOrganizationResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';

import { Hono } from 'hono';

const app = new Hono().get(
  '/',
  zValidator('json', GetUserToOrganizationRequestSchema),
  async (c) => {
    const { id: userId } = c.get('busterUser');
    const { page, page_size, filters } = c.req.valid('json');

    const result = await getUserToOrganization({
      userId,
      page,
      page_size,
      filters,
    });

    const response: GetUserToOrganizationResponse = result;

    return c.json(response);
  }
);

export default app;
