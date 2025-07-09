import {
  AddApprovedDomainRequestSchema,
  RemoveApprovedDomainRequestSchema,
  UpdateWorkspaceSettingsRequestSchema,
} from '@buster/server-shared/security';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import { HTTPException } from 'hono/http-exception';
import { getApprovedDomainsHandler } from './get-approved-domains';
import { addApprovedDomainsHandler } from './add-approved-domains';
import { removeApprovedDomainsHandler } from './remove-approved-domains';
import { getWorkspaceSettingsHandler } from './get-workspace-settings';
import { updateWorkspaceSettingsHandler } from './update-workspace-settings';

const app = new Hono()
  // Apply authentication middleware
  .use('*', requireAuth)
  
  // Approved Domains endpoints
  .get('/approved-domains', async (c) => {
    const user = c.get('busterUser');
    const response = await getApprovedDomainsHandler(user);
    return c.json(response);
  })
  .post('/approved-domains', zValidator('json', AddApprovedDomainRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const response = await addApprovedDomainsHandler(request, user);
    return c.json(response);
  })
  .delete('/approved-domains', zValidator('json', RemoveApprovedDomainRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const response = await removeApprovedDomainsHandler(request, user);
    return c.json(response);
  })
  
  // Workspace Settings endpoints
  .get('/workspace-settings', async (c) => {
    const user = c.get('busterUser');
    const response = await getWorkspaceSettingsHandler(user);
    return c.json(response);
  })
  .patch('/workspace-settings', zValidator('json', UpdateWorkspaceSettingsRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const response = await updateWorkspaceSettingsHandler(request, user);
    return c.json(response);
  })
  .onError((e, _c) => {
    if (e instanceof HTTPException) {
      return e.getResponse();
    }
    
    throw new HTTPException(500, {
      message: 'Internal server error',
    });
  });

export default app;