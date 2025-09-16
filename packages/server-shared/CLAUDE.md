# Server Shared Package

This package is the API contract layer for the Buster monorepo. ALL request and response types for server communication live here.

## Core Responsibility

`@buster/server-shared` serves as the single source of truth for:
- API request schemas and types
- API response schemas and types
- Shared validation logic
- Type flow from database to clients

## Type Flow Architecture

```
@buster/database → @buster/server-shared → Apps (web, cli, etc.)
```

Types cascade through server-shared to ensure consistency:
1. Database types are imported into server-shared
2. Server-shared exports API contracts based on database types
3. Apps import from server-shared, never directly from database

## Implementation Patterns

### Zod Schema Definition

Every type MUST be defined as a Zod schema first with descriptions:

```typescript
import { z } from 'zod';

// Define schema with descriptions
export const CreateUserRequestSchema = z.object({
  email: z.string().email().describe('User email address'),
  name: z.string().min(1).describe('User full name'),
  orgId: z.string().uuid().describe('Organization identifier'),
  role: z.enum(['admin', 'member', 'viewer']).describe('User role in organization')
});

// Export inferred type
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
```

### Importing Database Types

Always import database types as type-only imports:

```typescript
// ✅ Correct: Type-only import
import type { User, Organization } from '@buster/database';

// ❌ Wrong: Value import (causes build failures)
import { User, Organization } from '@buster/database';
```

### Response Type Patterns

Responses should cascade database types through Zod schemas:

```typescript
import { z } from 'zod';
import type { User } from '@buster/database';

// Define response schema
export const GetUserResponseSchema = z.object({
  user: z.custom<User>().describe('User object from database'),
  permissions: z.array(z.string()).describe('User permissions'),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    plan: z.enum(['free', 'pro', 'enterprise'])
  }).describe('User workspace details')
});

export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
```

### Enum Patterns

Use const assertions for type-safe string literals:

```typescript
export const UserRole = {
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Use in schemas
export const UserSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer'])
});
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
│   │   ├── requests.ts
│   │   ├── responses.ts
│   │   └── index.ts
│   ├── security/
│   │   ├── requests.ts
│   │   ├── responses.ts
│   │   └── index.ts
│   └── index.ts             # Main barrel export
```

## Validation Patterns

### Request Validation

Use `.parse()` for trusted data, `.safeParse()` for user input:

```typescript
// In server endpoint
export async function createUser(data: unknown) {
  // Safe parse for user input
  const result = CreateUserRequestSchema.safeParse(data);
  
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  
  // Use validated data
  const user = await createUserInDb(result.data);
  return user;
}
```

### Type-Only Validation

When TypeScript types are sufficient, avoid runtime parsing:

```typescript
// If data is already typed from a trusted source
export async function processUser(user: User) {
  // No need for runtime validation
  // TypeScript ensures type safety
  return transformUser(user);
}
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

## Common Patterns

### Paginated Responses

```typescript
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().describe('Total number of items'),
    page: z.number().describe('Current page number'),
    pageSize: z.number().describe('Items per page'),
    hasMore: z.boolean().describe('Whether more pages exist')
  });

// Usage
export const GetUsersResponseSchema = PaginatedResponseSchema(UserSchema);
```

### Error Responses

```typescript
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().describe('Error code'),
    message: z.string().describe('Human-readable error message'),
    details: z.record(z.unknown()).optional().describe('Additional error context')
  })
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```

### Success Responses

```typescript
export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema
  });

// Usage
export const CreateUserResponseSchema = SuccessResponseSchema(UserSchema);
```

## Testing

Test schemas with various inputs to ensure validation works correctly:

```typescript
describe('CreateUserRequestSchema', () => {
  it('should validate valid user data', () => {
    const data = {
      email: 'test@example.com',
      name: 'Test User',
      orgId: '123e4567-e89b-12d3-a456-426614174000',
      role: 'member'
    };
    
    const result = CreateUserRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid email', () => {
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

## Integration with Apps

Apps should only import from server-shared:

```typescript
// In apps/web
import type { CreateUserRequest, GetUserResponse } from '@buster/server-shared';

// In apps/cli
import { CreateUserRequestSchema } from '@buster/server-shared';

// Never do this in apps:
import type { User } from '@buster/database'; // ❌ Wrong
```

This ensures all apps use consistent types and validation.