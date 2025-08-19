# AGENT.md

## Commands
- **Build**: `turbo build` or `turbo run build:dry-run` (type check only)
- **Tests**: `turbo run test:unit` (run before completing tasks), `turbo run test:integration --filter=<package>`
- **Single test**: `turbo run test:unit --filter=<package>` or run test files directly in specific packages
- **Lint**: `turbo lint`, `pnpm run check:fix <path>` (auto-fixes with Biome)
- **Pre-completion check**: `turbo run build:dry-run lint test:unit`

## Architecture
**Monorepo**: pnpm + Turborepo with `@buster/*` packages and `@buster-app/*` apps
- **Apps**: web (Next.js), server (Hono API), trigger (background jobs), electric-server, api (Rust legacy), cli (Rust)
- **Key packages**: ai (Mastra framework), database (Drizzle ORM), server-shared (API types), data-source, access-controls
- **Database**: PostgreSQL with Supabase, soft deletes only (`deleted_at`), queries in `@buster/database/src/queries/`
- **APIs**: Hono with functional handlers, type-safe with Zod schemas in `@buster/server-shared`

## Code Style
- **TypeScript**: Strict mode, no `any`, handle null/undefined explicitly
- **Imports**: Use type-only imports (`import type`), Node.js protocol (`node:fs`)
- **Formatting**: Biome - 2 spaces, single quotes, trailing commas, 100 char width
- **Functions**: Functional/composable over classes, dependency injection, small focused functions
- **Logging**: Never `console.log`, use `console.info/warn/error`
- **Naming**: `@buster/{package}` for packages, `@buster-app/{app}` for apps
- **Error handling**: Comprehensive with strategic logging, soft deletes, upserts preferred
