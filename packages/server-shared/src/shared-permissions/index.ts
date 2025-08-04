import type { assetPermissionRoleEnum, workspaceSharingEnum } from '@buster/database';
import { z } from 'zod';

type AssetPermissionRoleBase = (typeof assetPermissionRoleEnum.enumValues)[number];
const AssetPermissionRoleEnums: Record<AssetPermissionRoleBase, AssetPermissionRoleBase> =
  Object.freeze({
    owner: 'owner',
    viewer: 'viewer',
    full_access: 'full_access',
    can_edit: 'can_edit',
    can_filter: 'can_filter',
    can_view: 'can_view',
  });

export const AssetPermissionRoleSchema = z.enum(
  Object.values(AssetPermissionRoleEnums) as [AssetPermissionRoleBase, ...AssetPermissionRoleBase[]]
);

export const IndividualPermissionSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  avatar_url: z.string().nullable(),
  role: AssetPermissionRoleSchema,
});

export type IndividualPermission = z.infer<typeof IndividualPermissionSchema>;

export const IndividualPermissionsSchema = z.array(IndividualPermissionSchema);

export type IndividualPermissions = z.infer<typeof IndividualPermissionsSchema>;

type WorkspaceSharingBase = (typeof workspaceSharingEnum.enumValues)[number];
const WorkspaceSharingEnums: Record<WorkspaceSharingBase, WorkspaceSharingBase> = Object.freeze({
  none: 'none',
  can_view: 'can_view',
  can_edit: 'can_edit',
  full_access: 'full_access',
});

export const WorkspaceSharingSchema = z.enum(
  Object.values(WorkspaceSharingEnums) as [WorkspaceSharingBase, ...WorkspaceSharingBase[]]
);
