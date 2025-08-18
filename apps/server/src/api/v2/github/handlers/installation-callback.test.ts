import type { githubIntegrations } from '@buster/database';
import type { InstallationCallbackRequest } from '@buster/server-shared/github';
import { GitHubErrorCode } from '@buster/server-shared/github';
import type { InferSelectModel } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installationCallbackHandler } from './installation-callback';

type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;

// Mock the services
vi.mock('../services/handle-installation-callback', () => ({
  handleInstallationCallback: vi.fn(),
}));

import { handleInstallationCallback } from '../services/handle-installation-callback';

describe('installationCallbackHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const mockIntegration: GitHubIntegration = {
    id: 'integration-123',
    organizationId: 'org-456',
    userId: 'user-789',
    installationId: '12345',
    appId: null,
    githubOrgId: '67890',
    githubOrgName: 'test-org',
    status: 'active',
    tokenVaultKey: 'vault-key-123',
    webhookSecretVaultKey: null,
    repositoryPermissions: {},
    installedAt: null,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const mockPayload: InstallationCallbackRequest = {
    action: 'created',
    installation: {
      id: 12345,
      account: {
        id: 67890,
        login: 'test-org',
      },
    },
  };

  it('should handle installation created with org context', async () => {
    vi.mocked(handleInstallationCallback).mockResolvedValue(mockIntegration);

    const result = await installationCallbackHandler(mockPayload, 'org-456', 'user-789');

    expect(result).toEqual({
      success: true,
      integration: mockIntegration,
      message: 'Installation created successfully',
    });

    expect(handleInstallationCallback).toHaveBeenCalledWith({
      payload: mockPayload,
      organizationId: 'org-456',
      userId: 'user-789',
    });
  });

  it('should handle installation deleted', async () => {
    const deletedPayload: InstallationCallbackRequest = {
      ...mockPayload,
      action: 'deleted',
    };

    vi.mocked(handleInstallationCallback).mockResolvedValue({
      ...mockIntegration,
      status: 'revoked',
      deletedAt: new Date().toISOString(),
    });

    const result = await installationCallbackHandler(deletedPayload);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Installation deleted successfully');
  });

  it('should handle installation suspended', async () => {
    const suspendedPayload: InstallationCallbackRequest = {
      ...mockPayload,
      action: 'suspend',
    };

    vi.mocked(handleInstallationCallback).mockResolvedValue({
      ...mockIntegration,
      status: 'suspended',
    });

    const result = await installationCallbackHandler(suspendedPayload);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Installation suspend successfully');
  });

  it('should handle installation unsuspended', async () => {
    const unsuspendedPayload: InstallationCallbackRequest = {
      ...mockPayload,
      action: 'unsuspend',
    };

    vi.mocked(handleInstallationCallback).mockResolvedValue({
      ...mockIntegration,
      status: 'active',
    });

    const result = await installationCallbackHandler(unsuspendedPayload);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Installation unsuspend successfully');
  });

  it('should throw 400 for created action without org context', async () => {
    await expect(installationCallbackHandler(mockPayload)).rejects.toThrow(HTTPException);

    try {
      await installationCallbackHandler(mockPayload);
    } catch (error) {
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
      }
    }
  });

  it('should handle INSTALLATION_NOT_FOUND error', async () => {
    const deletedPayload: InstallationCallbackRequest = {
      ...mockPayload,
      action: 'deleted',
    };

    const error = new Error('Installation not found') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.INSTALLATION_NOT_FOUND;
    vi.mocked(handleInstallationCallback).mockRejectedValue(error);

    await expect(installationCallbackHandler(deletedPayload)).rejects.toThrow(HTTPException);

    try {
      await installationCallbackHandler(deletedPayload);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(404);
      }
    }
  });

  it('should handle DATABASE_ERROR', async () => {
    const error = new Error('Database error') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.DATABASE_ERROR;
    vi.mocked(handleInstallationCallback).mockRejectedValue(error);

    await expect(installationCallbackHandler(mockPayload, 'org-456', 'user-789')).rejects.toThrow(
      HTTPException
    );

    try {
      await installationCallbackHandler(mockPayload, 'org-456', 'user-789');
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(500);
      }
    }
  });

  it('should handle unexpected errors', async () => {
    vi.mocked(handleInstallationCallback).mockRejectedValue(new Error('Unexpected error'));

    await expect(installationCallbackHandler(mockPayload, 'org-456', 'user-789')).rejects.toThrow(
      HTTPException
    );

    try {
      await installationCallbackHandler(mockPayload, 'org-456', 'user-789');
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(500);
      }
    }
  });
});
