# Buster

A modern data analytics platform that enables teams to interact with their data through AI-powered conversations, beautiful dashboards, and automated insights.

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL (via Supabase local or cloud)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/buster-so/buster.git
cd buster
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development servers**
```bash
turbo dev
```

The application will be available at:
- Web app: http://localhost:3000
- API server: http://localhost:8080

## Architecture Overview

Buster follows a modular monorepo architecture where:
- **Packages** are standalone building blocks containing reusable logic and types
- **Apps** assemble packages to create user-facing applications

### Apps

| App | Description | Stack |
|-----|-------------|-------|
| `@buster-app/web` | Main web application | TanStack Start, React |
| `@buster-app/server` | API server | Node.js, Hono |
| `@buster-app/trigger` | Background job processor | Trigger.dev v3 |
| `@buster-app/cli` | Command-line interface | TypeScript, Bun |
| `@buster-app/electric-server` | Real-time sync server | Electric SQL |
| `@buster-app/api` | Legacy API (being migrated) | Rust (deprecated) |

### Core Packages

| Package | Purpose |
|---------|---------|
| `@buster/database` | Database schema, migrations, and ALL query logic (Drizzle ORM) |
| `@buster/server-shared` | API contracts, request/response types |
| `@buster/data-source` | Customer database connectors (PostgreSQL, MySQL, BigQuery, Snowflake) |
| `@buster/ai` | AI agents and workflows (AI SDK v5) |
| `@buster/access-controls` | Permission and security logic |

## Development

### Commands

All development commands use Turbo for optimal caching and parallelization:

```bash
# Building
turbo build                          # Build entire monorepo
turbo build --filter=@buster/ai      # Build specific package

# Linting
turbo lint                           # Lint entire monorepo
turbo lint --filter=@buster-app/web  # Lint specific app

# Testing
turbo test:unit                      # Run all unit tests
turbo test:unit --filter=@buster/database  # Test specific package

# Development
turbo dev                            # Start all dev servers
turbo dev --filter=@buster-app/web   # Start specific app
```

### Development Workflow

1. **Write tests first** - Follow test-driven development
2. **Check types** - Run `turbo build` to ensure type safety
3. **Lint code** - Run `turbo lint` to maintain code quality
4. **Run tests** - Run `turbo test:unit` before committing

### Testing

Tests are colocated with source files:
- `file.test.ts` - Unit tests
- `file.int.test.ts` - Integration tests

```bash
turbo test:unit        # Fast, isolated unit tests
turbo test:integration # Tests with external dependencies
```

### Database

For local development with Supabase:
```bash
# Start Supabase locally
npx supabase start

# Run migrations
turbo db:migrate

# Access database
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

## Contributing

### Code Style

We follow functional programming principles:
- Pure functions over classes
- Immutable data structures
- Type-safe with Zod schemas
- Modular, composable code

### Pull Request Process

1. Create a feature branch
2. Write tests for new functionality
3. Ensure `turbo build lint test:unit` passes
4. Submit PR with clear description
5. Address review feedback

### Documentation

- Each package/app has its own README.md
- CLAUDE.md files provide AI assistant guidance
- Keep documentation close to code

## Project Structure

```
buster/
├── apps/                 # User-facing applications
│   ├── web/             # Main web application
│   ├── server/          # API server
│   ├── trigger/         # Background jobs
│   └── cli/             # Command-line tools
├── packages/            # Reusable modules
│   ├── database/        # Database layer
│   ├── server-shared/   # API contracts
│   ├── data-source/     # Data connectors
│   └── ai/              # AI capabilities
├── turbo.json           # Turbo configuration
├── package.json         # Root package.json
└── .env.example         # Environment template
```

## Tech Stack

- **Frontend**: React, TanStack Start, TailwindCSS
- **Backend**: Node.js, Hono, TypeScript
- **Database**: PostgreSQL (Supabase), Drizzle ORM
- **AI**: OpenAI, Anthropic, AI SDK v5
- **Background Jobs**: Trigger.dev v3
- **Testing**: Vitest
- **Build**: Turborepo, pnpm

## Migration Notice

**Note**: The Rust API (`apps/api`) is legacy code being migrated to TypeScript. All new development should use the TypeScript stack in `apps/server`.

## License

[License information]

## Support

[Support channels and documentation links]