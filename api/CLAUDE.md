# Buster API Development Guide

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