import { describe, expect, it } from 'vitest';
import {
  GetInstallationTokenRequestSchema,
  InstallationCallbackSchema,
  RefreshInstallationTokenRequestSchema,
} from './requests.types';

describe('GitHub Request Schemas', () => {
  describe('InstallationCallbackSchema', () => {
    it('should parse valid installation created webhook', () => {
      const payload = {
        action: 'created',
        installation: {
          id: 12345,
          account: {
            login: 'octocat-org',
            id: 67890,
            type: 'Organization',
          },
          repository_selection: 'all',
          permissions: {
            contents: 'read',
            issues: 'write',
          },
        },
        repositories: [
          {
            id: 111,
            name: 'test-repo',
            full_name: 'octocat-org/test-repo',
            private: false,
          },
        ],
        sender: {
          login: 'octocat',
          id: 1,
          type: 'User',
        },
      };

      const result = InstallationCallbackSchema.parse(payload);
      expect(result.action).toBe('created');
      expect(result.installation.id).toBe(12345);
      expect(result.installation.account.login).toBe('octocat-org');
    });

    it('should parse minimal webhook payload', () => {
      const payload = {
        action: 'deleted',
        installation: {
          id: 99999,
          account: {
            login: 'test-user',
            id: 88888,
          },
        },
      };

      const result = InstallationCallbackSchema.parse(payload);
      expect(result.action).toBe('deleted');
      expect(result.installation.id).toBe(99999);
    });

    it('should accept all valid actions', () => {
      const actions = ['created', 'deleted', 'suspend', 'unsuspend'];
      actions.forEach((action) => {
        const payload = {
          action,
          installation: {
            id: 1,
            account: { login: 'test', id: 2 },
          },
        };
        expect(() => InstallationCallbackSchema.parse(payload)).not.toThrow();
      });
    });

    it('should reject invalid action', () => {
      const payload = {
        action: 'invalid_action',
        installation: {
          id: 1,
          account: { login: 'test', id: 2 },
        },
      };
      expect(() => InstallationCallbackSchema.parse(payload)).toThrow();
    });
  });

  describe('GetInstallationTokenRequestSchema', () => {
    it('should parse valid request', () => {
      const request = { installationId: '123456' };
      const result = GetInstallationTokenRequestSchema.parse(request);
      expect(result.installationId).toBe('123456');
    });

    it('should reject missing installationId', () => {
      expect(() => GetInstallationTokenRequestSchema.parse({})).toThrow();
    });
  });

  describe('RefreshInstallationTokenRequestSchema', () => {
    it('should parse valid UUID', () => {
      const request = { organizationId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = RefreshInstallationTokenRequestSchema.parse(request);
      expect(result.organizationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should reject invalid UUID', () => {
      const request = { organizationId: 'not-a-uuid' };
      expect(() => RefreshInstallationTokenRequestSchema.parse(request)).toThrow();
    });
  });
});
