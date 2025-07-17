## Overview

This server is part of the Buster monorepo and provides a robust API layer with middleware support and utility functions. It contains all the API routes that can be consumed by the Buster application, serving as the central backend service for data processing, user management, and business logic. The server is designed to be runtime-agnostic but will use Bun in the meantime.

## Installation

To install dependencies:
```sh
bun install
```

## Development

To run the development server:
```sh
bun run dev
```

The server will be available at http://localhost:3002 (unless specified otherwise in the .env file under PORT)

## Folder Structure

```
src/
├── api/          # API route handlers and endpoints
│   ├── v2/       # Version 2 API routes (current)
│   │   ├── datasets/ # Dataset related routes
│   │   ├── user/ # User management routes  
│   │   └── ...   # Feature-specific route groups
├── middleware/   # Custom middleware functions
│   ├── cors.ts   # CORS configuration
│   ├── logger.ts # Request logging
│   └── ...       # Other middleware
├── utils/        # Utility functions and helpers
│   └── ...            # Other utilities
└── app.ts        # Main Hono application setup
```

### Directory Guidelines

- **`src/api/`**: Contains all route handlers organized by API version, then by feature or resource. Each version directory (e.g., `v2/`, `v3/`) contains feature-specific subdirectories that export Hono app instances for mounting to the main app.

- **API Versioning**: Routes are organized by version to ensure backward compatibility and smooth API evolution. **Note**: `v1/` was deprecated and removed as part of a migration. Current structure includes:
  - `src/api/v2/user/` - Version 2 user management endpoints (current)
  - `src/api/v2/datasets/` - Version 2 datasets endpoints (current)

- **`src/middleware/`**: Custom middleware functions that can be applied globally or to specific routes. Follow Hono's middleware patterns for consistency.

- **`src/utils/`**: Shared utility functions, validators, response helpers, and other common functionality used across the application.

## Business Logic Architecture

The server follows a clean architecture pattern where **API routes consume business logic through packages** located in `@/packages`. This separation ensures that:

- Business logic is reusable across different parts of the application
- API routes remain thin and focused on HTTP concerns
- Core functionality is testable independently of the web layer

### Package Consumption Pattern

For most features, API routes will consume corresponding packages for their business logic:

```typescript
// Example: V2 User API routes consume the users package
import { getUserById, createUser, updateUser } from '@/packages/users';

// API route handlers focus on HTTP concerns
app.get('/v2/user/:id', async (c) => {
  const userId = c.req.param('id');
  
  // Business logic is handled by packages
  const user = await getUserById(userId);
  
  return c.json(user);
});
```

### Package Structure

Each package in `@/packages` typically contains:
- **Queries**: Database operations and data access logic
- **Business Logic**: Core functionality, validation, and business rules  
- **Types**: TypeScript definitions specific to that domain

### Examples

- `@/packages/users` - User management, profile operations
- `@/packages/datasets` - Dataset management
- `@/packages/database` - Raw Database connection, migrations, shared utilities (rarely used)

This architecture keeps the server layer focused on HTTP routing, middleware, and request/response handling while delegating domain logic to specialized packages.

## API Route Patterns

We follow a specific modular pattern for organizing API routes that promotes maintainability, type safety, and clear separation of concerns.

### Modular Route Structure

Each HTTP method is defined in its own dedicated file and exported through a barrel pattern:

```
src/api/v2/organization/
├── GET.ts     # Handles GET /organization
├── PUT.ts     # Handles PUT /organization  
├── POST.ts    # Handles POST /organization (if needed)
├── DELETE.ts  # Handles DELETE /organization (if needed)
└── index.ts   # Barrel export that combines all methods
```

### Nested Route Structure

The modular pattern extends seamlessly to nested routes. You can create deeper path structures by nesting directories:

```
src/api/v2/organization/
├── GET.ts           # Handles GET /organization
├── PUT.ts           # Handles PUT /organization
├── index.ts         # Barrel export for /organization
└── members/         # Nested route for /organization/members
    ├── GET.ts       # Handles GET /organization/members
    ├── POST.ts      # Handles POST /organization/members
    ├── index.ts     # Barrel export for /organization/members
    └── [id]/        # Dynamic nested route for /organization/members/:id
        ├── GET.ts   # Handles GET /organization/members/:id
        ├── PUT.ts   # Handles PUT /organization/members/:id
        ├── DELETE.ts # Handles DELETE /organization/members/:id
        └── index.ts # Barrel export for /organization/members/:id
```

To mount nested routes, the parent's `index.ts` would route to the child:

```typescript
// organization/index.ts
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import GET from './GET';
import PUT from './PUT';
import members from './members'; // Import nested route

const app = new Hono()
  .use('*', requireAuth)
  .route('/', GET)
  .route('/', PUT)
  .route('/members', members); // Mount nested route

export default app;
```

**Example Implementation:**

```typescript
// GET.ts - Individual route handler
import { getOrganization } from '@buster/database';
import type { GetOrganizationResponse } from '@buster/server-shared/organization';
import { Hono } from 'hono';
import { requireOrganization } from '../../../middleware/auth';

const app = new Hono()
  .use('*', requireOrganization)
  .get('/', async (c) => {
    const userOrg = c.get('userOrganizationInfo');
    
    const organization: GetOrganizationResponse = await getOrganization({
      organizationId: userOrg.organizationId,
    });

    return c.json(organization);
  });

export default app;
```

```typescript
// index.ts - Barrel export combining all methods
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import GET from './GET';
import PUT from './PUT';

const app = new Hono()
  .use('*', requireAuth) // Global middleware for all methods
  .route('/', GET)       // Mount individual route handlers
  .route('/', PUT);

export default app;
```

### Middleware Architecture

We use a layered middleware approach for authentication and authorization:

1. **Global Authentication**: Applied at the barrel export level (`requireAuth`)
2. **Method-Specific Authorization**: Applied in individual route files (`requireOrganization`, `requireOrganizationAdmin`)

```typescript
// index.ts - Global auth for all methods
const app = new Hono()
  .use('*', requireAuth) // ALL routes require authentication
  .route('/', GET)
  .route('/', PUT);

// PUT.ts - Additional admin requirement for updates
const app = new Hono()
  .use('*', requireOrganizationAdmin) // PUT requires admin privileges
  .put('/', zValidator('json', UpdateOrganizationRequestSchema), async (c) => {
    // Handler logic
  });
```

### Type Safety and Validation

All endpoints must define strict request and response types using our established patterns:

#### 1. Schema Definition in `@buster/server-shared`

```typescript
// @buster/server-shared/organization/types.ts
import { z } from 'zod';

export const UpdateOrganizationRequestSchema = z.object({
  colorPalette: z.array(z.string()).optional(),
  // ... other fields
});

export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;
export type UpdateOrganizationResponse = {
  id: string;
  name: string;
  // ... organization fields
};
```

#### 2. Import Types with `type` Keyword

**Critical**: Always use the `type` keyword when importing types to minimize build size:

```typescript
import type { 
  UpdateOrganizationRequest,
  UpdateOrganizationResponse 
} from '@buster/server-shared/organization';
import { UpdateOrganizationRequestSchema } from '@buster/server-shared/organization';
```

#### 3. Use Hono's `zValidator` for Request Validation

```typescript
import { zValidator } from '@hono/zod-validator';

const app = new Hono()
  .put('/', zValidator('json', UpdateOrganizationRequestSchema), async (c) => {
    const request = c.req.valid('json'); // Fully typed request
    // Handler logic
  });
```

### Database Interaction Pattern

**Important**: All database interactions must go through the `@buster/database` package. Never interact with the database directly in route handlers.

```typescript
// ✅ Correct - Use database package functions
import { getOrganization, updateOrganization } from '@buster/database';

const organization = await getOrganization({ organizationId });
await updateOrganization({ organizationId, ...request });

// ❌ Incorrect - Direct database queries
// const result = await db.query('SELECT * FROM organizations...');
```

### Error Handling Strategy

We pass detailed errors straight through to the client to make debugging easier for developers. Use the shared error handling utilities from `@/utils/response`:

```typescript
import { standardErrorHandler } from '../../utils/response';

// Basic usage - handles all error types automatically
.onError(standardErrorHandler);

// With custom message for specific errors
.onError((e, c) => standardErrorHandler(e, c, 'Failed to update organization settings'));
```

**Available Error Utilities:**
- `standardErrorHandler(error, context, customMessage?)` - Complete error handler that returns Hono response for all error types
- `handleZodError(zodError)` - Specifically formats Zod validation errors with detailed issues
- `errorResponse(message, status)` - Creates HTTPException for throwing errors
- `notFoundResponse(resource)` - Standard 404 error
- `unauthorizedResponse(message)` - Standard 401 error

### Complete Route Handler Template

```typescript
import { /* database functions */ } from '@buster/database';
import type { User } from '@buster/database';
import type { 
  RequestType, 
  ResponseType 
} from '@buster/server-shared/feature';
import { RequestSchema } from '@buster/server-shared/feature';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { /* middleware */ } from '../../../middleware/auth';
import { standardErrorHandler, errorResponse } from '../../utils/response';

/**
 * Handler function with proper error handling
 */
async function handlerFunction(
  resourceId: string,
  request: RequestType,
  user: User
): Promise<ResponseType> {
  try {
    // Database operations through @buster/database
    const result = await databaseFunction({ resourceId, ...request });
    return result;
  } catch (error) {
    console.error('Error in handler:', {
      resourceId,
      userId: user.id,
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw Zod errors for route error handler
    if (error instanceof z.ZodError) {
      throw error;
    }

    // Use shared error response utility
    throw errorResponse('Operation failed', 500);
  }
}

const app = new Hono()
  .use('*', /* appropriate middleware */)
  .put('/', zValidator('json', RequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const userOrg = c.get('userOrganizationInfo');
    
    const response = await handlerFunction(
      userOrg.organizationId, 
      request, 
      user
    );
    
    return c.json(response);
  })
  .onError(standardErrorHandler);

// Or with custom error message for this specific route
// .onError((e, c) => standardErrorHandler(e, c, 'Failed to update organization'));

export default app;
```

## Best Practices

- Use TypeScript for type safety
- Organize routes by feature in the `api/` directory
- Keep middleware focused and reusable
- Use proper error handling with Hono's error utilities
- Leverage Hono's built-in validation and serialization
- Follow RESTful conventions for API endpoints
- **Always use the modular route pattern** with separate files per HTTP method
- **Import types with `type` keyword** to minimize build size
- **Use `zValidator` for all request validation**
- **Route all database interactions through `@buster/database`**
- **Use shared error utilities from `@/utils/response`** for consistent error handling
- **Pass detailed errors to clients** for easier debugging
