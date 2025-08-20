# GitHub Integrations Database Queries

This module provides database query functions for managing GitHub App installations.

## Overview

These queries handle the lifecycle of GitHub integrations, from installation to revocation, with soft delete support and proper status management.

## Available Queries

### `createGithubIntegration(params)`
Creates a new GitHub integration record when a GitHub App is installed.

**Required fields:**
- `installationId` - GitHub's installation ID
- `githubOrgId` - GitHub organization ID
- `organizationId` - Our internal organization ID
- `userId` - User who initiated the installation

### `getActiveGithubIntegration(organizationId)`
Retrieves the active GitHub integration for an organization.
- Filters by `status = 'active'`
- Returns `null` if no active integration exists

### `getGithubIntegrationByInstallationId(installationId)`
Looks up an integration by GitHub's installation ID.
- Includes all statuses (not just active)
- Used for webhook processing

### `updateGithubIntegration(id, updates)`
Updates any fields on an existing integration.
- Common updates: `tokenVaultKey`, `status`, `lastUsedAt`

### `softDeleteGithubIntegration(id)`
Soft deletes an integration by setting:
- `status = 'revoked'`
- `deletedAt = now()`

### `markGithubIntegrationAsFailed(id)`
Marks an integration as suspended/failed:
- `status = 'suspended'`
- Used when GitHub suspends the installation

## Database Schema

```typescript
githubIntegrations: {
  id: string;
  organizationId: string;
  userId: string;
  installationId: string;
  appId?: string;
  githubOrgId: string;
  githubOrgName?: string;
  status: 'pending' | 'active' | 'suspended' | 'revoked';
  tokenVaultKey?: string;
  webhookSecretVaultKey?: string;
  repositoryPermissions?: Record<string, string>;
  installedAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

## Status Lifecycle

1. **pending** - Initial state after installation
2. **active** - Token generated and stored successfully
3. **suspended** - GitHub suspended the installation
4. **revoked** - User uninstalled the app (soft deleted)

## Usage Example

```typescript
import { 
  createGithubIntegration,
  getActiveGithubIntegration,
  updateGithubIntegration 
} from '@buster/database/queries/github-integrations';

// Create new integration
const integration = await createGithubIntegration({
  installationId: '12345',
  githubOrgId: '67890',
  githubOrgName: 'acme-corp',
  organizationId: 'org_123',
  userId: 'user_456',
  status: 'pending'
});

// Update with token vault key
await updateGithubIntegration(integration.id, {
  tokenVaultKey: 'vault_key_789',
  status: 'active'
});

// Get active integration
const active = await getActiveGithubIntegration('org_123');
```

## Testing

Each query has its own integration test file. Tests use real database connections and clean up after themselves.

```bash
# Run all GitHub integration tests
turbo run test:integration --filter=@buster/database -- github-integrations

# Run specific test
pnpm test:integration create-github-integration.int.test.ts
```

## Important Notes

- **Never hard delete** - Always use soft delete with `deletedAt`
- **Unique constraint** - Only one active integration per organization
- **User ID required** - Track who initiated each installation
- **Token storage** - Tokens are stored in Supabase Vault, only the vault key is stored in DB