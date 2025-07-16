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
    const options = c.req.valid('query');

    console.log(options);

    try {
      const result: GetUserToOrganizationResponse = await getUserToOrganization({
        userId,
        ...options,
      });

      return c.json(result);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Error fetching users' }, 500);
    }
  }
);

export default app;
