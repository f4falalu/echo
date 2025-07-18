# @buster/server-shared

> Shared TypeScript types and schemas for the Buster ecosystem

## Overview

The `@buster/server-shared` package provides a centralized location for all shared TypeScript types, Zod schemas, and type utilities used across the Buster monorepo. This package ensures type safety and consistency between frontend and backend services.

## Architecture Principles

### 1. Zod-First Approach
All types are defined using Zod schemas first, then TypeScript types are inferred from them:

```typescript
// ✅ Good: Define schema first
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// ❌ Bad: Defining types without schemas
export interface User {
  id: string;
  email: string;
  name: string;
}
```

### 2. Database Type Imports
When referencing database types from `@buster/database`, **ALWAYS** import them as types to avoid compilation errors:

```typescript
// ✅ Good: Import as type
import type { organizations, userOrganizationRoleEnum } from '@buster/database';

// ❌ Bad: Import as value
import { organizations } from '@buster/database';
```

### 3. Enum Pattern for Database Parity
When creating enums that mirror database enums, use frozen objects to maintain type safety:

```typescript
import type { userOrganizationRoleEnum } from '@buster/database';

type OrganizationRoleBase = (typeof userOrganizationRoleEnum.enumValues)[number];

// Create a frozen object that mirrors the database enum
export const OrganizationRoleEnum: Record<OrganizationRoleBase, OrganizationRoleBase> = 
  Object.freeze({
    viewer: 'viewer',
    workspace_admin: 'workspace_admin',
    data_admin: 'data_admin',
    querier: 'querier',
    restricted_querier: 'restricted_querier',
  });

// Create Zod schema from the enum
export const OrganizationRoleSchema = z.enum(
  Object.values(OrganizationRoleEnum) as [OrganizationRoleBase, ...OrganizationRoleBase[]]
);

export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
```

### 4. Type Parity Checks
When types are direct copies of database models, use the `Expect` and `Equal` utilities to ensure parity:

```typescript
import type { organizations } from '@buster/database';
import type { Equal, Expect } from '../type-utilities';

export type Organization = z.infer<typeof OrganizationSchema>;

// This will cause a TypeScript error if the types don't match
type _OrganizationEqualityCheck = Expect<Equal<Organization, typeof organizations.$inferSelect>>;
```

## Directory Structure

```
src/
├── index.ts                 # Main barrel export (currently incomplete)
├── chats/                   # Chat-related types
│   ├── index.ts            # Barrel exports for chats
│   ├── chat.types.ts       # Core chat types
│   ├── chat-message.types.ts
│   └── ...
├── organization/            # Organization types
│   ├── index.ts            # Barrel exports
│   ├── organization.types.ts
│   ├── requests.ts         # Request schemas/types
│   ├── responses.ts        # Response schemas/types
│   └── ...
├── metrics/                 # Metrics types
│   ├── index.ts
│   ├── requests.types.ts   # Note: Some use .types.ts suffix
│   ├── responses.types.ts
│   └── ...
├── type-utilities/          # Generic utility types
│   ├── index.ts
│   ├── pagination.ts       # Pagination utilities
│   ├── isEqual.ts          # Type equality checks
│   └── ...
└── ... (other modules)
```

## Module Structure Guidelines

Each module should follow this structure:

### 1. Barrel Export (index.ts)
Export all public types from the module:

```typescript
export * from './organization.types';
export * from './roles.types';
export * from './requests';
export * from './responses';
```

### 2. Request Types (requests.ts)
Define all request schemas for the module:

```typescript
import { z } from 'zod';

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
```

### 3. Response Types (responses.ts)
Define all response schemas for the module:

```typescript
import { z } from 'zod';
import { UserSchema } from './user.types';

export const GetUserResponseSchema = UserSchema;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;

export const ListUsersResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number(),
});
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;
```

## Usage Examples

### Importing Types
```typescript
// Import from specific modules
import { Organization, UpdateOrganizationRequest } from '@buster/server-shared/organization';
import { Chat, ChatMessage } from '@buster/server-shared/chats';
import { PaginationParams } from '@buster/server-shared/type-utilities';
```

### Using Schemas for Validation
```typescript
import { UpdateOrganizationRequestSchema } from '@buster/server-shared/organization';

// Validate incoming data
const validatedData = UpdateOrganizationRequestSchema.parse(requestBody);

// Or safe parse with error handling
const result = UpdateOrganizationRequestSchema.safeParse(requestBody);
if (!result.success) {
  console.error(result.error);
}
```

## Adding New Modules

1. Create a new directory under `src/`
2. Add the following files:
   - `index.ts` - Barrel exports
   - `requests.ts` - Request schemas/types
   - `responses.ts` - Response schemas/types
   - Additional type files as needed
3. Update `package.json` exports:
   ```json
   "./your-module": {
     "types": "./dist/your-module/index.d.ts",
     "default": "./dist/your-module/index.js"
   }
   ```

## Common Patterns

### Hex Color Validation
```typescript
const HexColorSchema = z
  .string()
  .regex(
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
    'Must be a valid 3 or 6 digit hex color code'
  );
```

### Pagination
Use the generic pagination types from `type-utilities`:
```typescript
import { PaginationParams } from '../type-utilities';

export const ListUsersRequestSchema = z.object({
  ...PaginationParams.shape,
  filter: z.string().optional(),
});
```

## Important Notes

1. **Never import database constants directly** - This will cause build failures in frontend packages
2. **Always define schemas before types** - Types should be inferred from schemas
3. **Maintain type parity** - Use `Expect<Equal<>>` pattern for database model copies
4. **Export through package.json** - Each module needs its own export entry
5. **Follow naming conventions** - Use either `requests.ts/responses.ts` or `requests.types.ts/responses.types.ts` consistently within a module

## Contributing

When adding new types or modifying existing ones:
1. Follow the Zod-first approach
2. Ensure proper barrel exports
3. Add request/response types where applicable
4. Update package.json exports if adding new modules
5. Run type checking before committing 