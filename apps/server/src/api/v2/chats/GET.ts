import { listChats } from '@buster/database/queries';
import { type GetChatsListResponseV2, GetChatsRequestSchemaV2 } from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().get('/', zValidator('query', GetChatsRequestSchemaV2), async (c) => {
  const user = c.get('busterUser');
  const queryParams = c.req.valid('query');

  const listChatsParams = {
    userId: user.id,
    ...queryParams,
  };

  const paginatedChats: GetChatsListResponseV2 = await listChats(listChatsParams);

  return c.json(paginatedChats);
});

export default app;
