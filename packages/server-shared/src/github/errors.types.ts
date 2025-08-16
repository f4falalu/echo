import { z } from 'zod';

// GitHub-specific error codes
export const GitHubErrorCode = {
  INSTALLATION_NOT_FOUND: 'INSTALLATION_NOT_FOUND',
  INSTALLATION_SUSPENDED: 'INSTALLATION_SUSPENDED',
  INSTALLATION_REVOKED: 'INSTALLATION_REVOKED',
  INVALID_INSTALLATION_TOKEN: 'INVALID_INSTALLATION_TOKEN',
  TOKEN_GENERATION_FAILED: 'TOKEN_GENERATION_FAILED',
  TOKEN_STORAGE_FAILED: 'TOKEN_STORAGE_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  APP_AUTHENTICATION_FAILED: 'APP_AUTHENTICATION_FAILED',
  APP_CONFIGURATION_ERROR: 'APP_CONFIGURATION_ERROR',
  WEBHOOK_VERIFICATION_FAILED: 'WEBHOOK_VERIFICATION_FAILED',
  WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type GitHubErrorCode = (typeof GitHubErrorCode)[keyof typeof GitHubErrorCode];

// Structured error for GitHub operations
export const GitHubOperationErrorSchema = z.object({
  code: z.enum(Object.values(GitHubErrorCode) as [GitHubErrorCode, ...GitHubErrorCode[]]),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  statusCode: z.number().optional(),
});

export type GitHubOperationError = z.infer<typeof GitHubOperationErrorSchema>;
