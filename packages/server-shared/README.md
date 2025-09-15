# Server Shared Package

The API contract layer for the Buster monorepo. All request and response types for server communication live here.

## Installation

```bash
pnpm add @buster/server-shared
```

## Overview

`@buster/server-shared` is the single source of truth for:
- API request schemas and types
- API response schemas and types  
- Shared validation logic
- Type flow from database to clients

## Architecture

Types flow through the system in this order:
```
@buster/database → @buster/server-shared → Apps (web, cli, etc.)
```

## Usage

### Defining API Types

All API types must be defined as Zod schemas first:

```typescript
import { z } from 'zod';

// Define request schema with descriptions
export const CreateUserRequestSchema = z.object({
  email: z.string().email().describe('User email address'),
  name: z.string().min(1).describe('User full name'),
  orgId: z.string().uuid().describe('Organization identifier'),
  role: z.enum(['admin', 'member', 'viewer']).describe('User role')
});

// Export inferred type
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
```

### Using in Server

```typescript
import { CreateUserRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';

app.post('/users', 
  zValidator('json', CreateUserRequestSchema),
  async (c) => {
    const data = c.req.valid('json');
    // data is fully typed as CreateUserRequest
  }
);
```

### Using in Client

```typescript
import type { CreateUserRequest, CreateUserResponse } from '@buster/server-shared';

async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await fetch('/api/v2/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
}
```

## File Organization

```
server-shared/
├── src/
│   ├── users/
│   │   ├── requests.ts      # User request schemas
│   │   ├── responses.ts     # User response schemas
│   │   └── index.ts         # Barrel export
│   ├── chats/
│   ├── dashboards/
│   └── index.ts             # Main export
```

## Type Patterns

### Request Types

```typescript
export const CreateDashboardRequestSchema = z.object({
  name: z.string().describe('Dashboard name'),
  dataSourceId: z.string().uuid().describe('Data source ID'),
  isPublic: z.boolean().default(false).describe('Public visibility')
});

export type CreateDashboardRequest = z.infer<typeof CreateDashboardRequestSchema>;
```

### Response Types

```typescript
import type { Dashboard } from '@buster/database';

export const CreateDashboardResponseSchema = z.object({
  dashboard: z.custom<Dashboard>().describe('Created dashboard'),
  permissions: z.array(z.string()).describe('User permissions')
});

export type CreateDashboardResponse = z.infer<typeof CreateDashboardResponseSchema>;
```

### Paginated Responses

```typescript
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean()
  });
```

### Error Responses

```typescript
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  })
});
```

## Best Practices

### DO:
- Define ALL API types as Zod schemas with descriptions
- Export both schema and inferred type
- Import database types as type-only
- Use const assertions for string literals
- Organize by feature/domain
- Validate at API boundaries

### DON'T:
- Import database package as values
- Define types without Zod schemas
- Use `.parse()` unnecessarily when types are sufficient
- Create circular dependencies
- Mix request/response types in same file

## Database Type Imports

Always import database types as type-only:

```typescript
// ✅ Correct
import type { User, Organization } from '@buster/database';

// ❌ Wrong - causes build failures
import { User, Organization } from '@buster/database';
```

## Testing

```typescript
import { CreateUserRequestSchema } from '@buster/server-shared';

describe('CreateUserRequestSchema', () => {
  it('validates valid data', () => {
    const data = {
      email: 'test@example.com',
      name: 'Test User',
      orgId: '123e4567-e89b-12d3-a456-426614174000',
      role: 'member'
    };
    
    const result = CreateUserRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
  
  it('rejects invalid email', () => {
    const data = {
      email: 'not-an-email',
      name: 'Test User',
      orgId: '123e4567-e89b-12d3-a456-426614174000',
      role: 'member'
    };
    
    const result = CreateUserRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

## Development

```bash
# Build
turbo build --filter=@buster/server-shared

# Test
turbo test:unit --filter=@buster/server-shared

# Lint
turbo lint --filter=@buster/server-shared
```