# GitHub Integration Types

This module provides TypeScript types and Zod schemas for the GitHub OAuth integration.

## Overview

The GitHub integration uses GitHub App authentication to provide installation tokens for accessing GitHub repositories on behalf of organizations.

## Structure

```
github/
├── requests.types.ts   # Request schemas for API endpoints
├── responses.types.ts  # Response schemas for API endpoints
├── errors.types.ts     # Error codes and error response schemas
└── index.ts           # Main export file
```

## Key Types

### Request Types
- `InstallationCallbackRequest` - GitHub webhook payload for installation events
- `GetInstallationTokenRequest` - Request to retrieve an installation token
- `RefreshInstallationTokenRequest` - Request to refresh token for an organization

### Response Types
- `InstallationTokenResponse` - Contains token, expiry, and permissions
- `GetGitHubIntegrationResponse` - Integration status and details
- `GitHubOperationError` - Structured error responses

### Error Codes
```typescript
enum GitHubErrorCode {
  INSTALLATION_NOT_FOUND = 'INSTALLATION_NOT_FOUND',
  INSTALLATION_SUSPENDED = 'INSTALLATION_SUSPENDED',
  INSTALLATION_ALREADY_EXISTS = 'INSTALLATION_ALREADY_EXISTS',
  TOKEN_GENERATION_FAILED = 'TOKEN_GENERATION_FAILED',
  // ... etc
}
```

## Usage Example

```typescript
import { 
  InstallationCallbackSchema,
  type InstallationTokenResponse,
  GitHubErrorCode 
} from '@buster/server-shared/github';

// Validate webhook payload
const validatedPayload = InstallationCallbackSchema.parse(webhookBody);

// Type API responses
const response: InstallationTokenResponse = {
  token: 'ghs_...',
  expires_at: new Date().toISOString(),
  permissions: { contents: 'read', issues: 'write' },
  repository_selection: 'all'
};
```

## Validation

All request types have corresponding Zod schemas for runtime validation:
- Use `.parse()` for validation that throws on error
- Use `.safeParse()` for validation that returns a result object
- Export both schemas and inferred types for maximum flexibility

## Testing

Each type file has a corresponding test file validating the schemas with various payloads. Run tests with:
```bash
turbo run test:unit --filter=@buster/server-shared
```