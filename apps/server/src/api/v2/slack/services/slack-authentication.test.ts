import * as accessControls from '@buster/access-controls';
import { SlackUserService } from '@buster/slack';
import { describe, expect, it, vi } from 'vitest';
import {
  type SlackAuthenticationResult,
  authenticateSlackUser,
  getUserIdFromAuthResult,
  isAuthSuccessful,
} from './slack-authentication';
import { SlackHelpers } from './slack-helpers';

// Mock dependencies
vi.mock('@buster/access-controls');
vi.mock('@buster/slack');
vi.mock('./slack-helpers');

describe('slack-authentication', () => {
  describe('authenticateSlackUser', () => {
    it('should return authorized for existing active user', async () => {
      const mockIntegration = {
        id: 'int-123',
        organizationId: 'org-123',
        userId: 'user-123',
        tokenVaultKey: 'token-key',
      };

      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        name: 'John Doe',
      };

      const mockOrg = {
        id: 'org-123',
        name: 'Example Org',
        defaultRole: 'querier',
      };

      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockResolvedValue(
        mockIntegration as any
      );
      vi.mocked(SlackHelpers.getAccessToken).mockResolvedValue('slack-token');
      vi.mocked(SlackHelpers.getUserById).mockResolvedValue(mockUser as any);

      const mockSlackUserService = {
        isBot: vi.fn().mockResolvedValue(false),
        isDeleted: vi.fn().mockResolvedValue(false),
        getUserInfo: vi.fn().mockResolvedValue({
          id: 'U123456',
          name: 'john.doe',
          real_name: 'John Doe',
          profile: {
            email: 'john@example.com',
          },
        }),
      };
      vi.mocked(SlackUserService).mockImplementation(() => mockSlackUserService as any);

      vi.mocked(accessControls.checkUserInOrganization).mockResolvedValue({
        userId: 'user-123',
        organizationId: 'org-123',
        role: 'querier',
        status: 'active',
      });

      vi.mocked(accessControls.getOrganizationWithDefaults).mockResolvedValue(mockOrg as any);

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'authorized',
        user: mockUser,
        organization: mockOrg,
      });

      expect(mockSlackUserService.isBot).toHaveBeenCalledWith('slack-token', 'U123456');
      expect(mockSlackUserService.isDeleted).toHaveBeenCalledWith('slack-token', 'U123456');
      expect(mockSlackUserService.getUserInfo).toHaveBeenCalledWith('slack-token', 'U123456');
    });

    it('should return unauthorized for bot users', async () => {
      const mockIntegration = {
        id: 'int-123',
        organizationId: 'org-123',
        userId: 'user-123',
        tokenVaultKey: 'token-key',
      };

      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockResolvedValue(
        mockIntegration as any
      );
      vi.mocked(SlackHelpers.getAccessToken).mockResolvedValue('slack-token');

      const mockSlackUserService = {
        isBot: vi.fn().mockResolvedValue(true),
        isDeleted: vi.fn().mockResolvedValue(false),
        getUserInfo: vi.fn().mockResolvedValue({
          id: 'U123456',
          name: 'bot',
          is_bot: true,
          profile: {
            email: 'bot@example.com',
          },
        }),
      };
      vi.mocked(SlackUserService).mockImplementation(() => mockSlackUserService as any);

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'unauthorized',
        reason: 'Bot users cannot access Buster',
      });
    });

    it('should return unauthorized for deleted users', async () => {
      const mockIntegration = {
        id: 'int-123',
        organizationId: 'org-123',
        userId: 'user-123',
        tokenVaultKey: 'token-key',
      };

      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockResolvedValue(
        mockIntegration as any
      );
      vi.mocked(SlackHelpers.getAccessToken).mockResolvedValue('slack-token');

      const mockSlackUserService = {
        isBot: vi.fn().mockResolvedValue(false),
        isDeleted: vi.fn().mockResolvedValue(true),
        getUserInfo: vi.fn().mockResolvedValue({
          id: 'U123456',
          name: 'deleted',
          deleted: true,
          profile: {
            email: 'deleted@example.com',
          },
        }),
      };
      vi.mocked(SlackUserService).mockImplementation(() => mockSlackUserService as any);

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'unauthorized',
        reason: 'Deleted users cannot access Buster',
      });
    });

    it('should return unauthorized for inactive user status', async () => {
      const mockIntegration = {
        id: 'int-123',
        organizationId: 'org-123',
        userId: 'user-123',
        tokenVaultKey: 'token-key',
      };

      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockResolvedValue(
        mockIntegration as any
      );
      vi.mocked(SlackHelpers.getAccessToken).mockResolvedValue('slack-token');

      const mockSlackUserService = {
        isBot: vi.fn().mockResolvedValue(false),
        isDeleted: vi.fn().mockResolvedValue(false),
        getUserInfo: vi.fn().mockResolvedValue({
          id: 'U123456',
          name: 'john.doe',
          real_name: 'John Doe',
          profile: {
            email: 'john@example.com',
          },
        }),
      };
      vi.mocked(SlackUserService).mockImplementation(() => mockSlackUserService as any);

      vi.mocked(accessControls.checkUserInOrganization).mockResolvedValue({
        userId: 'user-123',
        organizationId: 'org-123',
        role: 'querier',
        status: 'inactive',
      });

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'unauthorized',
        reason: 'User account is inactive. Please contact your administrator.',
      });
    });

    it('should auto-provision user when domain matches', async () => {
      const mockIntegration = {
        id: 'int-123',
        organizationId: 'org-123',
        userId: 'installer-123',
        tokenVaultKey: 'token-key',
      };

      const mockOrg = {
        id: 'org-123',
        name: 'Example Org',
        defaultRole: 'restricted_querier',
        domains: ['example.com'],
      };

      const mockNewUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
      };

      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockResolvedValue(
        mockIntegration as any
      );
      vi.mocked(SlackHelpers.getAccessToken).mockResolvedValue('slack-token');

      const mockSlackUserService = {
        isBot: vi.fn().mockResolvedValue(false),
        isDeleted: vi.fn().mockResolvedValue(false),
        getUserInfo: vi.fn().mockResolvedValue({
          id: 'U123456',
          real_name: 'New User',
          name: 'newuser',
          profile: {
            email: 'newuser@example.com',
          },
        }),
      };
      vi.mocked(SlackUserService).mockImplementation(() => mockSlackUserService as any);

      vi.mocked(accessControls.checkUserInOrganization).mockResolvedValue(null);
      vi.mocked(accessControls.getOrganizationWithDefaults).mockResolvedValue(mockOrg as any);
      vi.mocked(accessControls.checkEmailDomainForOrganization).mockResolvedValue(true);
      vi.mocked(accessControls.createUserInOrganization).mockResolvedValue({
        user: mockNewUser as any,
        membership: {
          userId: 'new-user-123',
          organizationId: 'org-123',
          role: 'restricted_querier',
          status: 'active',
        },
      });

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'auto_provisioned',
        user: mockNewUser,
        organization: mockOrg,
      });

      expect(accessControls.createUserInOrganization).toHaveBeenCalledWith(
        'newuser@example.com',
        'New User',
        'org-123',
        'installer-123'
      );
    });

    it('should return unauthorized when domain does not match', async () => {
      const mockIntegration = {
        id: 'int-123',
        organizationId: 'org-123',
        userId: 'user-123',
        tokenVaultKey: 'token-key',
      };

      const mockOrg = {
        id: 'org-123',
        name: 'Example Org',
        defaultRole: 'restricted_querier',
        domains: ['allowed.com'],
      };

      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockResolvedValue(
        mockIntegration as any
      );
      vi.mocked(SlackHelpers.getAccessToken).mockResolvedValue('slack-token');

      const mockSlackUserService = {
        isBot: vi.fn().mockResolvedValue(false),
        isDeleted: vi.fn().mockResolvedValue(false),
        getUserInfo: vi.fn().mockResolvedValue({
          id: 'U123456',
          name: 'user',
          real_name: 'User',
          profile: {
            email: 'user@notallowed.com',
          },
        }),
      };
      vi.mocked(SlackUserService).mockImplementation(() => mockSlackUserService as any);

      vi.mocked(accessControls.checkUserInOrganization).mockResolvedValue(null);
      vi.mocked(accessControls.getOrganizationWithDefaults).mockResolvedValue(mockOrg as any);
      vi.mocked(accessControls.checkEmailDomainForOrganization).mockResolvedValue(false);

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'unauthorized',
        reason:
          'Your email domain is not authorized for this organization. Please contact your administrator to be added.',
      });
    });

    it('should return unauthorized when no integration exists', async () => {
      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockResolvedValue(null);

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'unauthorized',
        reason: 'No active Slack integration found for this workspace',
      });
    });

    it('should return unauthorized when no access token found', async () => {
      const mockIntegration = {
        id: 'int-123',
        organizationId: 'org-123',
        userId: 'user-123',
        tokenVaultKey: 'token-key',
      };

      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockResolvedValue(
        mockIntegration as any
      );
      vi.mocked(SlackHelpers.getAccessToken).mockResolvedValue(null);

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'unauthorized',
        reason: 'Failed to retrieve Slack access token',
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(SlackHelpers.getActiveIntegrationByTeamId).mockRejectedValue(
        new Error('Database error')
      );

      const result = await authenticateSlackUser('U123456', 'T123456');

      expect(result).toEqual({
        type: 'unauthorized',
        reason: 'An error occurred during authentication. Please try again.',
      });
    });
  });

  describe('getUserIdFromAuthResult', () => {
    it('should return user ID for authorized result', () => {
      const result: SlackAuthenticationResult = {
        type: 'authorized',
        user: { id: 'user-123' } as any,
        organization: {} as any,
      };

      expect(getUserIdFromAuthResult(result)).toBe('user-123');
    });

    it('should return user ID for auto_provisioned result', () => {
      const result: SlackAuthenticationResult = {
        type: 'auto_provisioned',
        user: { id: 'user-456' } as any,
        organization: {} as any,
      };

      expect(getUserIdFromAuthResult(result)).toBe('user-456');
    });

    it('should return null for unauthorized result', () => {
      const result: SlackAuthenticationResult = {
        type: 'unauthorized',
        reason: 'Some reason',
      };

      expect(getUserIdFromAuthResult(result)).toBeNull();
    });
  });

  describe('isAuthSuccessful', () => {
    it('should return true for authorized result', () => {
      const result: SlackAuthenticationResult = {
        type: 'authorized',
        user: {} as any,
        organization: {} as any,
      };

      expect(isAuthSuccessful(result)).toBe(true);
    });

    it('should return true for auto_provisioned result', () => {
      const result: SlackAuthenticationResult = {
        type: 'auto_provisioned',
        user: {} as any,
        organization: {} as any,
      };

      expect(isAuthSuccessful(result)).toBe(true);
    });

    it('should return false for unauthorized result', () => {
      const result: SlackAuthenticationResult = {
        type: 'unauthorized',
        reason: 'Some reason',
      };

      expect(isAuthSuccessful(result)).toBe(false);
    });
  });
});
