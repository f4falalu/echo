import { describe, expect, it } from 'vitest';
import { GitHubErrorCode, GitHubOperationErrorSchema } from './errors.types';

describe('GitHub Error Types', () => {
  describe('GitHubErrorCode', () => {
    it('should have all expected error codes', () => {
      expect(GitHubErrorCode.INSTALLATION_NOT_FOUND).toBe('INSTALLATION_NOT_FOUND');
      expect(GitHubErrorCode.INSTALLATION_SUSPENDED).toBe('INSTALLATION_SUSPENDED');
      expect(GitHubErrorCode.INSTALLATION_REVOKED).toBe('INSTALLATION_REVOKED');
      expect(GitHubErrorCode.INVALID_INSTALLATION_TOKEN).toBe('INVALID_INSTALLATION_TOKEN');
      expect(GitHubErrorCode.TOKEN_GENERATION_FAILED).toBe('TOKEN_GENERATION_FAILED');
      expect(GitHubErrorCode.INSUFFICIENT_PERMISSIONS).toBe('INSUFFICIENT_PERMISSIONS');
      expect(GitHubErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(GitHubErrorCode.APP_AUTHENTICATION_FAILED).toBe('APP_AUTHENTICATION_FAILED');
      expect(GitHubErrorCode.WEBHOOK_VERIFICATION_FAILED).toBe('WEBHOOK_VERIFICATION_FAILED');
      expect(GitHubErrorCode.ORGANIZATION_NOT_FOUND).toBe('ORGANIZATION_NOT_FOUND');
    });
  });

  describe('GitHubOperationErrorSchema', () => {
    it('should parse minimal error', () => {
      const error = {
        code: GitHubErrorCode.INSTALLATION_NOT_FOUND,
        message: 'Installation not found',
      };
      const result = GitHubOperationErrorSchema.parse(error);
      expect(result.code).toBe('INSTALLATION_NOT_FOUND');
      expect(result.message).toBe('Installation not found');
    });

    it('should parse full error with details', () => {
      const error = {
        code: GitHubErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'API rate limit exceeded',
        details: {
          limit: 5000,
          remaining: 0,
          reset: '2024-01-01T00:00:00Z',
        },
        statusCode: 429,
      };
      const result = GitHubOperationErrorSchema.parse(error);
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.details?.limit).toBe(5000);
      expect(result.statusCode).toBe(429);
    });

    it('should accept all valid error codes', () => {
      Object.values(GitHubErrorCode).forEach((code) => {
        const error = {
          code,
          message: `Error: ${code}`,
        };
        expect(() => GitHubOperationErrorSchema.parse(error)).not.toThrow();
      });
    });

    it('should reject invalid error code', () => {
      const error = {
        code: 'INVALID_ERROR_CODE',
        message: 'This should fail',
      };
      expect(() => GitHubOperationErrorSchema.parse(error)).toThrow();
    });

    it('should parse error without optional fields', () => {
      const error = {
        code: GitHubErrorCode.TOKEN_GENERATION_FAILED,
        message: 'Could not generate token',
      };
      const result = GitHubOperationErrorSchema.parse(error);
      expect(result.details).toBeUndefined();
      expect(result.statusCode).toBeUndefined();
    });
  });
});
