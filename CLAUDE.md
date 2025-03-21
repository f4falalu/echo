# Guidelines for Claude Code

## Code Quality Standards
- Always clean up warnings shown by `cargo check` or similar commands
- Remove unused dependencies from Cargo.toml files
- Follow Rust best practices and idiomatic patterns
- Ensure code passes linting and typechecking before completion
- Use `cargo clippy` to identify and fix code quality issues
- All code must pass `cargo check` before being merged into any other branch
- Never merge code that has failing tests or compiler errors

## Project Structure
- Maintain the workspace-based organization with multiple crates
- Keep the API modular with separate libraries for specific functionality
- Follow the established routing and module organization patterns
- Design for modularity to enable unit testing and component isolation
- Structure code to minimize dependencies and enable independent testing

## Error Handling
- Use thiserror for defining custom error types
- Implement From trait for error conversions
- Use the ? operator for error propagation
- Include descriptive error messages

## Code Style
- Use 4-space indentation
- Follow consistent naming conventions
- Organize imports logically
- Use modern Rust idioms
- Write modular code with clear separation of concerns
- Design components to be testable from the start

## Testing
- Write unit tests alongside implementation code
- Create integration tests for critical functionality
- Use test fixtures for common test setup
- All tests must pass before merging to other branches
- Run `cargo test` locally to verify changes don't break existing functionality
  - Scope tests to the parts of the code being worked on during development (`cargo test -p <package_name>`)
  - Run the full test suite before submitting changes for review
- Aim for high test coverage on critical components
- Write tests that are meaningful and verify actual business logic

## Documentation
- Document public interfaces and modules
- Include clear comments for complex implementations
- Keep documentation up to date with code changes

## Library Architecture

The Buster API is organized into several modular libraries, each with a specific purpose. When working with these libraries, maintain their architectural boundaries and respect their intended uses.

### Core Libraries

| Library | Purpose | Key Functionality |
|---------|---------|-------------------|
| `agents` | Provides agent functionality for interacting with LLMs | Agent interfaces, tool execution framework, specialized agents for data-related tasks |
| `database` | Core database interaction and models | Connection pooling, models, schema definitions, database helpers |
| `handlers` | Request handlers for the REST API | Endpoint implementations, request validation, response formatting |
| `query_engine` | Data source connection and query execution | Database connections, query execution, data transformation |
| `streaming` | Streaming parser for LLM responses | JSON stream parsing, partial data processing, processor registry |

### Supporting Libraries

| Library | Purpose | Key Functionality |
|---------|---------|-------------------|
| `braintrust` | Client for Braintrust API integration | Spans and traces for monitoring AI application performance |
| `litellm` | Client for LLM providers | Unified interface to various LLM providers, message handling |
| `middleware` | HTTP middleware components | Authentication, CORS, request validation |
| `sharing` | Asset sharing and permission management | Permission checks, asset sharing, user lookup |

### Library Dependency Map

- `handlers` → depends on most other libraries to implement API endpoints
- `agents` → depends on `litellm`, `database`, `query_engine`
- `query_engine` → depends on `database`
- `sharing` → depends on `database`
- `middleware` → depends on `database`

When working on a feature, start by identifying which library or libraries are responsible for the functionality, and respect the existing architecture patterns.

### Library Management Guidelines

- When adding a new library to the codebase, always:
  - Update this CLAUDE.md file with:
    - The library's name, purpose, and key functionality
    - Its placement in the appropriate category (Core or Supporting)
    - Any dependencies it has on other libraries
    - Update the dependency map if needed
  - Create a CLAUDE.md in the library's root directory that includes:
    - Detailed explanation of the library's purpose and role
    - Overview of its internal organization and key modules
    - Usage patterns and implementation guidance
    - Dependencies and relationships with other libraries
    - Code navigation tips for the agent
    - Testing guidelines specific to this library

- When significantly changing a library's purpose or functionality:
  - Update its description in this document
  - Update the library's CLAUDE.md with the new information
  - Update any dependent libraries' documentation if the changes affect their usage

- Maintain architectural boundaries between libraries to prevent circular dependencies
- Each library should have clear and well-documented public interfaces