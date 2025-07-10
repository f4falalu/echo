import type { UpdateWorkspaceSettingsRequest } from '@buster/server-shared/security';
import { describe, expect, it } from 'vitest';
import { WorkspaceSettingsService } from './workspace-settings-service';

describe('WorkspaceSettingsService', () => {
  const service = new WorkspaceSettingsService();

  describe('formatWorkspaceSettingsResponse', () => {
    it('should map snake_case to camelCase fields', () => {
      const settings = {
        restrictNewUserInvitations: true,
        defaultRole: 'member',
      };
      const result = service.formatWorkspaceSettingsResponse(settings);
      expect(result).toEqual({
        restrict_new_user_invitations: true,
        default_role: 'member',
        default_datasets: [],
      });
    });

    it('should include empty default_datasets array', () => {
      const settings = {
        restrictNewUserInvitations: false,
        defaultRole: 'admin',
      };
      const result = service.formatWorkspaceSettingsResponse(settings);
      expect(result.default_datasets).toEqual([]);
    });

    it('should handle all boolean values correctly', () => {
      const settingsTrue = {
        restrictNewUserInvitations: true,
        defaultRole: 'member',
      };
      const settingsFalse = {
        restrictNewUserInvitations: false,
        defaultRole: 'member',
      };

      expect(
        service.formatWorkspaceSettingsResponse(settingsTrue).restrict_new_user_invitations
      ).toBe(true);
      expect(
        service.formatWorkspaceSettingsResponse(settingsFalse).restrict_new_user_invitations
      ).toBe(false);
    });

    it('should handle all string values correctly', () => {
      const roles = ['workspace_admin', 'data_admin', 'querier', 'restricted_querier', 'viewer', 'none'];

      roles.forEach((role) => {
        const settings = {
          restrictNewUserInvitations: false,
          defaultRole: role,
        };
        const result = service.formatWorkspaceSettingsResponse(settings);
        expect(result.default_role).toBe(role);
      });
    });
  });

  describe('buildUpdateData', () => {
    it('should include updatedAt timestamp', () => {
      const request: UpdateWorkspaceSettingsRequest = {};
      const result = service.buildUpdateData(request);

      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt).toISOString()).toBe(result.updatedAt);
    });

    it('should handle partial updates (only restrict_new_user_invitations)', () => {
      const request: UpdateWorkspaceSettingsRequest = {
        restrict_new_user_invitations: true,
      };
      const result = service.buildUpdateData(request);

      expect(result).toHaveProperty('restrictNewUserInvitations', true);
      expect(result).not.toHaveProperty('defaultRole');
    });

    it('should handle partial updates (only default_role)', () => {
      const request: UpdateWorkspaceSettingsRequest = {
        default_role: 'admin',
      };
      const result = service.buildUpdateData(request);

      expect(result).toHaveProperty('defaultRole', 'admin');
      expect(result).not.toHaveProperty('restrictNewUserInvitations');
    });

    it('should handle full updates', () => {
      const request: UpdateWorkspaceSettingsRequest = {
        restrict_new_user_invitations: false,
        default_role: 'member',
      };
      const result = service.buildUpdateData(request);

      expect(result).toHaveProperty('restrictNewUserInvitations', false);
      expect(result).toHaveProperty('defaultRole', 'member');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should ignore undefined fields', () => {
      const request: UpdateWorkspaceSettingsRequest = {
        restrict_new_user_invitations: undefined,
        default_role: undefined,
      };
      const result = service.buildUpdateData(request);

      expect(result).not.toHaveProperty('restrictNewUserInvitations');
      expect(result).not.toHaveProperty('defaultRole');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should handle boolean false value correctly', () => {
      const request: UpdateWorkspaceSettingsRequest = {
        restrict_new_user_invitations: false,
      };
      const result = service.buildUpdateData(request);

      expect(result.restrictNewUserInvitations).toBe(false);
    });
  });
});
