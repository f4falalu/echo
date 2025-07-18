import { getOrganization } from '@buster/database';
import type { GetOrganizationResponse } from '@buster/server-shared/organization';
import { Hono } from 'hono';
import { requireOrganization } from '../../../middleware/auth';

const app = new Hono().use('*', requireOrganization).get('/', async (c) => {
  const userOrg = c.get('userOrganizationInfo');

  const organization: GetOrganizationResponse = await getOrganization({
    organizationId: userOrg.organizationId,
  });

  return c.json(organization);
});

export default app;
