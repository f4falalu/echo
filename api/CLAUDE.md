# Buster API Repository Navigation Guide

## Row Limit Implementation Notes
All database query functions in the query_engine library have been updated to respect a 5000 row limit by default. The limit can be overridden by passing an explicit limit value. This is implemented in the libs/query_engine directory.

## Documentation
The project's detailed documentation is in the `/documentation` directory:
- `handlers.mdc` - Handler patterns
- `libs.mdc` - Library construction guidelines 
- `rest.mdc` - REST API formatting
- `testing.mdc` - Testing standards
- `tools.mdc` - Tools documentation
- `websockets.mdc` - WebSocket patterns

While these files contain best practices for writing tests, REST patterns, etc., **each subdirectory should have its own README.md or CLAUDE.md** that should be referenced first when working in that specific area. These subdirectory-specific guides often contain implementation details and patterns specific to that component.

## Repository Structure
- `src/` - Main server code
  - `routes/` - API endpoints (REST, WebSocket)
  - `utils/` - Shared utilities
  - `types/` - Common type definitions
- `libs/` - Shared libraries
  - Each lib has its own Cargo.toml and docs
- `migrations/` - Database migrations
- `tests/` - Integration tests
- `documentation/` - Detailed docs
- `prds/` - Product requirements

## Build Commands
- `make dev` - Start development
- `make stop` - Stop development
- `cargo test -- --test-threads=1 --nocapture` - Run tests
- `cargo clippy` - Run linter
- `cargo build` - Build project

## Core Guidelines
- Use `anyhow::Result` for error handling
- Group imports (std lib, external, internal)
- Put shared types in `types/`, route-specific types in route files
- Use snake_case for variables/functions, CamelCase for types
- Never log secrets or sensitive data
- All dependencies inherit from workspace using `{ workspace = true }`
- Use database connection pool from `get_pg_pool().get().await?`
- Write tests with `tokio::test` for async tests

## Common Database Pattern
```rust
let pool = get_pg_pool();
let mut conn = pool.get().await?;

diesel::update(table)
    .filter(conditions)
    .set(values)
    .execute(&mut conn)
    .await?
```

## Common Concurrency Pattern
```rust
let futures: Vec<_> = items
    .into_iter()
    .map(|item| process_item(item))
    .collect();
let results = try_join_all(futures).await?;
```