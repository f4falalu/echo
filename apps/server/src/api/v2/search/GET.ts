import { performTextSearch } from '@buster/search';
import { SearchTextRequestSchema, type SearchTextResponse } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { standardErrorHandler } from '../../../utils/response';

const app = new Hono().get('/', zValidator('query', SearchTextRequestSchema), async (c) => {
  const user = c.get('busterUser');
  const searchRequest = c.req.valid('query');

  console.info('searchRequest', searchRequest);

    const response: SearchTextResponse = await performTextSearch(user.id, searchRequest);
    return c.json(response);
 
})
.onError(standardErrorHandler);

export default app;
