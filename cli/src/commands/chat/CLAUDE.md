# CLAUDE.md - Chat Module

This document provides guidance for Claude Code (claude.ai/code) when working with the Buster CLI chat implementation.

## Architecture Overview

The Buster CLI chat module is a terminal-based interactive chat interface that connects to an AI agent with specialized data engineering capabilities. It's specifically designed for working with:

- DBT projects (data build tool)
- Buster semantic layer
- General data engineering tasks

### Key Components

- **BusterCliAgent**: Core component that manages the AI connection and tool integration
- **AppState**: Maintains chat state, message history, and UI elements
- **UI Layer**: Terminal-based interface using Ratatui and Crossterm
- **Tool Integration**: Facilitates AI interaction with the filesystem, DBT commands, and Buster API

## Code Organization

- `mod.rs`: Main module entry point and public API
- `args.rs`: Command-line argument parsing
- `config.rs`: Configuration management
- `logic.rs`: Core chat execution logic
- `state.rs`: Chat session state management
- `ui.rs`: Terminal UI implementation
- `completion.rs`: Path and command autocompletion

## AI Agent Capabilities

The chat agent is designed to:

1. Interact with DBT projects (compile, run, test)
2. Work with Buster semantic layer models
3. Execute file operations (read, write, search)
4. Run shell commands 
5. Manage context across chat sessions
6. Provide data engineering assistance

## Important Concepts

### Message Flow
1. User input is submitted through `submit_message()`
2. Agent processes input and may call tools
3. Tool results are returned to agent
4. Agent's final response is processed by `process_agent_message()`

### Tool Integration
- Tools are invoked through a standardized API
- Path completion supports filesystem navigation
- Shell commands can be executed with `!` prefix
- DBT commands have specialized handling

### State Management
- `AppState` is the central state container
- UI state and business logic are clearly separated
- Different message types (User, Assistant, Tool) are handled appropriately

## Error Handling

- Uses Rust's `thiserror` for typed errors
- Terminal state is properly restored on errors or panics
- User-friendly error messages with suggestions

## Security Considerations

- Credentials are handled securely
- Path traversal protection is implemented
- User inputs are validated
- No secrets are logged

## Development Guidelines

- Add new tools in the tool handler section of `logic.rs`
- UI changes should be isolated to `ui.rs`
- Follow the established message handling pattern for new message types
- Test with both local and remote agent endpoints
- Ensure proper error handling and terminal state restoration

## Testing

- Test agent interaction with mock responses
- Verify tool integration with isolated test cases
- Check terminal UI rendering in different environments
- Validate path completion behavior
- Confirm proper credential handling