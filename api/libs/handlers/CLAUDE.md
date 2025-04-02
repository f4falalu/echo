# Handlers Library - Agent Guidance

## Purpose & Role

The Handlers library implements the request handlers for the Buster API, processing incoming HTTP requests, performing business logic, and returning appropriate responses. It acts as the controller layer in the application architecture, orchestrating interactions between other libraries.

## Key Functionality

- REST API endpoint handlers for all resources
- Request validation and authentication
- Response formatting and error handling
- Business logic implementation
- Resource management (chats, collections, dashboards, metrics, etc.)
- Sharing and permission management

## Internal Organization

### Directory Structure

```
src/
  ├── chats/ - Chat and thread handlers
  │   ├── context_loaders/ - Context loading for chats
  │   ├── helpers/ - Chat utility functions
  │   ├── sharing/ - Chat sharing functionality
  │   ├── streaming_parser.rs - Streaming response parsing
  │   ├── types.rs - Chat-specific types
  │   └── mod.rs
  ├── collections/ - Collection management
  │   ├── sharing/ - Collection sharing
  │   ├── types.rs - Collection-specific types
  │   └── mod.rs
  ├── dashboards/ - Dashboard management
  │   ├── sharing/ - Dashboard sharing
  │   ├── types.rs - Dashboard-specific types
  │   └── mod.rs
  ├── data_sources/ - Data source handlers
  ├── favorites/ - User favorites
  ├── logs/ - Log handling
  ├── messages/ - Message management
  │   ├── types/ - Message-related types
  │   └── helpers/ - Message utility functions
  ├── metrics/ - Metrics management
  │   ├── sharing/ - Metrics sharing
  │   ├── types.rs - Metrics-specific types
  │   └── mod.rs
  ├── utils/ - Shared utilities
  │   └── user/ - User-related utilities
  └── lib.rs - Public exports
```

### Key Modules

- `chats`: Handles chat and thread operations (create, update, delete, list)
- `collections`: Manages collections of assets (create, add/remove assets, share)
- `dashboards`: Handles dashboard operations and associations
- `data_sources`: Manages data source connections and configurations
- `favorites`: Handles user favorite assets and resources
- `messages`: Manages individual messages within threads
- `metrics`: Handles metric operations and associations
- `utils`: Shared utility functions used across handlers

## Usage Patterns

```rust
use handlers::chats::post_chat_handler;
use handlers::thread_types::PostChatRequest;

async fn example_handler(req: PostChatRequest, user: AuthenticatedUser) -> Result<Json<Response>, Error> {
    // Call the appropriate handler
    let response = post_chat_handler(req, user, pool).await?;
    
    // Return the response
    Ok(Json(response))
}
```

### Common Implementation Patterns

- Each handler follows a consistent pattern for request processing
- Authentication and permission checks are performed at the beginning
- Database operations are isolated and use the connection pool
- Errors are mapped to appropriate HTTP responses
- Responses are structured according to API specifications
- Sharing handlers follow a consistent pattern across resource types
- Context loaders are used to fetch related data for complex operations

## Dependencies

- **Internal Dependencies**:
  - `database`: For data persistence and retrieval
  - `agents`: For agent-based processing
  - `litellm`: For LLM interactions
  - `query_engine`: For executing queries against data sources
  - `middleware`: For authentication and request processing
  - `sharing`: For permission and sharing functionality

- **External Dependencies**:
  - `diesel` and `diesel-async`: For database operations
  - `serde` and `serde_json`: For serialization/deserialization
  - `uuid`: For unique identifier handling
  - `chrono`: For date/time operations
  - `anyhow`: For error handling

## Code Navigation Tips

- Start with `lib.rs` to see all exported modules
- Each module in the top level represents a resource type (chats, collections, etc.)
- Handler files are named after their operation (e.g., `create_dashboard_handler.rs`)
- Type definitions for requests and responses are in `types.rs` files
- Sharing functionality is consistently implemented in `sharing/` submodules
- Helper functions are organized in `helpers/` submodules
- Look for common patterns across similar handlers

## Testing Guidelines

- Mock dependencies (database, agents, etc.) for unit tests
- Test error handling and edge cases
- Verify permissions and access controls
- Test the full request-response cycle for integration tests
- Use test fixtures for consistent test data
- Run tests with: `cargo test -p handlers`
- Create tests for each handler in the corresponding `tests/` directory

### Automatic Test Environment Setup

Integration tests in this library use an automatic database pool initialization system. The environment is set up once when the test module is loaded, eliminating the need for explicit initialization in each test.

**Important Notes:**
- This is a test-only feature that is excluded from release builds
- The test dependencies (`lazy_static` and `ctor`) are listed under `[dev-dependencies]` in Cargo.toml
- The entire `/tests` directory is only compiled during test runs (`cargo test`)

Key components:
- `tests/mod.rs` contains the initialization code using `lazy_static` and `ctor`
- Database pools are initialized only once for all tests
- Tests can directly use `get_pg_pool()` without any setup code

Example test:
```rust
use anyhow::Result;
use database::pool::get_pg_pool;

#[tokio::test]
async fn test_handler_functionality() -> Result<()> {
    // Database pool is already initialized
    let pool = get_pg_pool();
    
    // Test code here using the pool
    Ok(())
}
```

To add new test modules, simply:
1. Create a new module in the `tests/` directory
2. Add it to the module declarations in `tests/mod.rs`
3. Write standard async tests using `#[tokio::test]`