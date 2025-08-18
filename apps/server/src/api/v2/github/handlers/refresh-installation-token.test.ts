import type { User } from '@buster/database';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshInstallationTokenHandler } from './refresh-installation-token';

// Mock the database
vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
}));

// Mock the services
vi.mock('../services/get-installation-token', () => ({
  getInstallationTokenByOrgId: vi.fn(),
}));

import { getUserOrganizationId } from '@buster/database';
import { getInstallationTokenByOrgId } from '../services/get-installation-token';

describe('refreshInstallationTokenHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  const mockUserOrg = {
    organizationId: 'org-456',
    role: 'workspace_admin' as const,
  };

  const mockTokenResponse = {
    token: 'ghs_refreshed_token',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    permissions: {
      contents: 'read',
      issues: 'write',
    },
    repository_selection: 'all' as const,
  };

  it('should refresh token for user organization', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    vi.mocked(getInstallationTokenByOrgId).mockResolvedValue(mockTokenResponse);

    const result = await refreshInstallationTokenHandler(mockUser);

    expect(result).toEqual(mockTokenResponse);
    expect(getUserOrganizationId).toHaveBeenCalledWith('user-123');
    expect(getInstallationTokenByOrgId).toHaveBeenCalledWith('org-456');
  });

  it('should handle INSTALLATION_NOT_FOUND error', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    const error = new Error('No installation found') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.INSTALLATION_NOT_FOUND;
    vi.mocked(getInstallationTokenByOrgId).mockRejectedValue(error);

    await expect(refreshInstallationTokenHandler(mockUser)).rejects.toThrow(HTTPException);

    try {
      await refreshInstallationTokenHandler(mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(404);
      }
    }
  });

  it('should handle INSTALLATION_SUSPENDED error', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    const error = new Error('Installation suspended') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.INSTALLATION_SUSPENDED;
    vi.mocked(getInstallationTokenByOrgId).mockRejectedValue(error);

    await expect(refreshInstallationTokenHandler(mockUser)).rejects.toThrow(HTTPException);

    try {
      await refreshInstallationTokenHandler(mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(403);
      }
    }
  });

  it('should handle TOKEN_GENERATION_FAILED error', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    const error = new Error('Failed to generate token') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.TOKEN_GENERATION_FAILED;
    vi.mocked(getInstallationTokenByOrgId).mockRejectedValue(error);

    await expect(refreshInstallationTokenHandler(mockUser)).rejects.toThrow(HTTPException);

    try {
      await refreshInstallationTokenHandler(mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(500);
      }
    }
  });

  it('should handle DATABASE_ERROR', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    const error = new Error('Database connection failed') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.DATABASE_ERROR;
    vi.mocked(getInstallationTokenByOrgId).mockRejectedValue(error);

    await expect(refreshInstallationTokenHandler(mockUser)).rejects.toThrow(HTTPException);

    try {
      await refreshInstallationTokenHandler(mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(500);
      }
    }
  });

  it('should handle unexpected errors', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    vi.mocked(getInstallationTokenByOrgId).mockRejectedValue(new Error('Unexpected error'));

    await expect(refreshInstallationTokenHandler(mockUser)).rejects.toThrow(HTTPException);

    try {
      await refreshInstallationTokenHandler(mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(500);
      }
    }
  });

  it('should throw 400 when user has no organization', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(null);

    await expect(refreshInstallationTokenHandler(mockUser)).rejects.toThrow(HTTPException);

    try {
      await refreshInstallationTokenHandler(mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
      }
    }

    expect(getInstallationTokenByOrgId).not.toHaveBeenCalled();
  });
});
