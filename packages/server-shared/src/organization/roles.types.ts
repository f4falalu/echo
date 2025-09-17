import { UserOrganizationRoleSchema } from '@buster/database/schema-types'; //we import as type to avoid postgres dependency in the frontend ☹️
import type { z } from 'zod';

export { UserOrganizationRoleSchema };

export type UserOrganizationRole = z.infer<typeof UserOrganizationRoleSchema>;
