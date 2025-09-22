import { type WorkspaceSharing, checkPermission } from '@buster/access-controls';
import type { AssetType } from '@buster/server-shared/assets';
import type { ShareUpdateRequest } from '@buster/server-shared/share';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { checkAssetPublicAccess } from './asset-public-access';

// Mock the checkPermission function
vi.mock('@buster/access-controls', () => ({
  checkPermission: vi.fn(),
}));

describe('checkAssetPublicAccess', () => {
  const mockCheckPermission = checkPermission as Mock;

  // Mock data setup
  const mockUser = {
    id: 'user-123',
  };

  const mockAssetId = 'asset-123';
  const mockAssetType: AssetType = 'report_file';
  const mockOrganizationId = 'org-123';
  const mockWorkspaceSharing: WorkspaceSharing = 'can_view';

  const baseAsset: Pick<
    ShareUpdateRequest,
    'publicly_accessible' | 'public_expiry_date' | 'public_password'
  > = {
    publicly_accessible: false,
    public_expiry_date: null,
    public_password: null,
  };

  const commonParams = {
    user: mockUser,
    assetId: mockAssetId,
    assetType: mockAssetType,
    organizationId: mockOrganizationId,
    workspaceSharing: mockWorkspaceSharing,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user has permission access', () => {
    beforeEach(() => {
      mockCheckPermission.mockResolvedValue({ hasAccess: true });
    });

    it('should return asset when user has view permission', async () => {
      const asset = { ...baseAsset, publicly_accessible: false };

      const result = await checkAssetPublicAccess({
        ...commonParams,
        asset,
        password: undefined,
      });

      expect(result).toEqual(asset);
      expect(mockCheckPermission).toHaveBeenCalledWith({
        userId: mockUser.id,
        assetId: mockAssetId,
        assetType: mockAssetType,
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: mockWorkspaceSharing,
      });
    });

    it('should return asset when user has custom required role', async () => {
      const asset = { ...baseAsset };

      const result = await checkAssetPublicAccess({
        ...commonParams,
        asset,
        password: undefined,
        requiredRole: 'can_edit',
      });

      expect(result).toEqual(asset);
      expect(mockCheckPermission).toHaveBeenCalledWith({
        userId: mockUser.id,
        assetId: mockAssetId,
        assetType: mockAssetType,
        requiredRole: 'can_edit',
        organizationId: mockOrganizationId,
        workspaceSharing: mockWorkspaceSharing,
      });
    });

    it('should return asset even when it has public access settings if user has permission', async () => {
      const asset = {
        ...baseAsset,
        publicly_accessible: true,
        public_password: 'secret',
      };

      const result = await checkAssetPublicAccess({
        ...commonParams,
        asset,
        password: undefined, // No password provided, but should work since user has permission
      });

      expect(result).toEqual(asset);
    });
  });

  describe('when user does not have permission access', () => {
    beforeEach(() => {
      mockCheckPermission.mockResolvedValue({ hasAccess: false });
    });

    describe('and asset is not publicly accessible', () => {
      it('should throw 403 error', async () => {
        const asset = { ...baseAsset, publicly_accessible: false };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset,
            password: undefined,
          })
        ).rejects.toThrow(
          new HTTPException(403, { message: 'You do not have permission to view this report' })
        );
      });
    });

    describe('and asset is publicly accessible', () => {
      it('should return asset when no expiry date and no password', async () => {
        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_expiry_date: null,
          public_password: null,
        };

        const result = await checkAssetPublicAccess({
          ...commonParams,
          asset,
          password: undefined,
        });

        expect(result).toEqual(asset);
      });

      it('should return asset when expiry date is in the future', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_expiry_date: futureDate.toISOString(),
          public_password: null,
        };

        const result = await checkAssetPublicAccess({
          ...commonParams,
          asset,
          password: undefined,
        });

        expect(result).toEqual(asset);
      });

      it('should throw 403 error when expiry date is in the past', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday

        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_expiry_date: pastDate.toISOString(),
          public_password: null,
        };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset,
            password: undefined,
          })
        ).rejects.toThrow(
          new HTTPException(403, { message: 'Public access to this report has expired' })
        );
      });

      it('should throw 418 error when password is required but not provided', async () => {
        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_password: 'secret123',
        };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset,
            password: undefined,
          })
        ).rejects.toThrow(
          new HTTPException(418, { message: 'Password required for public access' })
        );
      });

      it('should throw 403 error when wrong password is provided', async () => {
        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_password: 'secret123',
        };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset,
            password: 'wrong-password',
          })
        ).rejects.toThrow(
          new HTTPException(403, { message: 'Password required for public access' })
        );
      });

      it('should return asset when correct password is provided', async () => {
        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_password: 'secret123',
        };

        const result = await checkAssetPublicAccess({
          ...commonParams,
          asset,
          password: 'secret123',
        });

        expect(result).toEqual(asset);
      });

      it('should handle combined expiry date and password correctly - valid case', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_expiry_date: futureDate.toISOString(),
          public_password: 'secret123',
        };

        const result = await checkAssetPublicAccess({
          ...commonParams,
          asset,
          password: 'secret123',
        });

        expect(result).toEqual(asset);
      });

      it('should throw 403 error when expiry date is past even with correct password', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday

        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_expiry_date: pastDate.toISOString(),
          public_password: 'secret123',
        };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset,
            password: 'secret123',
          })
        ).rejects.toThrow(
          new HTTPException(403, { message: 'Public access to this report has expired' })
        );
      });

      it('should throw 418 error when expiry is valid but password is missing', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_expiry_date: futureDate.toISOString(),
          public_password: 'secret123',
        };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset,
            password: undefined,
          })
        ).rejects.toThrow(
          new HTTPException(418, { message: 'Password required for public access' })
        );
      });

      it('should handle empty string password correctly', async () => {
        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_password: '',
        };

        const result = await checkAssetPublicAccess({
          ...commonParams,
          asset,
          password: '',
        });

        expect(result).toEqual(asset);
      });
    });

    describe('edge cases', () => {
      it('should handle asset with additional properties correctly', async () => {
        const assetWithExtraProps = {
          ...baseAsset,
          publicly_accessible: true,
          id: 'some-id',
          name: 'Test Asset',
          description: 'Test description',
        };

        const result = await checkAssetPublicAccess({
          ...commonParams,
          asset: assetWithExtraProps,
          password: undefined,
        });

        expect(result).toEqual(assetWithExtraProps);
      });

      it('should handle Date objects for expiry date correctly', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        const asset = {
          ...baseAsset,
          publicly_accessible: true,
          public_expiry_date: futureDate.toISOString(),
        };

        const result = await checkAssetPublicAccess({
          ...commonParams,
          asset,
          password: undefined,
        });

        expect(result).toEqual(asset);
      });

      it('should handle different asset types correctly', async () => {
        const asset = { ...baseAsset, publicly_accessible: true };

        const result = await checkAssetPublicAccess({
          ...commonParams,
          asset,
          password: undefined,
          assetType: 'dashboard' as AssetType,
        });

        expect(result).toEqual(asset);
        expect(mockCheckPermission).toHaveBeenCalledWith({
          userId: mockUser.id,
          assetId: mockAssetId,
          assetType: 'dashboard',
          requiredRole: 'can_view',
          organizationId: mockOrganizationId,
          workspaceSharing: mockWorkspaceSharing,
        });
      });
    });

    describe('error message consistency', () => {
      it('should have consistent error messages for different scenarios', async () => {
        // Test that all permission-related errors use the same base message
        const asset = { ...baseAsset, publicly_accessible: false };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset,
            password: undefined,
          })
        ).rejects.toThrow('You do not have permission to view this report');

        // Test expired access message
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const expiredAsset = {
          ...baseAsset,
          publicly_accessible: true,
          public_expiry_date: pastDate.toISOString(),
        };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset: expiredAsset,
            password: undefined,
          })
        ).rejects.toThrow('Public access to this report has expired');

        // Test password required messages
        const passwordProtectedAsset = {
          ...baseAsset,
          publicly_accessible: true,
          public_password: 'secret',
        };

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset: passwordProtectedAsset,
            password: undefined,
          })
        ).rejects.toThrow('Password required for public access');

        await expect(
          checkAssetPublicAccess({
            ...commonParams,
            asset: passwordProtectedAsset,
            password: 'wrong',
          })
        ).rejects.toThrow('Password required for public access');
      });
    });
  });

  describe('checkPermission integration', () => {
    it('should handle checkPermission promise rejection gracefully', async () => {
      const permissionError = new Error('Database connection failed');
      mockCheckPermission.mockRejectedValue(permissionError);

      const asset = { ...baseAsset };

      await expect(
        checkAssetPublicAccess({
          ...commonParams,
          asset,
          password: undefined,
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should pass all required parameters to checkPermission', async () => {
      mockCheckPermission.mockResolvedValue({ hasAccess: true });
      const asset = { ...baseAsset };

      await checkAssetPublicAccess({
        ...commonParams,
        asset,
        password: undefined,
        requiredRole: 'can_edit',
      });

      expect(mockCheckPermission).toHaveBeenCalledWith({
        userId: 'user-123',
        assetId: 'asset-123',
        assetType: 'report_file',
        requiredRole: 'can_edit',
        organizationId: 'org-123',
        workspaceSharing: 'can_view',
      });
    });
  });
});
