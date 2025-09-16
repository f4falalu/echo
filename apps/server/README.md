# Server Application

This is the main TypeScript/Node.js API server using Hono framework. It assembles packages to create the REST API.

## Installation

```bash
pnpm add @buster-app/server
```

## Overview

`@buster-app/server` is responsible for:
- HTTP API endpoints
- Request/response handling
- Authentication middleware
- Routing and middleware
- Assembling package functionality

## Technology Stack

- **Runtime**: Bun (optimized for performance)
- **Framework**: Hono (lightweight, fast)
- **Validation**: Zod with @hono/zod-validator
- **Architecture**: File-path based routing

## Architecture

```
Packages → @buster-app/server → HTTP API
               ↓
         File-based routes
        (Matches URL paths)
```

## File-Path Based Routing

**CRITICAL**: Routes are organized using file-path based structure that matches the actual API path.

### Routing Structure

```
server/
├── src/
│   ├── api/
│   │   ├── v2/
│   │   │   ├── users/
│   │   │   │   ├── index.ts              # /v2/users
│   │   │   │   ├── GET.ts                # GET /v2/users
│   │   │   │   ├── POST.ts               # POST /v2/users
│   │   │   │   └── [id]/
│   │   │   │       ├── index.ts          # /v2/users/:id
│   │   │   │       ├── GET.ts            # GET /v2/users/:id
│   │   │   │       ├── PUT.ts            # PUT /v2/users/:id
│   │   │   │       ├── DELETE.ts         # DELETE /v2/users/:id
│   │   │   │       └── suggested-questions/
│   │   │   │           ├── index.ts      # /v2/users/:id/suggested-questions
│   │   │   │           └── GET.ts        # GET /v2/users/:id/suggested-questions
│   │   │   ├── organizations/
│   │   │   │   ├── index.ts
│   │   │   │   ├── GET.ts
│   │   │   │   ├── POST.ts
│   │   │   │   └── [orgId]/
│   │   │   │       ├── members/
│   │   │   │       │   ├── GET.ts
│   │   │   │       │   └── POST.ts
│   │   │   │       └── settings/
│   │   │   │           └── GET.ts
│   │   │   └── index.ts                  # Main v2 router
│   │   └── index.ts                       # Main API router
│   └── index.ts                           # App entry point
```

### Route File Pattern

Each HTTP method gets its own file:

```typescript
// src/api/v2/users/[id]/GET.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { GetUserResponse } from '@buster/server-shared';
import { getUserHandler } from './handlers/get-user';

const ParamsSchema = z.object({
  id: z.string().uuid()
});

export const GET = new Hono()
  .get(
    '/',
    zValidator('param', ParamsSchema),
    async (c) => {
      const user = c.get('busterUser');
      const params = c.req.valid('param');
      
      const response = await getUserHandler({
        userId: params.id,
        requestingUser: user
      });
      
      return c.json<GetUserResponse>(response);
    }
  );
```

### Index Router Pattern

Each directory has an index.ts that combines routes:

```typescript
// src/api/v2/users/[id]/index.ts
import { Hono } from 'hono';
import { GET } from './GET';
import { PUT } from './PUT';
import { DELETE } from './DELETE';
import { suggestedQuestions } from './suggested-questions';

export const userById = new Hono()
  .route('/', GET)
  .route('/', PUT)
  .route('/', DELETE)
  .route('/suggested-questions', suggestedQuestions);
```

### Parent Router Pattern

```typescript
// src/api/v2/users/index.ts
import { Hono } from 'hono';
import { GET } from './GET';
import { POST } from './POST';
import { userById } from './[id]';

export const users = new Hono()
  .route('/', GET)
  .route('/', POST)
  .route('/:id', userById);
```

## Handler Pattern

Handlers are pure functions in separate files:

```typescript
// src/api/v2/users/[id]/handlers/get-user.ts
import { z } from 'zod';
import type { User } from '@buster/database';
import { getUser } from '@buster/database';
import { checkPermission } from '@buster/access-controls';

const GetUserHandlerParamsSchema = z.object({
  userId: z.string().uuid(),
  requestingUser: z.custom<User>()
});

type GetUserHandlerParams = z.infer<typeof GetUserHandlerParamsSchema>;

export async function getUserHandler(params: GetUserHandlerParams) {
  const validated = GetUserHandlerParamsSchema.parse(params);
  
  // Check permissions
  const canAccess = await checkPermission({
    user: validated.requestingUser,
    action: 'read',
    resource: {
      type: 'user',
      id: validated.userId
    }
  });
  
  if (!canAccess) {
    throw new ForbiddenError();
  }
  
  // Get user from database
  const user = await getUser({ userId: validated.userId });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  return {
    user,
    permissions: await getUserPermissions(user.id)
  };
}
```

## Middleware

### Authentication Middleware

```typescript
// src/middleware/auth.ts
import type { Context, Next } from 'hono';
import { validateSession } from '@buster/access-controls';

export async function requireAuth(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const user = await validateSession(token);
  if (!user) {
    return c.json({ error: 'Invalid session' }, 401);
  }
  
  c.set('busterUser', user);
  await next();
}
```

### Error Handling Middleware

```typescript
// src/middleware/error-handler.ts
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ 
        error: 'Validation failed',
        details: error.errors 
      }, 400);
    }
    
    if (error instanceof ForbiddenError) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, 404);
    }
    
    // Log internal errors
    console.error('Unhandled error:', error);
    
    // Don't expose internal errors
    return c.json({ error: 'Internal server error' }, 500);
  }
}
```

## Type Safety

### Request/Response Types

All types come from server-shared:

```typescript
import type { 
  CreateUserRequest,
  CreateUserResponse,
  GetUsersRequest,
  GetUsersResponse 
} from '@buster/server-shared';

// Never define types locally
// ❌ Wrong
interface LocalUserType {
  id: string;
  email: string;
}

// ✅ Correct - import from server-shared
import type { User } from '@buster/server-shared';
```

### Validation Pattern

```typescript
import { zValidator } from '@hono/zod-validator';
import { CreateUserRequestSchema } from '@buster/server-shared';

// Validate request body
.post(
  '/',
  zValidator('json', CreateUserRequestSchema),
  async (c) => {
    const data = c.req.valid('json');
    // data is fully typed
  }
)

// Validate query params
.get(
  '/',
  zValidator('query', GetUsersQuerySchema),
  async (c) => {
    const query = c.req.valid('query');
    // query is fully typed
  }
)
```

## App Structure

### Main App Setup

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { api } from './api';
import { errorHandler } from './middleware/error-handler';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', errorHandler);

// Mount API routes
app.route('/api', api);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
```

### Environment Configuration

```typescript
// src/config/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.string().default('8080'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test'])
});

export const env = EnvSchema.parse(process.env);
```

## Testing Patterns

### Route Testing

```typescript
describe('GET /v2/users/:id', () => {
  it('should return user when authorized', async () => {
    const app = createTestApp();
    
    const response = await app.request('/api/v2/users/123', {
      headers: {
        Authorization: 'Bearer valid-token'
      }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
  });
  
  it('should return 401 when not authenticated', async () => {
    const app = createTestApp();
    
    const response = await app.request('/api/v2/users/123');
    
    expect(response.status).toBe(401);
  });
});
```

### Handler Testing

```typescript
describe('getUserHandler', () => {
  it('should return user data', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    jest.spyOn(database, 'getUser').mockResolvedValue(mockUser);
    
    const result = await getUserHandler({
      userId: '123',
      requestingUser: mockUser
    });
    
    expect(result.user).toEqual(mockUser);
  });
});
```

## Best Practices

### DO:
- Use file-path based routing
- Separate handlers from routes
- Import types from server-shared
- Validate all inputs with Zod
- Use functional handlers
- Apply auth middleware globally
- Handle errors gracefully
- Test routes and handlers separately

### DON'T:
- Define types locally
- Mix business logic with routes
- Use classes for handlers
- Skip validation
- Expose internal errors
- Access database directly
- Hardcode configuration

## WebSocket Support

### WebSocket Handler

```typescript
// src/api/ws/chat.ts
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';

const { upgradeWebSocket, websocket } = createBunWebSocket<{ user: User }>();

export const chatWebSocket = new Hono()
  .get(
    '/chat',
    upgradeWebSocket((c) => {
      return {
        onOpen(evt, ws) {
          console.info('WebSocket opened');
        },
        onMessage(evt, ws) {
          const message = JSON.parse(evt.data);
          // Handle message
          ws.send(JSON.stringify({ type: 'ack' }));
        },
        onClose(evt, ws) {
          console.info('WebSocket closed');
        }
      };
    })
  );
```

## Performance Optimization

### Response Caching

```typescript
import { cache } from 'hono/cache';

// Cache GET requests
.get(
  '/',
  cache({
    cacheName: 'users',
    cacheControl: 'max-age=3600'
  }),
  getUsersHandler
)
```

### Rate Limiting

```typescript
import { rateLimiter } from './middleware/rate-limiter';

// Apply rate limiting
.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}))
```

## Development

```bash
# Development
turbo dev --filter=@buster-app/server

# Build
turbo build --filter=@buster-app/server

# Test
turbo test:unit --filter=@buster-app/server
turbo test:integration --filter=@buster-app/server

# Lint
turbo lint --filter=@buster-app/server
```

## Deployment

The server runs on Bun runtime for optimal performance:

```bash
# Production
turbo build --filter=@buster-app/server
bun run dist/index.js
```

This app should ONLY assemble packages and handle HTTP concerns. All business logic belongs in packages.