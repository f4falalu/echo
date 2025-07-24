# CLAUDE.md - Web App

This file provides guidance for working with the Next.js web application.

## TypeScript & React Standards

### TypeScript Configuration

- Use TypeScript for all new code
- **Strict mode enabled** - All strict checks are on
- **No implicit any** - Always use specific types
- **Type imports** - ALWAYS use `import type` when importing only types to minimize build size
- Prefer template literals over string concatenation

### React Patterns

- Prefer functional components and hooks over class components
- Use React.memo() for performance optimization when appropriate
- Prefer async/await over .then() for asynchronous operations
- Use proper TypeScript types for all variables and functions

## Component Guidelines

### UI Components

- Use components from `@/components/ui` folder whenever possible
- For custom elements, use Tailwind CSS to define component structure
- Import `<Text>` component from `@/components/typography` for text
- Import `<Title>` component from `@/components/typography` for titles

### Routing

- When using useRouter, import from `next/navigation` (not `next/router`)

## Directory Structure

### API Directory (`src/api/`)

```
src/api/
├── asset_interfaces/      # TypeScript interfaces for assets and API responses
├── buster_rest/          # REST API client implementation
├── buster_socket/        # WebSocket client implementation
├── buster_socket_query/  # WebSocket + React Query integration
├── next/                 # Next.js utilities and Axios instances
├── other/                # External API utilities (rarely used)
├── query_keys/           # TanStack Query keys by namespace
├── request_interfaces/   # TypeScript interfaces for request payloads
├── createInstance.ts     # Main API instance creation
└── createServerInstance.ts # Server-side API instance
```

### API Integration Patterns

- **Type Safety**: Import response types from `asset_interfaces/` and request types from `request_interfaces/`
- **Query Keys**: Use consistent query keys from `query_keys/` for TanStack Query
- **WebSocket**: Real-time features use `buster_socket/` with proper namespacing
- **State Management**: WebSocket + React Query integration via `buster_socket_query/`

## Testing

### Test Organization

- Place test files in the same folder as the file being tested
- Name test files with `.test.ts` or `.test.tsx` extension
- Example: `text.ts` → `text.test.ts` in the same directory

### Testing Framework

- **Use Vitest** for all tests (NOT Jest)
- Follow the monorepo testing guidelines from the root CLAUDE.md

### Testing Commands

```bash
# Run tests for the web app
turbo run test --filter=@buster-app/web

# Run specific test file
pnpm run test path/to/file.test.ts

# Watch mode for development
pnpm run test:watch
```

## Best Practices

### Code Quality

- Follow the monorepo-wide standards from the root CLAUDE.md
- Use functional, composable code patterns
- Create small, focused functions with single responsibilities
- Mock external dependencies in unit tests

### Performance

- Use dynamic imports for code splitting
- Implement proper loading states
- Optimize images with Next.js Image component
- Use React.memo() and useMemo() where appropriate

### State Management

- Use TanStack Query for server state
- Local state with useState/useReducer
- Context API for cross-component state when needed
- Maintain consistent cache keys via `query_keys/`

## Common Patterns

### API Calls

```typescript
// Import types
import type { UserResponse } from '@/api/asset_interfaces/user';
import type { UpdateUserRequest } from '@/api/request_interfaces/user';

// Use REST client
import { busterRest } from '@/api/buster_rest';

// Make typed API call
const updateUser = async (data: UpdateUserRequest): Promise<UserResponse> => {
  return busterRest.user.update(data);
};
```

### WebSocket Integration

```typescript
// Import socket client
import { busterSocket } from '@/api/buster_socket';

// Use with React Query
import { useBusterSocketQuery } from '@/api/buster_socket_query';

// Subscribe to real-time updates
const { data, isLoading } = useBusterSocketQuery({
  namespace: 'metrics',
  event: 'update',
  queryKey: ['metrics', metricId]
});
```

## Environment Variables

- Use `NEXT_PUBLIC_` prefix for client-side variables
- Server-only variables don't need the prefix
- Type environment variables in `env.d.ts`

Remember to always check the root CLAUDE.md for monorepo-wide standards and run the pre-completion checklist before finishing any task.
