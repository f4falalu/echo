import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateWorkspaceSettingsHandler } from './update-workspace-settings';
import { createTestUser, createTestOrganization } from './test-fixtures';
import * as securityUtils from './security-utils';
import { WorkspaceSettingsService } from './workspace-settings-service';
import { db } from '@buster/database';

// Mock dependencies
vi.mock('./security-utils');
vi.mock('./workspace-settings-service', () => {
  const WorkspaceSettingsService = vi.fn();
  WorkspaceSettingsService.prototype.buildUpdateData = vi.fn();
  WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse = vi.fn();
  return { WorkspaceSettingsService };
});
vi.mock('@buster/database', () => ({
  db: {
    update: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
  },
  organizations: {},
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

describe('updateWorkspaceSettingsHandler', () => {
  const mockUser = createTestUser();
  const mockOrg = createTestOrganization({
    id: 'org-123',
    restrictNewUserInvitations: false,
    defaultRole: 'restricted_querier',
  });
  const mockOrgMembership = { organizationId: 'org-123', role: 'workspace_admin' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(mockOrgMembership);
    vi.mocked(securityUtils.checkWorkspaceAdminPermission).mockImplementation(() => {});
    vi.mocked(securityUtils.fetchOrganization)
      .mockResolvedValueOnce(mockOrg) // First call for initial fetch
      .mockResolvedValueOnce({ ...mockOrg, restrictNewUserInvitations: true }); // Second call after update
    
    // Setup workspace settings service mocks
    vi.mocked(WorkspaceSettingsService.prototype.buildUpdateData).mockReturnValue({
      updatedAt: '2024-01-01T00:00:00Z',
      restrictNewUserInvitations: true,
    });
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: [],
    });
    
    // Mock database update
    const mockDbChain = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.update).mockReturnValue(mockDbChain as any);
  });

  it('should update all settings fields', async () => {
    const request = {
      restrict_new_user_invitations: true,
      default_role: 'data_admin',
    };
    
    vi.mocked(WorkspaceSettingsService.prototype.buildUpdateData).mockReturnValue({
      updatedAt: '2024-01-01T00:00:00Z',
      restrictNewUserInvitations: true,
      defaultRole: 'data_admin',
    });
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: true,
      default_role: 'data_admin',
      default_datasets: [],
    });
    
    const result = await updateWorkspaceSettingsHandler(request, mockUser);
    
    expect(securityUtils.validateUserOrganization).toHaveBeenCalledWith(mockUser.id);
    expect(securityUtils.checkWorkspaceAdminPermission).toHaveBeenCalledWith('workspace_admin');
    expect(WorkspaceSettingsService.prototype.buildUpdateData).toHaveBeenCalledWith(request);
    
    expect(result).toEqual({
      restrict_new_user_invitations: true,
      default_role: 'data_admin',
      default_datasets: [],
    });
  });

  it('should handle partial updates correctly', async () => {
    const request = { restrict_new_user_invitations: true };
    
    const result = await updateWorkspaceSettingsHandler(request, mockUser);
    
    expect(WorkspaceSettingsService.prototype.buildUpdateData).toHaveBeenCalledWith(request);
    
    expect(result).toEqual({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: [],
    });
  });

  it('should update database with new settings', async () => {
    const request = { default_role: 'admin' };
    const mockDbChain = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.update).mockReturnValue(mockDbChain as any);
    
    vi.mocked(WorkspaceSettingsService.prototype.buildUpdateData).mockReturnValue({
      updatedAt: '2024-01-01T00:00:00Z',
      defaultRole: 'data_admin',
    });
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: false,
      default_role: 'data_admin',
      default_datasets: [],
    });
    
    await updateWorkspaceSettingsHandler(request, mockUser);
    
    expect(db.update).toHaveBeenCalled();
    expect(mockDbChain.set).toHaveBeenCalledWith({
      updatedAt: '2024-01-01T00:00:00Z',
      defaultRole: 'data_admin',
    });
  });

  it('should fetch updated organization after update', async () => {
    const request = { restrict_new_user_invitations: true };
    
    await updateWorkspaceSettingsHandler(request, mockUser);
    
    expect(securityUtils.fetchOrganization).toHaveBeenCalledTimes(1);
    expect(securityUtils.fetchOrganization).toHaveBeenCalledWith('org-123');
  });

  it('should handle validation errors', async () => {
    vi.mocked(securityUtils.validateUserOrganization).mockRejectedValue(
      new Error('User not in organization')
    );
    
    const request = { restrict_new_user_invitations: true };
    
    await expect(updateWorkspaceSettingsHandler(request, mockUser)).rejects.toThrow(
      'User not in organization'
    );
  });

  it('should handle permission errors', async () => {
    vi.mocked(securityUtils.checkWorkspaceAdminPermission).mockImplementation(() => {
      throw new Error('Only workspace admins can update settings');
    });
    
    const request = { restrict_new_user_invitations: true };
    
    await expect(updateWorkspaceSettingsHandler(request, mockUser)).rejects.toThrow(
      'Only workspace admins can update settings'
    );
  });

  it('should reject non-workspace-admin users', async () => {
    const nonAdminMembership = { organizationId: 'org-123', role: 'data_admin' };
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(nonAdminMembership);
    vi.mocked(securityUtils.checkWorkspaceAdminPermission).mockImplementation((role) => {
      if (role !== 'workspace_admin') {
        throw new Error('Only workspace admins can update settings');
      }
    });
    
    const request = { restrict_new_user_invitations: true };
    
    await expect(updateWorkspaceSettingsHandler(request, mockUser)).rejects.toThrow(
      'Only workspace admins can update settings'
    );
  });
});