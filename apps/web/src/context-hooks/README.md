# Context Hooks

This directory contains hooks that are specifically related to API calls and context management. These hooks encapsulate business logic that involves:

- API interactions and data fetching
- Context state management
- Complex business operations that combine multiple API calls or context updates

## Purpose

Context hooks bridge the gap between raw API calls and UI components by providing:
- Reusable business logic
- Consistent error handling
- Optimized data fetching patterns
- Centralized state management operations

## Examples

- `useThemeOperations.ts` - Manages color theme CRUD operations for organizations
- Future hooks that combine multiple API calls or manage complex context state

## Guidelines

- Hooks in this directory should focus on business logic rather than UI concerns
- They should be reusable across multiple components
- Complex API orchestration and context management belongs here
- Pure UI hooks should go in the generic `src/hooks` directory instead
