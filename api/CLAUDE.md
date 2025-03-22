# Buster API Development Guide

## Documentation
The project's detailed documentation can be found in the `/documentation` directory. This directory contains the following files with comprehensive information on various aspects of the codebase:

- `handlers.mdc` - Documentation for writing and using handlers
- `libs.mdc` - Guidelines for library construction and organization
- `prds.mdc` - Product Requirements Document guidelines
- `rest.mdc` - REST API formatting rules and patterns
- `testing.mdc` - Testing standards, utilities, and best practices
- `tools.mdc` - Documentation for building tools
- `websockets.mdc` - WebSocket API formatting rules

When working on the codebase, please refer to these documentation files for detailed guidance on implementation patterns, code organization, and best practices.

## Build Commands
- `make dev` - Start the development environment
- `make stop` - Stop the development environment
- `cargo test -- --test-threads=1 --nocapture` - Run all tests
- `cargo test <test_name> -- --nocapture` - Run a specific test
- `cargo clippy` - Run the linter
- `cargo build` - Build the project
- `cargo watch -x run` - Watch for changes and run

## Code Style Guidelines
- **Error Handling**: Use `anyhow::Result` for functions that can fail. Create specialized errors with `thiserror`.
- **Naming**: Use snake_case for variables/functions, CamelCase for types/structs.
- **Types**: Put shared types in `types/`, route-specific types in route files.
- **Organization**: Follow the repo structure in README.md.
- **Imports**: Group imports by std lib, external crates, and internal modules.
- **Testing**: Write tests directly in route files. Use `tokio::test` attribute for async tests.
- **Documentation**: Document public APIs. Use rustdoc-style comments.
- **Async**: Use async/await with Tokio. Handle futures properly.
- **Validation**: Validate inputs with proper error messages.
- **Security**: Never log secrets or sensitive data.
- **Dependencies**: All dependencies must be inherited from the workspace Cargo.toml using `{ workspace = true }`. Never specify library-specific dependency versions to ensure consistent dependency versions across the entire project.

# Handler Rules and Best Practices

## Overview
Handlers are the core business logic components that implement functionality used by both REST and WebSocket endpoints. They are also often used by the CLI package. This document outlines the structure, patterns, and best practices for working with handlers.

## File Structure
- `libs/handlers/src/`
  - `[domain]/` - Domain-specific modules (e.g., messages, chats, files, metrics)
    - `mod.rs` - Re-exports handlers and types
    - `types.rs` - Domain-specific data structures
    - `*_handler.rs` - Individual handler implementations
    - `helpers/` - Helper functions and utilities for handlers

## Naming Conventions
- Handler files should be named with the pattern: `[action]_[resource]_handler.rs`
  - Example: `get_chat_handler.rs`, `delete_message_handler.rs`
- Handler functions should follow the same pattern: `[action]_[resource]_handler`
  - Example: `get_chat_handler()`, `delete_message_handler()`
- Type definitions should be clear and descriptive
  - Request types: `[Action][Resource]Request`
  - Response types: `[Action][Resource]Response`

## Handler Implementation Guidelines

### Function Signatures
```rust
pub async fn action_resource_handler(
    // Parameters typically include:
    request: ActionResourceRequest, // For REST/WS request data
    user: User,                     // For authenticated user context
    // Other contextual parameters as needed
) -> Result<ActionResourceResponse> {
    // Implementation
}
```

### Error Handling
- Use `anyhow::Result<T>` for return types
- Provide descriptive error messages with context
- Handle specific error cases appropriately
- Log errors with relevant context
- Example:
```rust
match operation() {
    Ok(result) => Ok(result),
    Err(diesel::NotFound) => Err(anyhow!("Resource not found")),
    Err(e) => {
        tracing::error!("Operation failed: {}", e);
        Err(anyhow!("Operation failed: {}", e))
    }
}
```

### Database Operations
- Use the connection pool: `get_pg_pool().get().await?`
- Run concurrent operations when possible
- Use transactions for related operations
- Handle database-specific errors appropriately
- Example:
```rust
let pool = get_pg_pool();
let mut conn = pool.get().await?;

diesel::update(table)
    .filter(conditions)
    .set(values)
    .execute(&mut conn)
    .await?
```

### Concurrency
- Use `tokio::spawn` for concurrent operations
- Use `futures::try_join_all` for parallel processing
- Be mindful of connection pool limits
- Example:
```rust
let thread_future = tokio::spawn(async move {
    // Database operation 1
});

let messages_future = tokio::spawn(async move {
    // Database operation 2
});

let (thread_result, messages_result) = tokio::join!(thread_future, messages_future);
```

### Logging
- Use structured logging with `tracing`
- Include relevant context in log messages
- Log at appropriate levels (info, warn, error)
- Example:
```rust
tracing::info!(
    resource_id = %id,
    user_id = %user.id,
    "Processing resource action"
);
```

### Type Definitions
- Use `serde` for serialization/deserialization
- Define clear, reusable types
- Use appropriate validation
- Example:
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct ResourceRequest {
    pub id: Uuid,
    pub name: String,
    #[serde(default)]
    pub options: Vec<String>,
}
```

## Integration with REST and WebSocket APIs
- Handlers should be independent of transport mechanism
- Same handler can be used by both REST and WebSocket endpoints
- Handlers should focus on business logic, not HTTP/WebSocket specifics
- Example:
```rust
// In REST route
pub async fn rest_endpoint(
    Json(payload): Json<HandlerRequest>,
    user: User,
) -> Result<Json<HandlerResponse>, AppError> {
    let result = handler::action_resource_handler(payload, user).await?;
    Ok(Json(result))
}

// In WebSocket handler
async fn ws_message_handler(message: WsMessage, user: User) -> Result<WsResponse> {
    let payload: HandlerRequest = serde_json::from_str(&message.payload)?;
    let result = handler::action_resource_handler(payload, user).await?;
    Ok(WsResponse::new(result))
}
```

## CLI Integration
- Handler types should be reusable in CLI commands
- CLI commands should use the same handlers as the API when possible
- Example:
```rust
// In CLI command
pub fn cli_command(args: &ArgMatches) -> Result<()> {
    let request = HandlerRequest {
        // Parse from args
    };
    
    let result = tokio::runtime::Runtime::new()?.block_on(async {
        handler::action_resource_handler(request, mock_user()).await
    })?;
    
    println!("{}", serde_json::to_string_pretty(&result)?);
    Ok(())
}
```

## Testing
- Write unit tests for handlers
- Mock database and external dependencies
- Test error cases and edge conditions
- Example:
```rust
#[tokio::test]
async fn test_action_resource_handler() {
    // Setup test data
    let request = HandlerRequest { /* ... */ };
    let user = mock_user();
    
    // Call handler
    let result = action_resource_handler(request, user).await;
    
    // Assert expectations
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.field, expected_value);
}
```

## Common Patterns
- Retrieve data from database
- Process and transform data
- Interact with external services
- Return structured response
- Handle errors and edge cases
- Log relevant information

# Global Rules and Project Structure

## Project Overview
This is a Rust web server project built with Axum, focusing on high performance, safety, and maintainability.

## Project Structure
- `src/`
  - `routes/`
    - `rest/` - REST API endpoints using Axum
      - `routes/` - Individual route modules
    - `ws/` - WebSocket handlers and related functionality
  - `database/` - Database models, schema, and connection management
  - `main.rs` - Application entry point and server setup
- `libs/`
  - `sql_analyzer/` - SQL parsing and analysis with lineage tracking
    - `src/` - Library source code
      - `lib.rs` - Main entry point and API
      - `types.rs` - Data structures for query analysis
      - `errors.rs` - Custom error types
      - `utils.rs` - SQL parsing and analysis utilities

## Implementation
When working with prds, you should always mark your progress off in them as you build.

## Database Connectivity
- The primary database connection is managed through `get_pg_pool()`, which returns a lazy static `PgPool`
- Always use this pool for database connections to ensure proper connection management
- Example usage:
```rust
let mut conn = get_pg_pool().get().await?;
```

## Code Style and Best Practices

### References and Memory Management
- Prefer references over owned values when possible
- Avoid unnecessary `.clone()` calls
- Use `&str` instead of `String` for function parameters when the string doesn't need to be owned

### Importing packages/crates
- Please make the dependency as short as possible in the actual logic by importing the crate/package.

### Database Operations
- Use Diesel for database migrations and query building
- Migrations are stored in the `migrations/` directory

### Concurrency Guidelines
- Prioritize concurrent operations, especially for:
  - API requests
  - File operations
- Optimize database connection usage:
  - Batch operations where possible
  - Build queries/parameters before executing database operations
  - Use bulk inserts/updates instead of individual operations
```rust
// Preferred: Bulk operation
let items: Vec<_> = prepare_items();
diesel::insert_into(table)
    .values(&items)
    .execute(conn)?;

// Avoid: Individual operations in a loop
for item in items {
    diesel::insert_into(table)
        .values(&item)
        .execute(conn)?;
}
```

### Error Handling
- Never use `.unwrap()` or `.expect()` in production code
- Always handle errors appropriately using:
  - The `?` operator for error propagation
  - `match` statements when specific error cases need different handling
- Use `anyhow` for error handling:
  - Prefer `anyhow::Result<T>` as the return type for functions that can fail
  - Use `anyhow::Error` for error types
  - Use `anyhow!` macro for creating custom errors
```rust
use anyhow::{Result, anyhow};

// Example of proper error handling
pub async fn process_data(input: &str) -> Result<Data> {
    // Use ? for error propagation
    let parsed = parse_input(input)?;
    
    // Use match when specific error cases need different handling
    match validate_data(&parsed) {
        Ok(valid_data) => Ok(valid_data),
        Err(e) => Err(anyhow!("Data validation failed: {}", e))
    }
}

// Avoid this:
// let data = parse_input(input).unwrap(); // ❌ Never use unwrap
```

### API Design
- REST endpoints should be in `routes/rest/routes/`
- WebSocket handlers should be in `routes/ws/`
- Use proper HTTP status codes
- Implement proper validation for incoming requests

### Testing
- Write unit tests for critical functionality
- Use integration tests for API endpoints
- Mock external dependencies when appropriate

## Common Patterns

### Database Queries
```rust
use diesel::prelude::*;

// Example of a typical database query
pub async fn get_item(id: i32) -> Result<Item> {
    let pool = get_pg_pool();
    let conn = pool.get().await?;
    
    items::table
        .filter(items::id.eq(id))
        .first(&conn)
        .map_err(Into::into)
}
```

### Concurrent Operations
```rust
use futures::future::try_join_all;

// Example of concurrent processing
let futures: Vec<_> = items
    .into_iter()
    .map(|item| process_item(item))
    .collect();
let results = try_join_all(futures).await?;
```

Remember to always consider:
1. Connection pool limits when designing concurrent operations
2. Error handling for sequential related operations
3. Error propagation and cleanup
4. Memory usage and ownership
5. Please use comments to help document your code and make it more readable.

# Library Construction Guide

## Directory Structure
```
libs/
├── my_lib/
│   ├── Cargo.toml       # Library-specific manifest
│   ├── src/
│   │   ├── lib.rs       # Library root
│   │   ├── models/      # Data structures and types
│   │   ├── utils/       # Utility functions
│   │   └── errors.rs    # Custom error types
│   └── tests/           # Integration tests
```

## Cargo.toml Template
```toml
[package]
name = "my_lib"
version = "0.1.0"
edition = "2021"

# Dependencies should be inherited from workspace
[dependencies]
# Use workspace dependencies
anyhow = { workspace = true }
chrono = { workspace = true }
serde = { workspace = true }
serde_json = { workspace = true }
tokio = { workspace = true }
tracing = { workspace = true }
uuid = { workspace = true }
diesel = { workspace = true }
diesel-async = { workspace = true }
# Add other workspace dependencies as needed

# Development dependencies
[dev-dependencies]
tokio-test = { workspace = true }
# Add other workspace dev dependencies as needed

# Feature flags
[features]
default = []
# Define library-specific features here
```

## Best Practices

### 1. Workspace Integration
- Use `{ workspace = true }` for common dependencies
- Never specify library-specific versions for dependencies that exist in the workspace
- All dependencies should be managed by the workspace
- Keep feature flags modular and specific to the library's needs

### 2. Library Structure
- Keep the library focused on a single responsibility
- Use clear module hierarchies
- Export public API through `lib.rs`
- Follow the workspace's common patterns

Example `lib.rs`:
```rust
//! My Library documentation
//! 
//! This library provides...

// Re-export common workspace types if needed
pub use common_types::{Result, Error};

pub mod models;
pub mod utils;
mod errors;

// Re-exports
pub use errors::Error;
pub use models::{ImportantType, AnotherType};
```

### 3. Error Handling
- Use the workspace's common error types where appropriate
- Define library-specific errors only when needed
- Implement conversions to/from workspace error types

Example `errors.rs`:
```rust
use thiserror::Error;
use common_types::Error as WorkspaceError;

#[derive(Error, Debug)]
pub enum Error {
    #[error("library specific error: {0}")]
    LibrarySpecific(String),
    
    #[error(transparent)]
    Workspace(#[from] WorkspaceError),
}
```

### 4. Testing
- Follow workspace testing conventions
- Use shared test utilities from workspace when available
- Keep library-specific test helpers in the library
- Use workspace-defined test macros if available

### 5. Documentation
- Follow workspace documentation style
- Link to related workspace documentation
- Document workspace integration points
- Include examples showing workspace type usage

### 6. Integration Points
- Define clear boundaries with other workspace crates
- Use workspace traits and interfaces
- Share common utilities through workspace-level crates
- Consider cross-crate testing

### 7. Development Workflow
- Run workspace-level tests when making changes
- Update workspace documentation if needed
- Follow workspace versioning strategy
- Use workspace-level CI/CD pipelines

### 8. Dependencies
- All dependencies should be inherited from the workspace
- Never add library-specific dependency versions
- Keep dependencies minimal and focused
- The workspace will manage all dependency versions

# PRD (Product Requirements Document) Guidelines

## Overview
This document provides guidelines for creating and managing Product Requirements Documents (PRDs) in our codebase. All PRDs should follow the standardized template located at [template.md](mdc:prds/template.md)

## PRD Structure

### Location
All PRDs should be stored in the `/prds` directory with the following structure:
```
/prds
├── template.md          # The master template for all PRDs
├── active/             # Active/In-progress PRDs
│   ├── feature_auth.md
│   └── api_deployment.md
├── completed/          # Completed PRDs that have been shipped
│   ├── feature_user_auth.md
│   └── api_deployment.md
└── archived/           # Archived/Deprecated PRDs
```

### Naming Convention
- Use snake_case for file names
- Include a prefix for the type of change:
  - `feature_` for new features
  - `enhancement_` for improvements
  - `fix_` for bug fixes
  - `refactor_` for code refactoring
  - `api_` for API changes

## Using the Template

### Getting Started
1. Copy [template.md](mdc:prds/template.md) to create a new PRD
2. Place it in the `/prds/active` directory
3. Fill out each section following the template's comments and guidelines

### Key Sections to Focus On
The template [template.md](mdc:prds/template.md) provides comprehensive sections. Pay special attention to:

1. **Problem Statement**
   - Must clearly articulate the current state
   - Include measurable impact
   - Reference any relevant metrics or data

2. **Technical Design**
   - Include all affected components
   - Document ALL file changes (new/modified/deleted)
   - Provide actual code examples
   - Include database migrations if needed

3. **Implementation Plan**
   - Break down into deployable phases
   - Include clear success criteria
   - List dependencies between phases
   - Provide testing strategy for each phase

4. **Testing Strategy**
   - Unit test requirements
   - Integration test scenarios

## Best Practices

### Documentation
1. Use clear, concise language
2. Include code examples where relevant
3. Document assumptions and dependencies
4. Keep diagrams up to date
5. Use Mermaid for diagrams when possible

### Lifecycle Management
1. Move PRDs between directories based on status:
   - New PRDs → `/prds/active`
   - Shipped PRDs → `/prds/completed`
   - Deprecated PRDs → `/prds/archived`

2. Update status section regularly:
   - ✅ Completed items
   - ⏳ In Progress items
   - 🔜 Upcoming items
   - ❌ Known Issues

### Review Process
1. Technical review
   - Architecture alignment
   - Security considerations
   - Performance implications
   - Testing coverage

2. Product review
   - Feature completeness
   - User impact
   - Business value
   - Success metrics

## Common Pitfalls to Avoid
1. Incomplete technical specifications
2. Missing file change documentation
3. Unclear success criteria
4. Insufficient testing strategy
5. No rollback plan
6. Missing security considerations
7. Undefined monitoring metrics

## Example PRDs
Reference these example PRDs for guidance:
[template.md](mdc:prds/template.md)

## Checklist Before Submission
- [ ] All template sections completed
- [ ] Technical design is detailed and complete
- [ ] File changes are documented
- [ ] Implementation phases are clear (can be as many as you need.)
- [ ] Testing strategy is defined
- [ ] Security considerations addressed
- [ ] Dependencies and Files listed
- [ ] File References included

# REST API Formatting Rules

## Directory Structure
- All REST routes should be located under `src/routes/rest/routes/`
- Each resource should have its own directory (e.g., `api_keys`, `datasets`)
- Resource directories should contain individual files for each operation
- Each resource directory should have a `mod.rs` that exports and configures the routes

Example folder structure:
```
src/routes/rest/
├── routes/
│   ├── api_keys/
│   │   ├── mod.rs                 # Router configuration and exports
│   │   ├── list_api_keys.rs       # GET / - Contains ApiKeyInfo type definition
│   │   ├── get_api_key.rs         # GET /:id
│   │   ├── post_api_key.rs        # POST /
│   │   └── delete_api_key.rs      # DELETE /:id
│   │
│   ├── datasets/
│   │   ├── mod.rs
│   │   ├── list_datasets.rs       # GET /
│   │   ├── get_dataset.rs         # GET /:id
│   │   ├── post_dataset.rs        # POST /
│   │   ├── update_dataset.rs      # PUT /:id
│   │   ├── patch_dataset.rs       # PATCH /:id
│   │   ├── delete_dataset.rs      # DELETE /:id
│   │   └── deploy_dataset.rs      # POST /:id/deploy (action endpoint)
│   │
│   └── users/
│       ├── mod.rs
│       ├── list_users.rs
│       ├── get_user.rs
│       ├── post_user.rs
│       ├── update_user.rs
│       └── api_keys/              # Sub-resource example
│           ├── mod.rs
│           ├── list_user_api_keys.rs
│           └── post_user_api_key.rs
```

Note: File names should be descriptive and match their HTTP operation (list_, get_, post_, update_, patch_, delete_). For action endpoints, use a descriptive verb (deploy_, publish_, etc.).

## Route Handler Pattern
- Each REST endpoint should follow a two-function pattern:
  1. Main route handler (e.g., `get_api_key`) that:
     - Handles HTTP-specific concerns (status codes, request/response types)
     - Calls the business logic handler
     - Wraps responses in `ApiResponse`
     - Handles error conversion to HTTP responses
  2. Business logic handler (e.g., `get_api_key_handler`) that:
     - Contains pure business logic
     - Returns `Result<T>` where T is your data type
     - Can be reused across different routes (REST/WebSocket)
     - Handles database operations and core functionality

## Type Definitions
- Response types should be defined in the corresponding list operation file (e.g., `ApiKeyInfo` in `list_api_keys.rs`)
- These types can be reused across different operations on the same resource
- Use strong typing with Rust structs for request/response bodies

## Router Configuration
- Each resource module should have a `mod.rs` that defines its router
- Use axum's `Router::new()` to define routes
- Group related routes with `.merge()`
- Apply middleware (like auth) at the router level where appropriate
- Follow RESTful patterns for endpoints:
  - Collection endpoints (no ID):
    - GET / - List resources
    - POST / - Create resources (accepts single item or array)
    - PUT / - Bulk update resources by criteria
    - DELETE / - Bulk delete resources by criteria
  - Single resource endpoints (with ID):
    - GET /:id - Get single resource
    - PUT /:id - Full update of resource (accepts single item or array of updates)
    - PATCH /:id - Partial update of resource (accepts single item or array of patches)
    - DELETE /:id - Delete resources (accepts single id or array of ids)
  - Sub-resource endpoints:
    - GET /:id/sub_resource - List sub-resources
    - POST /:id/sub_resource - Create sub-resources (accepts single item or array)
  - Action endpoints (for operations that don't fit CRUD):
    - POST /:id/action_name - Perform specific action
    - Example: POST /datasets/:id/deploy
  - Query/Filter endpoints:
    - GET /search - Complex search with query params
    - GET /filter - Filtered list with specific criteria

Note: All mutation endpoints (POST, PUT, PATCH, DELETE) should accept both single items and arrays by default. The handler should handle both cases seamlessly. This eliminates the need for separate /bulk endpoints.

## Example Implementation
See @src/routes/rest/routes/api_keys/get_api_key.rs for a reference implementation that demonstrates:
- Separation of HTTP and business logic
- Error handling pattern
- Type usage and database operations
- Clean abstraction of business logic for potential reuse

## Error Handling
- Business logic handlers should return `Result<T>`
- REST handlers should convert errors to appropriate HTTP status codes
- Use `ApiResponse` enum for consistent response formatting
- Include appropriate error logging using `tracing`

## Middleware
- Most the time, every new route should be authenticated, unless specified differently by the user.
- Apply authentication and other middleware at the router level
- Use `route_layer` to apply middleware to groups of routes
- Keep middleware configuration in the resource's `mod.rs`

# Testing Rules and Best Practices

## General Testing Guidelines
- All tests must be async and use tokio test framework
- Tests should be well-documented with clear test case descriptions and expected outputs
- Each test should focus on testing a single piece of functionality
- Tests should be independent and not rely on the state of other tests
- Use meaningful test names that describe what is being tested

## Unit Tests
- Unit tests should be inline with the code they are testing using `#[cfg(test)]` modules
- Each public function should have corresponding unit tests
- Mock external dependencies using mockito for HTTP calls
- Use `mockito::Server::new_async()` instead of `mockito::Server::new()`
- Test both success and error cases
- Test edge cases and boundary conditions

## Integration Tests
- Integration tests should be placed in the `/tests` directory
- Organize integration tests to mirror the main codebase structure
- Each major feature/resource should have its own test file
- Test the interaction between multiple components
- Use real dependencies when possible, mock only what's necessary
- Include end-to-end workflow tests

### Integration Test Setup Requirements
- All integration tests must import and utilize the application's schema from [schema.rs](mdc:src/database/schema.rs)
- Database models from [models.rs](mdc:src/database/models.rs) should be used for test data setup and verification
- Environment setup must use `dotenv` for configuration:
  ```rust
  use dotenv::dotenv;
  
  #[tokio::test]
  async fn setup_test_environment() {
      dotenv().ok(); // Load environment variables
      // Test environment setup
  }
  ```
- Service configurations should be derived from environment variables:
  ```rust
  // Example of service configuration using env vars
  let database_url = std::env::var("DATABASE_URL")
      .expect("DATABASE_URL must be set for integration tests");
  let test_api_key = std::env::var("TEST_API_KEY")
      .expect("TEST_API_KEY must be set for integration tests");
  ```
- Test database setup should include:
  ```rust
  use crate::database::{schema, models};
  
  async fn setup_test_db() -> PgPool {
      let pool = PgPoolOptions::new()
          .max_connections(5)
          .connect(&std::env::var("TEST_DATABASE_URL")?)
          .await?;
      
      // Run migrations or setup test data
      // Use schema and models for consistency
      Ok(pool)
  }
  ```

### Required Environment Variables
Create a `.env.test` file with necessary test configurations:
```env
TEST_DATABASE_URL=postgres://user:pass@localhost/test_db
TEST_API_KEY=test-key
TEST_ENV=test
# Add other required test environment variables
```

## Test Structure
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockito;
    use tokio;

    // Optional: Setup function for common test initialization
    async fn setup() -> TestContext {
        // Setup code here
    }

    #[tokio::test]
    async fn test_name() {
        // Test case description in comments
        // Expected output in comments
        
        // Arrange
        // Setup test data and dependencies
        
        // Act
        // Execute the function being tested
        
        // Assert
        // Verify the results
    }
}
```

## Mocking Guidelines
- Use mockito for HTTP service mocks
- Create mock responses that match real API responses
- Include both successful and error responses in mocks
- Clean up mocks after tests complete

## Error Testing
- Test error conditions and error handling
- Verify error messages and error types
- Test timeout scenarios
- Test connection failures
- Test invalid input handling

## Database Testing
- Use a separate test database for integration tests
- Clean up test data after tests complete
- Test database transactions and rollbacks
- Test database connection error handling

## Test Output
- Tests should provide clear error messages
- Use descriptive assert messages
- Print relevant debug information in test failures
- Log test execution progress for long-running tests

## CI/CD Considerations
- All tests must pass in CI environment
- Tests should be reproducible
- Tests should not have external dependencies that could fail CI
- Test execution time should be reasonable

## Example Test
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockito;
    use tokio;

    #[tokio::test]
    async fn test_api_call_success() {
        // Test case: Successful API call returns expected response
        // Expected: Response contains user data with status 200
        
        let mut server = mockito::Server::new_async().await;
        
        let mock = server
            .mock("GET", "/api/user")
            .match_header("authorization", "Bearer test-token")
            .with_status(200)
            .with_body(r#"{"id": "123", "name": "Test User"}"#)
            .create();

        let client = ApiClient::new(server.url());
        let response = client.get_user().await.unwrap();
        
        assert_eq!(response.id, "123");
        assert_eq!(response.name, "Test User");
        
        mock.assert();
    }
}
```

## Example Integration Test
```rust
use crate::database::{models, schema};
use dotenv::dotenv;

#[tokio::test]
async fn test_user_creation_flow() {
    // Load test environment
    dotenv().ok();
    
    // Setup test database connection
    let pool = setup_test_db().await.expect("Failed to setup test database");
    
    // Create test user using models
    let test_user = models::User {
        id: Uuid::new_v4(),
        email: "test@example.com".to_string(),
        name: Some("Test User".to_string()),
        config: serde_json::Value::Null,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: serde_json::Value::Null,
    };
    
    // Use schema for database operations
    diesel::insert_into(schema::users::table)
        .values(&test_user)
        .execute(&mut pool.get().await?)
        .expect("Failed to insert test user");
    
    // Test application logic
    let response = create_test_client()
        .get("/api/users")
        .send()
        .await?;
    
    assert_eq!(response.status(), 200);
    // Additional assertions...
}
```

## Common Test Utilities
- All shared test utilities should be placed in `tests/common/mod.rs`
- Common database setup and teardown functions should be in `tests/common/db.rs`
- Environment setup utilities should be in `tests/common/env.rs`
- Shared test fixtures should be in `tests/common/fixtures/`

### Common Test Module Structure
```
tests/
├── common/
│   ├── mod.rs           # Main module file that re-exports all common utilities
│   ├── db.rs            # Database setup/teardown utilities
│   ├── env.rs           # Environment configuration utilities
│   ├── fixtures/        # Test data fixtures
│   │   ├── mod.rs       # Exports all fixtures
│   │   ├── users.rs     # User-related test data
│   │   └── threads.rs   # Thread-related test data
│   └── helpers.rs       # General test helper functions
└── integration/         # Integration test files
```

### Common Database Setup
```rust
// tests/common/db.rs
use diesel::PgConnection;
use diesel::r2d2::{ConnectionManager, Pool};
use crate::database::{models, schema};
use dotenv::dotenv;

pub struct TestDb {
    pub pool: Pool<ConnectionManager<PgConnection>>,
}

impl TestDb {
    pub async fn new() -> anyhow::Result<Self> {
        dotenv().ok();
        
        let database_url = std::env::var("TEST_DATABASE_URL")
            .expect("TEST_DATABASE_URL must be set");
            
        let manager = ConnectionManager::<PgConnection>::new(database_url);
        let pool = Pool::builder()
            .max_size(5)
            .build(manager)?;
            
        Ok(Self { pool })
    }
    
    pub async fn setup_test_data(&self) -> anyhow::Result<()> {
        // Add common test data setup here
        Ok(())
    }
    
    pub async fn cleanup(&self) -> anyhow::Result<()> {
        // Cleanup test data
        Ok(())
    }
}
```

### Common Environment Setup
```rust
// tests/common/env.rs
use std::sync::Once;
use dotenv::dotenv;

static ENV_SETUP: Once = Once::new();

pub fn setup_test_env() {
    ENV_SETUP.call_once(|| {
        dotenv().ok();
        // Set any default environment variables for tests
        std::env::set_var("TEST_ENV", "test");
    });
}
```

### Example Test Fixtures
```rust
// tests/common/fixtures/users.rs
use crate::database::models::User;
use chrono::Utc;
use uuid::Uuid;

pub fn create_test_user() -> User {
    User {
        id: Uuid::new_v4(),
        email: "test@example.com".to_string(),
        name: Some("Test User".to_string()),
        config: serde_json::Value::Null,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: serde_json::Value::Null,
    }
}
```

### Using Common Test Utilities
```rust
// Example integration test using common utilities
use crate::tests::common::{db::TestDb, env::setup_test_env, fixtures};

#[tokio::test]
async fn test_user_creation() {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await.expect("Failed to setup test database");
    
    // Get test user fixture
    let test_user = fixtures::users::create_test_user();
    
    // Run test
    let result = create_user(&test_db.pool, &test_user).await?;
    
    // Cleanup
    test_db.cleanup().await?;
    
    assert!(result.is_ok());
}
```

# Tools Documentation and Guidelines

## Overview
This document outlines the architecture, patterns, and best practices for building tools in our system. Tools are modular, reusable components that provide specific functionality to our AI agents and application.

## Core Architecture

### ToolExecutor Trait
The foundation of our tools system is the `ToolExecutor` trait. Any struct that wants to be used as a tool must implement this trait:

```rust
#[async_trait]
pub trait ToolExecutor: Send + Sync {
    type Output: Serialize + Send;
    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output>;
    fn get_schema(&self) -> serde_json::Value;
    fn get_name(&self) -> String;
}
```

Key components:
- `Output`: The return type of your tool (must be serializable)
- `execute()`: The main function that implements your tool's logic
- `get_schema()`: Returns the JSON schema describing the tool's interface
- `get_name()`: Returns the tool's unique identifier

## Tool Categories

### 1. File Tools
Our file tools provide a robust example of well-structured tool implementation. They handle:
- File creation and modification
- File searching and cataloging
- File type-specific operations
- User interaction with files

Key patterns from file tools:
- Modular organization by functionality
- Clear separation of concerns
- Type-safe file operations
- Consistent error handling

### 2. Interaction Tools
Tools that manage user and system interactions.

## Best Practices

### 1. Tool Structure
- Create a new module for each tool category
- Implement the `ToolExecutor` trait
- Use meaningful types for `Output`
- Provide comprehensive error handling

### 2. Schema Design
- Document all parameters clearly
- Use descriptive names for properties
- Include example values where helpful
- Validate input parameters

### 3. Error Handling
- Use `anyhow::Result` for flexible error handling
- Provide meaningful error messages
- Handle edge cases gracefully
- Implement proper error propagation

### 4. Testing
- Write unit tests for each tool
- Test edge cases and error conditions
- Mock external dependencies
- Ensure thread safety for async operations

## Creating New Tools

### Step 1: Define Your Tool
```rust
pub struct MyNewTool {
    // Tool-specific fields
}

#[async_trait]
impl ToolExecutor for MyNewTool {
    type Output = YourOutputType;
    
    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        // Implementation
    }
    
    fn get_schema(&self) -> Value {
        // Schema definition
    }
    
    fn get_name(&self) -> String {
        "my_new_tool".to_string()
    }
}
```

### Step 2: Schema Definition
```json
{
    "name": "my_new_tool",
    "description": "Clear description of what the tool does",
    "parameters": {
        "type": "object",
        "properties": {
            // Tool parameters
        },
        "required": ["param1", "param2"]
    }
}
```

### Step 3: Integration
1. Add your tool to the appropriate module
2. Register it in the tool registry
3. Add necessary tests
4. Document usage examples

## Common Patterns

### Value Conversion
Use `IntoValueTool` trait when you need to convert tool output to generic JSON:
```rust
my_tool.into_value_tool()
```

### File Operations
For tools that modify files:
- Implement `FileModificationTool` trait
- Use `add_line_numbers` for better output formatting
- Handle file permissions appropriately

## Security Considerations
1. Validate all input parameters
2. Check file permissions before operations
3. Sanitize file paths
4. Handle sensitive data appropriately

## Examples

### File Tool Example
```rust
pub struct ReadFileTool {
    base_path: PathBuf,
}

#[async_trait]
impl ToolExecutor for ReadFileTool {
    type Output = String;
    
    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        // Implementation
    }
}
```

### Interaction Tool Example
```rust
pub struct UserPromptTool;

#[async_trait]
impl ToolExecutor for UserPromptTool {
    type Output = UserResponse;
    
    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        // Implementation
    }
}
```

## Troubleshooting
1. Check tool registration
2. Verify schema correctness
3. Ensure proper error handling
4. Validate async operations

## Future Considerations
1. Tool versioning
2. Performance optimization
3. Enhanced type safety
4. Extended testing frameworks

# WebSocket API Formatting Rules

- Commonly used types and functions [ws_utils.rs](mdc:src/routes/ws/ws_utils.rs), [ws_router.rs](mdc:src/routes/ws/ws_router.rs)

## Directory Structure
- All WebSocket routes should be located under `src/routes/ws/`
- Each resource should have its own directory (e.g., `sql`, `datasets`, `threads_and_messages`)
- Resource directories should contain individual files for each operation
- Each resource directory should have a `mod.rs` that exports the routes and types

Example folder structure:
```
src/routes/ws/
├── sql/
│   ├── mod.rs
│   ├── sql_router.rs      # Contains SqlRoute enum and router function
│   └── run_sql.rs         # Contains handler implementation
├── datasets/
│   ├── mod.rs
│   ├── datasets_router.rs # Contains DatasetRoute enum and router function
│   └── list_datasets.rs   # Contains handler implementation
└── threads_and_messages/
    ├── mod.rs
    ├── threads_router.rs
    └── post_thread/
        ├── mod.rs
        ├── post_thread.rs
        └── agent_thread.rs
```

## WebSocket Message Handling with Redis
- WebSocket messages are handled through Redis streams for reliable message delivery
- Key utilities in [ws_utils.rs](mdc:src/routes/ws/ws_utils.rs) handle message sending, subscriptions, and error handling
- Messages are compressed using GZip before being sent through Redis

### Message Sending Pattern
1. Messages are sent using `send_ws_message`:
   - Serializes the `WsResponseMessage` to JSON
   - Compresses the message using GZip
   - Adds the message to a Redis stream with a maxlen of 50
   ```rust
   pub async fn send_ws_message(subscription: &String, message: &WsResponseMessage) -> Result<()> {
       // Serialize and compress message
       let message_string = serde_json::to_string(&message)?;
       let mut compressed = Vec::new();
       let mut encoder = GzipEncoder::new(&mut compressed);
       encoder.write_all(message_string.as_bytes()).await?;
       
       // Send to Redis stream
       redis_conn.xadd_maxlen(
           &subscription,
           StreamMaxlen::Approx(50),
           "*",
           &[("data", &compressed)]
       ).await?;
       
       Ok(())
   }
   ```

### Subscription Management
1. Subscribe to streams using `subscribe_to_stream`:
   - Creates a new Redis stream group if it doesn't exist
   - Adds the subscription to the tracked subscriptions
   - Notifies the user's stream of the new subscription
   ```rust
   subscribe_to_stream(
       subscriptions: &SubscriptionRwLock,
       new_subscription: &String,
       user_group: &String,
       user_id: &Uuid,
   )
   ```

2. Unsubscribe from streams using `unsubscribe_from_stream`:
   - Removes subscription from tracked subscriptions
   - Destroys the Redis stream group
   - Cleans up Redis keys if no groups remain
   - Handles draft subscriptions cleanup
   ```rust
   unsubscribe_from_stream(
       subscriptions: &Arc<SubscriptionRwLock>,
       subscription: &String,
       user_group: &String,
       user_id: &Uuid,
   )
   ```

### Key-Value Operations
- Temporary data can be stored using Redis key-value operations:
  - `set_key_value`: Sets a key with 1-hour expiration
  - `get_key_value`: Retrieves a stored value
  - `delete_key_value`: Removes a stored value

### Error Message Pattern
- Use `send_error_message` for consistent error handling:
  ```rust
  send_error_message(
      subscription: &String,
      route: WsRoutes,
      event: WsEvent,
      code: WsErrorCode,
      message: String,
      user: &AuthenticatedUser,
  )
  ```

## Route Handler Pattern
Each WebSocket endpoint should follow a two-function pattern:

1. Main route handler (e.g., `run_sql`) that:
   - Takes a request payload and user information
   - Calls the business logic handler
   - Handles sending WebSocket messages using `send_ws_message`
   - Returns `Result<()>` since WebSocket responses are sent asynchronously

2. Business logic handler (e.g., `run_sql_handler`) that:
   - Contains pure business logic
   - Returns `Result<T>` where T is your data type
   - Can be reused across different routes (REST/WebSocket)
   - Handles database operations and core functionality

## Route Enums and Router Configuration
- Each resource should have a router file (e.g., `sql_router.rs`) that defines:
  1. A Route enum for path matching (e.g., `SqlRoute`)
  2. An Event enum for event types (e.g., `SqlEvent`)
  3. A router function that matches routes to handlers

Example Route Enum:
```rust
#[derive(Deserialize, Serialize, Debug, Clone)]
pub enum SqlRoute {
    #[serde(rename = "/sql/run")]
    Run,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum SqlEvent {
    RunSql,
}
```

Example Router Function:
```rust
pub async fn sql_router(route: SqlRoute, data: Value, user: &AuthenticatedUser) -> Result<()> {
    match route {
        SqlRoute::Run => {
            let req = serde_json::from_value(data)?;
            run_sql(user, req).await?;
        }
    };
    Ok(())
}
```

## WebSocket Response Pattern
- All WebSocket responses use the `WsResponseMessage` type
- Messages are sent using the `send_ws_message` function
- Responses include:
  - The route that triggered the response
  - The event type
  - The response payload
  - Optional metadata
  - User information
  - Send method (e.g., SenderOnly, Broadcast)

Example Response:
```rust
let response = WsResponseMessage::new(
    WsRoutes::Sql(SqlRoute::Run),
    WsEvent::Sql(SqlEvent::RunSql),
    response_data,
    None,
    user,
    WsSendMethod::SenderOnly,
);

send_ws_message(&user.id.to_string(), &response).await?;
```

## Error Handling
- Business logic handlers should return `Result<T>`
- WebSocket handlers should convert errors to appropriate error messages
- Use `send_error_message` for consistent error formatting
- Include appropriate error logging using `tracing`

Example Error Handling:
```rust
if let Err(e) = result {
    tracing::error!("Error: {}", e);
    send_error_message(
        &user.id.to_string(),
        WsRoutes::Sql(SqlRoute::Run),
        WsEvent::Sql(SqlEvent::RunSql),
        WsErrorCode::InternalServerError,
        e.to_string(),
        user,
    ).await?;
    return Err(anyhow!(e));
}
```

## Main WebSocket Router
- The main router (`ws_router.rs`) contains the `WsRoutes` enum
- Each resource route enum is a variant in `WsRoutes`
- The router parses the incoming path and routes to the appropriate handler
- Follows pattern:
  1. Parse route from path string
  2. Match on route type
  3. Call appropriate resource router

Example:
```rust
pub enum WsRoutes {
    Sql(SqlRoute),
    Datasets(DatasetRoute),
    Threads(ThreadRoute),
    // ... other routes
}

pub async fn ws_router(
    route: String,
    payload: Value,
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &AuthenticatedUser,
) -> Result<()> {
    let parsed_route = WsRoutes::from_str(&route)?;
    match parsed_route {
        WsRoutes::Sql(sql_route) => {
            sql_router(sql_route, payload, user).await
        },
        // ... handle other routes
    }
}
```

## Example Implementation
See @src/routes/ws/sql/run_sql.rs for a reference implementation that demonstrates:
- Separation of WebSocket and business logic
- Error handling pattern
- Type usage and database operations
- WebSocket message sending pattern
- Clean abstraction of business logic for potential reuse