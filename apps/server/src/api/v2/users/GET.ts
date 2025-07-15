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

    const users = await getUserToOrganization({
      userId,
      filters,
    });

    const response: GetUserToOrganizationResponse = users;

    return c.json(response);
  }
);

export default app;
