import { getUserInformation } from '@buster/database/queries';
import { GetUserByIdRequestSchema, type GetUserByIdResponse } from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../utils/response';

const app = new Hono()
  .get('/', zValidator('param', GetUserByIdRequestSchema), async (c) => {
    const userId = c.req.param('id');
    const authenticatedUser = c.get('busterUser');

    if (authenticatedUser.id !== userId) {
      throw new HTTPException(403, {
        message: 'You are not authorized to access this user',
      });
    }

    const userInfo: GetUserByIdResponse = await getUserInformation(userId);

    return c.json(userInfo);
  })
  .onError(standardErrorHandler);

export default app;
