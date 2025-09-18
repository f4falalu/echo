import { AssetPermissionRoleSchema } from '@buster/database/schema-types';
import type { z } from 'zod';

export { AssetPermissionRoleSchema };

export type AssetPermissionRole = z.infer<typeof AssetPermissionRoleSchema>;
