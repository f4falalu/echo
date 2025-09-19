import { UserOrganizationStatusSchema } from '@buster/database/schema-types';
import type { z } from 'zod';

export { UserOrganizationStatusSchema };

export type UserOrganizationStatus = z.infer<typeof UserOrganizationStatusSchema>;
