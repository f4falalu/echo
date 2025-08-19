# CLAUDE.md - GitHub Integrations Database Queries

## Context for Claude

This module handles all database operations for GitHub integrations. Follow these patterns consistently.

## Critical Conventions

### 1. File Organization
```
❌ DON'T: Put all functions in index.ts
✅ DO: Each function gets its own file

github-integrations/
├── create-github-integration.ts
├── create-github-integration.int.test.ts
├── get-active-github-integration.ts
├── get-active-github-integration.int.test.ts
└── index.ts  # Exports only
```

### 2. Import Pattern
```typescript
❌ DON'T: import { db } from '../../client';
✅ DO: import { db } from '../../connection';
```

### 3. Soft Delete Pattern
```typescript
❌ DON'T: DELETE FROM github_integrations WHERE id = ?
✅ DO: UPDATE github_integrations SET 
        status = 'revoked', 
        deleted_at = NOW() 
      WHERE id = ?
```

## Query Implementation Patterns

### Basic Query Structure
```typescript
import { db } from '../../connection';
import { githubIntegrations } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function queryName(param: string) {
  const result = await db
    .select()
    .from(githubIntegrations)
    .where(
      and(
        eq(githubIntegrations.field, param),
        isNull(githubIntegrations.deletedAt)
      )
    );
    
  return result[0] || null;
}
```

### Insert with Defaults
```typescript
export async function createGithubIntegration(params: {
  // Required fields only
  installationId: string;
  organizationId: string;
  userId: string;  // ALWAYS required
  githubOrgId: string;
  // Optional fields
  status?: 'pending' | 'active' | 'suspended' | 'revoked';
}) {
  const [integration] = await db
    .insert(githubIntegrations)
    .values({
      ...params,
      status: params.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();
    
  return integration;
}
```

### Update Pattern
```typescript
export async function updateGithubIntegration(
  id: string,
  updates: Partial<GithubIntegration>
) {
  const [updated] = await db
    .update(githubIntegrations)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(githubIntegrations.id, id))
    .returning();
    
  return updated;
}
```

## Testing Patterns

### Integration Test Structure
```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createGithubIntegration } from './create-github-integration';
import { db } from '../../connection';
import { githubIntegrations } from '../../schema';
import { eq } from 'drizzle-orm';

describe('createGithubIntegration', () => {
  const testIds: string[] = [];
  
  afterEach(async () => {
    // Clean up test data
    for (const id of testIds) {
      await db
        .delete(githubIntegrations)
        .where(eq(githubIntegrations.id, id));
    }
    testIds.length = 0;
  });
  
  it('should create integration with required fields', async () => {
    const params = {
      installationId: randomUUID(), // Use UUID for uniqueness
      githubOrgId: randomUUID(),
      organizationId: randomUUID(),
      userId: randomUUID(),
    };
    
    const result = await createGithubIntegration(params);
    testIds.push(result.id);
    
    expect(result.installationId).toBe(params.installationId);
    expect(result.status).toBe('pending'); // Default value
  });
});
```

## Status Management

### Status Transitions
```
pending → active     (token generated successfully)
active → suspended   (GitHub suspended the app)
suspended → active   (GitHub unsuspended)
any → revoked       (user uninstalled, soft delete)
```

### Status Queries
- `getActiveGithubIntegration` - Only returns `status = 'active'`
- `getGithubIntegrationByInstallationId` - Returns any status
- Use specific status filters based on use case

## Common Pitfalls

### 1. Missing User ID
```typescript
❌ await createGithubIntegration({
    installationId: '123',
    organizationId: 'org',
    githubOrgId: '456'
    // Missing userId!
  });

✅ await createGithubIntegration({
    installationId: '123',
    organizationId: 'org',
    githubOrgId: '456',
    userId: 'user_789'  // Always required
  });
```

### 2. Hard Delete
```typescript
❌ await db.delete(githubIntegrations).where(eq(id));

✅ await softDeleteGithubIntegration(id);
// Sets status='revoked' and deletedAt=now()
```

### 3. Not Checking Soft Deletes
```typescript
❌ .where(eq(githubIntegrations.organizationId, orgId))

✅ .where(
    and(
      eq(githubIntegrations.organizationId, orgId),
      isNull(githubIntegrations.deletedAt)
    )
  )
```

## Vault Key Management

Tokens are stored in Supabase Vault, only keys stored in DB:
- `tokenVaultKey` - Key to retrieve the installation token
- `webhookSecretVaultKey` - Key for webhook secret (if per-installation)

Never store raw tokens in the database!

## Running Tests

```bash
# Run all GitHub integration tests
turbo run test:integration --filter=@buster/database -- github-integrations

# Run specific test
pnpm test:integration create-github-integration.int.test.ts

# Debug test
pnpm test:integration create-github-integration.int.test.ts --reporter=verbose
```

## Adding New Queries

1. Create file: `new-query.ts`
2. Create test: `new-query.int.test.ts`
3. Export from `index.ts`
4. Follow existing patterns exactly
5. Test with real database
6. Clean up test data in afterEach