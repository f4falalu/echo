import { getChatTitle } from '@buster/database/queries/chats';
import { getCollectionTitle, getDashboardTitle, getMetricTitle } from '@buster/database/queries/assets';
import { GetTitleRequestSchema, type GetTitleResponse } from '@buster/server-shared/title';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';

const app = new Hono()
  .use('*', requireAuth)
  .get('/', zValidator('query', GetTitleRequestSchema), async (c) => {
    try {
      const { assetId, assetType } = c.req.valid('query');
      const user = c.get('busterUser');
      
      let title: string | null = null;
      
      switch (assetType) {
        case 'chat':
          title = await getChatTitle({ assetId, organizationId: user.organizationId });
          break;
        case 'metric':
          title = await getMetricTitle({ assetId, organizationId: user.organizationId });
          break;
        case 'collection':
          title = await getCollectionTitle({ assetId, organizationId: user.organizationId });
          break;
        case 'dashboard':
          title = await getDashboardTitle({ assetId, organizationId: user.organizationId });
          break;
        default:
          const _exhaustive: never = assetType;
          throw new HTTPException(400, { message: `Unsupported asset type: ${assetType}` });
      }
      
      if (title === null) {
        throw new HTTPException(404, { message: 'Asset not found or access denied' });
      }
      
      const response: GetTitleResponse = { title };
      return c.json(response);
    } catch (error) {
      return standardErrorHandler(error, c);
    }
  })
  .onError(standardErrorHandler);

export default app;
