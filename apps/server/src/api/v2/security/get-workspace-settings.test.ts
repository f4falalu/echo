import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWorkspaceSettingsHandler } from './get-workspace-settings';
import { createTestUser, createTestOrganization } from './test-fixtures';
import * as securityUtils from './security-utils';
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
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(mockOrgMembership);
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(mockOrg);
    
    // Setup workspace settings service mocks
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: [],
    });
  });

  it('should return settings for valid organization', async () => {
    const result = await getWorkspaceSettingsHandler(mockUser);
    
    expect(securityUtils.validateUserOrganization).toHaveBeenCalledWith(mockUser.id);
    expect(securityUtils.fetchOrganization).toHaveBeenCalledWith('org-123');
    
    expect(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).toHaveBeenCalledWith({
      restrictNewUserInvitations: true,
      defaultRole: 'restricted_querier',
    });
    
    expect(result).toEqual({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: [],
    });
  });

  it('should handle all settings values correctly', async () => {
    const orgWithDifferentSettings = {
      ...mockOrg,
      restrictNewUserInvitations: false,
      defaultRole: 'data_admin',
    };
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(orgWithDifferentSettings);
    
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: false,
      default_role: 'data_admin',
      default_datasets: [],
    });
    
    const result = await getWorkspaceSettingsHandler(mockUser);
    
    expect(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).toHaveBeenCalledWith({
      restrictNewUserInvitations: false,
      defaultRole: 'data_admin',
    });
    
    expect(result).toEqual({
      restrict_new_user_invitations: false,
      default_role: 'data_admin',
      default_datasets: [],
    });
  });

  it('should handle validation errors', async () => {
    vi.mocked(securityUtils.validateUserOrganization).mockRejectedValue(
      new Error('User not in organization')
    );
    
    await expect(getWorkspaceSettingsHandler(mockUser)).rejects.toThrow(
      'User not in organization'
    );
  });

  it('should handle organization fetch errors', async () => {
    vi.mocked(securityUtils.fetchOrganization).mockRejectedValue(
      new Error('Organization not found')
    );
    
    await expect(getWorkspaceSettingsHandler(mockUser)).rejects.toThrow(
      'Organization not found'
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
      
      vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
        restrict_new_user_invitations: true,
        default_role: 'restricted_querier',
        default_datasets: [],
      });
      
      const result = await getWorkspaceSettingsHandler(mockUser);
      
      // Should still succeed without admin permissions
      expect(result).toEqual({
        restrict_new_user_invitations: true,
        default_role: 'restricted_querier',
        default_datasets: [],
      });
    }
  });
});