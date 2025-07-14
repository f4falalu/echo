import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWorkspaceSettingsHandler } from './get-workspace-settings';
import * as securityUtils from './security-utils';
import { createTestOrganization, createTestUser } from './test-fixtures';
import { WorkspaceSettingsService } from './workspace-settings-service';

// Mock dependencies
vi.mock('./security-utils');
vi.mock('./workspace-settings-service', () => {
  const WorkspaceSettingsService = vi.fn();
  WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse = vi.fn();
  return { WorkspaceSettingsService };
});

describe('getWorkspaceSettingsHandler', () => {
  const mockUser = createTestUser();
  const mockOrg = createTestOrganization({
    id: 'org-123',
    restrictNewUserInvitations: true,
    defaultRole: 'restricted_querier',
  });
  const mockOrgMembership = { organizationId: 'org-123', role: 'member' };
  const mockDefaultDatasets = [
    { id: 'dataset-1', name: 'Sales Data' },
    { id: 'dataset-2', name: 'Customer Data' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(mockOrgMembership);
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(mockOrg);
    vi.mocked(securityUtils.fetchDefaultDatasets).mockResolvedValue(mockDefaultDatasets);

    // Setup workspace settings service mocks
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: mockDefaultDatasets,
    });
  });

  it('should return settings for valid organization', async () => {
    const result = await getWorkspaceSettingsHandler(mockUser);

    expect(securityUtils.validateUserOrganization).toHaveBeenCalledWith(mockUser.id);
    expect(securityUtils.fetchOrganization).toHaveBeenCalledWith('org-123');
    expect(securityUtils.fetchDefaultDatasets).toHaveBeenCalledWith('org-123');

    expect(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).toHaveBeenCalledWith(
      {
        restrictNewUserInvitations: true,
        defaultRole: 'restricted_querier',
        defaultDatasets: mockDefaultDatasets,
      }
    );

    expect(result).toEqual({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: mockDefaultDatasets,
    });
  });

  it('should handle all settings values correctly', async () => {
    const orgWithDifferentSettings = {
      ...mockOrg,
      restrictNewUserInvitations: false,
      defaultRole: 'data_admin' as const,
    };
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(orgWithDifferentSettings);

    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: false,
      default_role: 'data_admin',
      default_datasets: mockDefaultDatasets,
    });

    const result = await getWorkspaceSettingsHandler(mockUser);

    expect(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).toHaveBeenCalledWith(
      {
        restrictNewUserInvitations: false,
        defaultRole: 'data_admin',
        defaultDatasets: mockDefaultDatasets,
      }
    );

    expect(result).toEqual({
      restrict_new_user_invitations: false,
      default_role: 'data_admin',
      default_datasets: mockDefaultDatasets,
    });
  });

  it('should handle validation errors', async () => {
    vi.mocked(securityUtils.validateUserOrganization).mockRejectedValue(
      new Error('User not in organization')
    );

    await expect(getWorkspaceSettingsHandler(mockUser)).rejects.toThrow(
      'Failed to fetch workspace settings'
    );
  });

  it('should handle organization fetch errors', async () => {
    vi.mocked(securityUtils.fetchOrganization).mockRejectedValue(
      new Error('Organization not found')
    );

    await expect(getWorkspaceSettingsHandler(mockUser)).rejects.toThrow(
      'Failed to fetch workspace settings'
    );
  });

  it('should not require admin permissions', async () => {
    // Test with various non-admin roles
    const roles = ['querier', 'restricted_querier', 'viewer'];

    for (const role of roles) {
      vi.clearAllMocks();
      const membership = { organizationId: 'org-123', role };
      vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(membership);
      vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(mockOrg);

      vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue(
        {
          restrict_new_user_invitations: true,
          default_role: 'restricted_querier',
          default_datasets: mockDefaultDatasets,
        }
      );

      const result = await getWorkspaceSettingsHandler(mockUser);

      // Should still succeed without admin permissions
      expect(result).toEqual({
        restrict_new_user_invitations: true,
        default_role: 'restricted_querier',
        default_datasets: mockDefaultDatasets,
      });
    }
  });

  it('should handle empty default datasets', async () => {
    vi.mocked(securityUtils.fetchDefaultDatasets).mockResolvedValue([]);

    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: [],
    });

    const result = await getWorkspaceSettingsHandler(mockUser);

    expect(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).toHaveBeenCalledWith(
      {
        restrictNewUserInvitations: true,
        defaultRole: 'restricted_querier',
        defaultDatasets: [],
      }
    );

    expect(result).toEqual({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: [],
    });
  });
});
