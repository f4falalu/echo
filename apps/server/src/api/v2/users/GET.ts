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
    console.log(page_size, c.req.query());
    try {
      const result: GetUserToOrganizationResponse = await getUserToOrganization({
        userId,
        page,
        page_size,
        filters,
      });

      return c.json(result);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Error fetching users' }, 500);
    }
  }
);

export default app;
