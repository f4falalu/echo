# Hono Server Development Guidelines

This document provides specific guidelines for developing the Hono-based backend server in this monorepo.

## API Development Standards

### Directory Structure
```
apps/server/src/api/
├── v2/                    # Current API version
│   ├── chats/            # Feature folder
│   │   ├── index.ts      # Route definitions
│   │   ├── handler.ts    # Main handler (if single)
│   │   ├── create-chat.ts # Individual handlers
│   │   └── services/     # Business logic
│   └── security/         # Another feature
│       ├── index.ts
│       ├── get-workspace-settings.ts
│       └── update-workspace-settings.ts
└── healthcheck.ts        # Non-versioned endpoints
```

### Route Definition Pattern

Always follow this pattern in `index.ts`:

```typescript
import { RequestSchema } from '@buster/server-shared/feature';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import { HTTPException } from 'hono/http-exception';
import { handlerFunction } from './handler-file';

const app = new Hono()
  // Apply authentication middleware
  .use('*', requireAuth)
  
  // GET endpoint (no body validation)
  .get('/endpoint', async (c) => {
    const user = c.get('busterUser');
    const response = await handlerFunction(user);
    return c.json(response);
  })
  
  // POST/PATCH/PUT endpoint (with body validation)
  .post('/endpoint', zValidator('json', RequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const response = await handlerFunction(request, user);
    return c.json(response);
  })
  
  // Error handling
  .onError((e, c) => {
    if (e instanceof HTTPException) {
      return e.getResponse();
    }
    
    throw new HTTPException(500, {
      message: 'Internal server error',
    });
  });

export default app;
```

### Handler Function Pattern

Each handler must:
1. Be in its own file
2. Be a pure async function
3. Accept typed parameters
4. Return typed responses
5. Handle business logic or delegate to services

```typescript
import type { 
  FeatureRequest, 
  FeatureResponse 
} from '@buster/server-shared/feature';
import type { User } from '@buster/database';

export async function featureHandler(
  request: FeatureRequest,
  user: User
): Promise<FeatureResponse> {
  // TODO: Implement business logic
  
  // For complex logic, delegate to service functions
  // const result = await featureService.process(request, user);
  
  return {
    // Response data matching FeatureResponse type
  };
}
```

### Type Safety Requirements

1. **Request/Response Types**: Define all types in `@buster/server-shared`
   ```typescript
   // In @buster/server-shared/feature/requests.ts
   export const FeatureRequestSchema = z.object({
     field: z.string(),
   });
   
   export type FeatureRequest = z.infer<typeof FeatureRequestSchema>;
   ```

2. **Validation**: Always use `zValidator` for request body validation
   ```typescript
   .post('/endpoint', zValidator('json', RequestSchema), async (c) => {
     const request = c.req.valid('json'); // Fully typed
   })
   ```

3. **User Type**: Always use `User` from `@buster/database`
   ```typescript
   import type { User } from '@buster/database';
   ```

### Authentication Pattern

1. Apply `requireAuth` middleware to all protected routes
2. Extract user with `c.get('busterUser')`
3. Pass user to handler functions

```typescript
const app = new Hono()
  .use('*', requireAuth) // Protects all routes in this app
  .get('/protected', async (c) => {
    const user = c.get('busterUser'); // Type: User from @buster/database
    // Use user in handler
  });
```

### Error Handling

1. **Custom Errors**: Create domain-specific error classes
   ```typescript
   export class FeatureError extends Error {
     constructor(
       public code: string,
       message: string,
       public statusCode: number
     ) {
       super(message);
     }
   }
   ```

2. **Error Responses**: Handle in route error handler
   ```typescript
   .onError((e, c) => {
     if (e instanceof FeatureError) {
       return c.json({ error: e.message, code: e.code }, e.statusCode);
     }
     // Default error handling
   })
   ```

### Testing Guidelines

1. **Unit Tests**: Test handlers in isolation
   ```typescript
   // handler.test.ts
   describe('featureHandler', () => {
     it('should process valid request', async () => {
       const mockUser = { id: '123' } as User;
       const request = { field: 'value' };
       
       const result = await featureHandler(request, mockUser);
       
       expect(result).toMatchObject({
         // Expected response
       });
     });
   });
   ```

2. **Integration Tests**: Test full API routes
   ```typescript
   // index.test.ts
   import { testClient } from 'hono/testing';
   ```

### Best Practices

1. **Separation of Concerns**
   - Routes: Handle HTTP concerns only
   - Handlers: Coordinate business logic
   - Services: Implement business logic
   - Repositories: Handle data access

2. **Consistent Naming**
   - Handler files: `verb-resource.ts` (e.g., `get-user.ts`, `update-settings.ts`)
   - Handler functions: `verbResourceHandler` (e.g., `getUserHandler`)
   - Service files: `resource-service.ts`

3. **Response Validation**
   - Consider validating responses in development
   - Use `.safeParse()` for critical endpoints

4. **Logging**
   - Log errors with context
   - Use appropriate log levels
   - Include user context where relevant

5. **Performance**
   - Keep handlers lightweight
   - Delegate heavy computation to background jobs
   - Monitor response times

## Common Patterns

### Pagination
```typescript
// In request schema
export const ListRequestSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// In handler
const offset = (request.page - 1) * request.limit;
```

### Query Parameters
```typescript
// Define query schema in server-shared
export const ListItemsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'name', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>;

// Route definition with query validation
.get('/items', zValidator('query', ListItemsQuerySchema), async (c) => {
  const query = c.req.valid('query'); // Fully typed as ListItemsQuery
  const user = c.get('busterUser');
  
  const response = await listItemsHandler(query, user);
  return c.json(response);
})

// Handler receives typed query
export async function listItemsHandler(
  query: ListItemsQuery,
  user: User
): Promise<ListItemsResponse> {
  const offset = (query.page - 1) * query.limit;
  // Use query.search, query.status, etc. with full type safety
}
```

### Path Parameters
```typescript
// Define param schema
export const ItemParamsSchema = z.object({
  item_id: z.string().uuid(),
});

export type ItemParams = z.infer<typeof ItemParamsSchema>;

// Route with path param validation
.get('/items/:item_id', zValidator('param', ItemParamsSchema), async (c) => {
  const params = c.req.valid('param'); // Typed as ItemParams
  const user = c.get('busterUser');
  
  const response = await getItemHandler(params.item_id, user);
  return c.json(response);
})

// Handler receives typed param
export async function getItemHandler(
  itemId: string,
  user: User
): Promise<ItemResponse> {
  // itemId is guaranteed to be a valid UUID
}
```

### Combined Parameters (Path + Query + Body)
```typescript
// Define schemas
export const UpdateItemParamsSchema = z.object({
  item_id: z.string().uuid(),
});

export const UpdateItemQuerySchema = z.object({
  validate: z.coerce.boolean().default(true),
});

export const UpdateItemBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// Route with multiple validations
.patch(
  '/items/:item_id',
  zValidator('param', UpdateItemParamsSchema),
  zValidator('query', UpdateItemQuerySchema),
  zValidator('json', UpdateItemBodySchema),
  async (c) => {
    const params = c.req.valid('param');
    const query = c.req.valid('query');
    const body = c.req.valid('json');
    const user = c.get('busterUser');
    
    const response = await updateItemHandler(
      params.item_id,
      body,
      { validate: query.validate },
      user
    );
    return c.json(response);
  }
)

// Handler with all parameters typed
export async function updateItemHandler(
  itemId: string,
  data: UpdateItemBody,
  options: { validate: boolean },
  user: User
): Promise<ItemResponse> {
  if (options.validate) {
    // Perform validation
  }
  // Update logic
}
```

### Important Notes on Type Coercion
- Use `z.coerce.number()` for numeric query params (they come as strings)
- Use `z.coerce.boolean()` for boolean query params
- Path params are always strings, validate format with `.uuid()`, `.regex()`, etc.
- Query arrays need special handling: `ids: z.array(z.string()).or(z.string()).transform(v => Array.isArray(v) ? v : [v])`

### Background Jobs
```typescript
// Queue job without waiting
import { tasks } from '@trigger.dev/sdk/v3';

await tasks.trigger('job-name', { data });
// Return immediately, don't await job completion
```