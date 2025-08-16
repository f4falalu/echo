import { describe, expect, it } from 'vitest';
import {
  GetGitHubIntegrationResponseSchema,
  GitHubErrorResponseSchema,
  InstallationCallbackResponseSchema,
  InstallationTokenResponseSchema,
} from './responses.types';

describe('GitHub Response Schemas', () => {
  describe('GitHubErrorResponseSchema', () => {
    it('should parse minimal error', () => {
      const error = { error: 'Not Found' };
      const result = GitHubErrorResponseSchema.parse(error);
      expect(result.error).toBe('Not Found');
    });

    it('should parse full error', () => {
      const error = {
        error: 'Bad Request',
        message: 'Invalid installation ID',
        documentation_url: 'https://docs.github.com/...',
        status: 400,
      };
      const result = GitHubErrorResponseSchema.parse(error);
      expect(result.message).toBe('Invalid installation ID');
      expect(result.status).toBe(400);
    });
  });

  describe('InstallationCallbackResponseSchema', () => {
    it('should parse successful response', () => {
      const response = {
        success: true,
        integrationId: '550e8400-e29b-41d4-a716-446655440000',
        message: 'Installation successful',
      };
      const result = InstallationCallbackResponseSchema.parse(response);
      expect(result.success).toBe(true);
      expect(result.integrationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should parse response without message', () => {
      const response = {
        success: false,
        integrationId: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = InstallationCallbackResponseSchema.parse(response);
      expect(result.success).toBe(false);
      expect(result.message).toBeUndefined();
    });
  });

  describe('InstallationTokenResponseSchema', () => {
    it('should parse token response with all fields', () => {
      const response = {
        token: 'ghs_16C7e42F292c69...',
        expires_at: '2024-01-01T00:00:00Z',
        permissions: {
          contents: 'read',
          issues: 'write',
          pull_requests: 'write',
        },
        repository_selection: 'all',
        repositories: [
          {
            id: 123,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: true,
          },
        ],
      };
      const result = InstallationTokenResponseSchema.parse(response);
      expect(result.token).toBe('ghs_16C7e42F292c69...');
      expect(result.permissions?.contents).toBe('read');
      expect(result.repository_selection).toBe('all');
    });

    it('should parse minimal token response', () => {
      const response = {
        token: 'ghs_token123',
        expires_at: '2024-12-31T23:59:59Z',
      };
      const result = InstallationTokenResponseSchema.parse(response);
      expect(result.token).toBe('ghs_token123');
      expect(result.expires_at).toBe('2024-12-31T23:59:59Z');
      expect(result.permissions).toBeUndefined();
    });
  });

  describe('GetGitHubIntegrationResponseSchema', () => {
    it('should parse connected integration', () => {
      const response = {
        connected: true,
        status: 'active',
        integration: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          github_org_name: 'octocat-org',
          github_org_id: '12345',
          installation_id: '67890',
          installed_at: '2024-01-01T00:00:00Z',
          last_used_at: '2024-01-15T12:00:00Z',
          repository_count: 5,
        },
      };
      const result = GetGitHubIntegrationResponseSchema.parse(response);
      expect(result.connected).toBe(true);
      expect(result.status).toBe('active');
      expect(result.integration?.github_org_name).toBe('octocat-org');
    });

    it('should parse disconnected integration', () => {
      const response = {
        connected: false,
        status: 'revoked',
      };
      const result = GetGitHubIntegrationResponseSchema.parse(response);
      expect(result.connected).toBe(false);
      expect(result.status).toBe('revoked');
      expect(result.integration).toBeUndefined();
    });

    it('should accept all valid statuses', () => {
      const statuses = ['pending', 'active', 'suspended', 'revoked'];
      statuses.forEach((status) => {
        const response = { connected: true, status };
        expect(() => GetGitHubIntegrationResponseSchema.parse(response)).not.toThrow();
      });
    });
  });
});
