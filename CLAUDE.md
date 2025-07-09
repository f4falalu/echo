# CLAUDE.md

This file provides guidance to Claude Code when working with code in this monorepo.

## Monorepo Structure

This is a pnpm-based monorepo using Turborepo with the following structure:

### Apps (`@buster-app/*`)
- `apps/web` - Next.js frontend application
- `apps/server` - Node.js/Hono backend server  
- `apps/trigger` - Background job processing with Trigger.dev v3
- `apps/electric-server` - Electric SQL sync server
- `apps/api` - Rust backend API (legacy)
- `apps/cli` - Command-line tools (Rust)

### Packages (`@buster/*`)
- `packages/ai` - AI agents, tools, and workflows using Mastra framework
- `packages/database` - Database schema, migrations, and utilities (Drizzle ORM)
- `packages/data-source` - Data source adapters (PostgreSQL, MySQL, BigQuery, Snowflake, etc.)
- `packages/access-controls` - Permission and access control logic
- `packages/stored-values` - Stored values management
- `packages/rerank` - Document reranking functionality
- `packages/server-shared` - Shared server types and utilities
- `packages/test-utils` - Shared testing utilities
- `packages/vitest-config` - Shared Vitest configuration
- `packages/typescript-config` - Shared TypeScript configuration
- `packages/web-tools` - Web scraping and research tools
- `packages/slack` - Standalone Slack integration (OAuth, messaging, channels)
- `packages/supabase` - Supabase setup and configuration

## Development Workflow

When writing code, follow this workflow to ensure code quality:

### 1. Write Modular, Testable Functions
- Create small, focused functions with single responsibilities
- Design functions to be easily testable with clear inputs/outputs
- Use dependency injection for external dependencies
- Follow existing patterns in the codebase

### 2. Build Features by Composing Functions
- Combine modular functions to create complete features
- Keep business logic separate from infrastructure concerns
- Use proper error handling at each level

### 3. Ensure Type Safety
```bash
# Build entire monorepo to check types
turbo run build

# Build specific package/app
turbo run build --filter=@buster/ai
turbo run build --filter=@buster-app/web

# Type check without building
turbo run typecheck
turbo run typecheck --filter=@buster/database
```

### 4. Run Biome for Linting & Formatting
```bash
# Check files with Biome
pnpm run check path/to/file.ts
pnpm run check packages/ai

# Auto-fix linting, formatting, and import organization
pnpm run check:fix path/to/file.ts
pnpm run check:fix packages/ai
```

### 5. Run Tests with Vitest
```bash
# Run all tests
pnpm run test

# Run tests for specific package
turbo run test --filter=@buster/ai

# Run specific test file
pnpm run test path/to/file.test.ts

# Watch mode for development
pnpm run test:watch
```

## Code Quality Standards

### TypeScript Configuration
- **Strict mode enabled** - All strict checks are on
- **No implicit any** - Always use specific types
- **Strict null checks** - Handle null/undefined explicitly
- **No implicit returns** - All code paths must return
- **Consistent file casing** - Enforced by TypeScript

### Type Safety and Zod Best Practices
- We care deeply about type safety and we use Zod schemas and then export them as types
- We prefer using type abstractions over `.parse()` method calls
- Always export Zod schemas as TypeScript types to leverage static type checking
- Avoid runtime type checking when compile-time type checks are sufficient

### Biome Rules (Key Enforcements)
- **`useImportType: "warn"`** - Use type-only imports when possible
- **`noExplicitAny: "error"`** - Never use `any` type
- **`noUnusedVariables: "error"`** - Remove unused code
- **`noNonNullAssertion: "error"`** - No `!` assertions
- **`noConsoleLog: "warn"`** - Avoid console.log in production
- **`useNodejsImportProtocol: "error"`** - Use `node:` prefix for Node.js imports

### Logging Guidelines
- **Never use `console.log`**
- **Use appropriate console methods**:
  - `console.info` for general information
  - `console.warn` for warning messages
  - `console.error` for error messages

## Error Handling and Logging Philosophy
- We care deeply about error handling and logging
- Key principles for error management:
  - Catch errors effectively and thoughtfully
  - Consider the state errors put the system into
  - Implement comprehensive unit tests for error scenarios
  - Log errors strategically for effective debugging
  - Avoid over-logging while ensuring sufficient context for troubleshooting

## Hono API Development Guidelines

### API Structure and Organization
- **Version-based organization** - APIs are organized under `/api/v2/` directory
- **Feature-based folders** - Each feature gets its own folder (e.g., `chats/`, `security/`)
- **Separate handler files** - Each endpoint handler must be in its own file
- **Functional handlers** - All handlers should be pure functions that accept request data and return response data

### Request/Response Type Safety
- **Use shared types** - All request and response types must be defined in `@buster/server-shared`
- **Zod schemas** - Define schemas in server-shared and export both the schema and inferred types
- **zValidator middleware** - Always use `zValidator` from `@hono/zod-validator` for request validation
- **Type imports** - Import types from server-shared packages for consistency

### Handler Pattern
```typescript
// Handler file (e.g., get-workspace-settings.ts)
import type { GetWorkspaceSettingsResponse } from '@buster/server-shared/security';
import type { User } from '@buster/database';

export async function getWorkspaceSettingsHandler(
  user: User
): Promise<GetWorkspaceSettingsResponse> {
  // Implementation
}

// Route definition (index.ts)
.get('/workspace-settings', async (c) => {
  const user = c.get('busterUser');
  const response = await getWorkspaceSettingsHandler(user);
  return c.json(response);
})
```

### Authentication and User Context
- **Use requireAuth middleware** - Apply to all protected routes
- **Extract user context** - Use `c.get('busterUser')` to get the authenticated user
- **Type as User** - Import `User` type from `@buster/database` for handler parameters