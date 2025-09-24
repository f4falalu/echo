import {
  type AssetPermissionRole,
  type WorkspaceSharing,
  checkPermission,
} from '@buster/access-controls';
import { getUserOrganizationId } from '@buster/database/queries';
import type { AssetType } from '@buster/server-shared/assets';
import type { ShareUpdateRequest } from '@buster/server-shared/share';
import { HTTPException } from 'hono/http-exception';

// Base interface for assets with public access properties
type PublicAccessAsset = Pick<
  ShareUpdateRequest,
  'publicly_accessible' | 'public_expiry_date' | 'public_password'
>;

export const checkAssetPublicAccess = async <T extends PublicAccessAsset>({
  user,
  assetId,
  assetType,
  requiredRole = 'can_view',
  organizationId,
  workspaceSharing,
  asset,
  password,
}: {
  user: {
    id: string;
  };
  assetId: string;
  assetType: AssetType;
  requiredRole?: AssetPermissionRole;
  organizationId: string;
  workspaceSharing: WorkspaceSharing;
  password: string | undefined;
  asset: T;
}): Promise<T> => {
  const assetPermissionResult = await checkPermission({
    userId: user.id,
    assetId,
    assetType,
    requiredRole,
    organizationId,
    workspaceSharing,
    publiclyAccessible: asset.publicly_accessible ?? false,
    publicExpiryDate: asset.public_expiry_date ?? undefined,
    publicPassword: asset.public_password ?? undefined,
    userSuppliedPassword: password,
  });

  if (!assetPermissionResult.hasAccess) {
    const now = new Date();
    if (asset.publicly_accessible) {
      if (asset.public_expiry_date && new Date(asset.public_expiry_date) < now) {
        throw new HTTPException(403, { message: 'Public access to this report has expired' });
      }
      if (asset.public_password && !password) {
        throw new HTTPException(418, { message: 'Password required for public access' });
      }
      if (asset.public_password && asset.public_password !== password) {
        throw new HTTPException(403, { message: 'Password required for public access' });
      }
      // If we get here, public access is valid
      return asset;
    }
    throw new HTTPException(403, { message: 'You do not have permission to view this report' });
  }

  return asset;
};

export const checkIfAssetIsEditable = async ({
  user,
  assetId,
  assetType,
  organizationId,
  workspaceSharing,
  requiredRole = 'can_edit',
}: {
  user: {
    id: string;
  };
  assetId: string;
  assetType: AssetType;
  organizationId?: string;
  workspaceSharing: WorkspaceSharing | ((id: string) => Promise<WorkspaceSharing>);
  requiredRole?: AssetPermissionRole;
}) => {
  const workspaceSharingResult =
    typeof workspaceSharing === 'function' ? await workspaceSharing(assetId) : workspaceSharing;

  // Get user's organization ID
  const userOrgId =
    organizationId || (await getUserOrganizationId(user.id).then((res) => res?.organizationId));

  if (!userOrgId) {
    throw new HTTPException(403, { message: 'User is not associated with an organization' });
  }

  const assetPermissionResult = await checkPermission({
    userId: user.id,
    assetId,
    assetType,
    requiredRole,
    organizationId: userOrgId,
    workspaceSharing: workspaceSharingResult,
  });

  if (!assetPermissionResult.hasAccess) {
    throw new HTTPException(403, { message: 'You do not have permission to edit this asset' });
  }
};
