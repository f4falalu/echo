import type { User } from '@buster/database';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInstallationTokenHandler } from './get-installation-token';

// Mock the database
vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
}));

// Mock the services
vi.mock('../services/get-installation-token', () => ({
  getInstallationToken: vi.fn(),
  verifyInstallationOwnership: vi.fn(),
}));

import { getUserOrganizationId } from '@buster/database';
import {
  getInstallationToken,
  verifyInstallationOwnership,
} from '../services/get-installation-token';

describe('getInstallationTokenHandler', () => {
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
    token: 'ghs_test_token',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    permissions: {
      contents: 'read',
      issues: 'write',
    },
    repository_selection: 'all' as const,
  };

  it('should return token for authorized user', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    vi.mocked(verifyInstallationOwnership).mockResolvedValue(true);
    vi.mocked(getInstallationToken).mockResolvedValue(mockTokenResponse);

    const result = await getInstallationTokenHandler('12345', mockUser);

    expect(result).toEqual(mockTokenResponse);
    expect(getUserOrganizationId).toHaveBeenCalledWith('user-123');
    expect(verifyInstallationOwnership).toHaveBeenCalledWith('12345', 'org-456');
    expect(getInstallationToken).toHaveBeenCalledWith('12345');
  });

  it('should throw 403 when user lacks access', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    vi.mocked(verifyInstallationOwnership).mockResolvedValue(false);

    await expect(getInstallationTokenHandler('12345', mockUser)).rejects.toThrow(HTTPException);

    try {
      await getInstallationTokenHandler('12345', mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(403);
      }
    }

    expect(getInstallationToken).not.toHaveBeenCalled();
  });

  it('should handle INSTALLATION_NOT_FOUND error', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    vi.mocked(verifyInstallationOwnership).mockResolvedValue(true);

    const error = new Error('Installation not found') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.INSTALLATION_NOT_FOUND;
    vi.mocked(getInstallationToken).mockRejectedValue(error);

    await expect(getInstallationTokenHandler('12345', mockUser)).rejects.toThrow(HTTPException);

    try {
      await getInstallationTokenHandler('12345', mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(404);
      }
    }
  });

  it('should handle INSTALLATION_SUSPENDED error', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    vi.mocked(verifyInstallationOwnership).mockResolvedValue(true);

    const error = new Error('Installation suspended') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.INSTALLATION_SUSPENDED;
    vi.mocked(getInstallationToken).mockRejectedValue(error);

    await expect(getInstallationTokenHandler('12345', mockUser)).rejects.toThrow(HTTPException);

    try {
      await getInstallationTokenHandler('12345', mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(403);
      }
    }
  });

  it('should handle TOKEN_GENERATION_FAILED error', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    vi.mocked(verifyInstallationOwnership).mockResolvedValue(true);

    const error = new Error('Failed to generate token') as Error & { code: GitHubErrorCode };
    error.code = GitHubErrorCode.TOKEN_GENERATION_FAILED;
    vi.mocked(getInstallationToken).mockRejectedValue(error);

    await expect(getInstallationTokenHandler('12345', mockUser)).rejects.toThrow(HTTPException);

    try {
      await getInstallationTokenHandler('12345', mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(500);
      }
    }
  });

  it('should handle unexpected errors', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockUserOrg);
    vi.mocked(verifyInstallationOwnership).mockResolvedValue(true);
    vi.mocked(getInstallationToken).mockRejectedValue(new Error('Unexpected error'));

    await expect(getInstallationTokenHandler('12345', mockUser)).rejects.toThrow(HTTPException);

    try {
      await getInstallationTokenHandler('12345', mockUser);
    } catch (err) {
      expect(err).toBeInstanceOf(HTTPException);
      if (err instanceof HTTPException) {
        expect(err.status).toBe(500);
      }
    }
  });

  it('should throw 400 when user has no organization', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(null);

    await expect(getInstallationTokenHandler('12345', mockUser)).rejects.toThrow(HTTPException);

    try {
      await getInstallationTokenHandler('12345', mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
      }
    }

    expect(verifyInstallationOwnership).not.toHaveBeenCalled();
    expect(getInstallationToken).not.toHaveBeenCalled();
  });
});
