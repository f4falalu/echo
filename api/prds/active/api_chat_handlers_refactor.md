# Chat Handlers Authentication Refactor

## Overview
This PRD outlines the plan to refactor all chat handlers in `libs/handlers/src/chats/` to accept the complete `AuthenticatedUser` object instead of just the `user_id` parameter.

## Problem Statement
Currently, chat handlers accept only a user ID (`Uuid`) as the user parameter. This approach has several limitations:

1. It lacks rich user context information such as organization memberships and roles
2. It requires additional database lookups to fetch user attributes
3. It doesn't align with the REST endpoints which already use the `AuthenticatedUser` type from middleware

By refactoring these handlers to accept the complete `AuthenticatedUser` object, we will:
- Improve code efficiency by reducing redundant database queries
- Enhance security by making permission checks more comprehensive
- Increase consistency across the codebase
- Improve test reliability with standardized test user fixtures

## Goals
- Update all chat handlers to use `AuthenticatedUser` instead of user ID
- Optimize handler code to use available user context information
- Ensure tests continue to pass with the new parameter format
- Maintain or improve existing functionality

## Non-Goals
- Changing the business logic of the chat handlers
- Modifying the database schema
- Adding new features to chat handlers
- Changing the API contract between handlers and consumers

## Technical Design

### Overview
The refactoring will involve updating function signatures across all chat handlers to accept `&AuthenticatedUser` instead of `&Uuid`, and then modifying the internal logic to use `user.id` instead of `user_id` where appropriate. We'll also leverage additional user information to optimize certain operations.

### Components to Modify

#### Chat Handlers
1. `get_chat_handler.rs`
2. `list_chats_handler.rs`
3. `update_chats_handler.rs`
4. `delete_chats_handler.rs`
5. `post_chat_handler.rs` 
6. `get_raw_llm_messages_handler.rs`

#### Chat Sharing Handlers
1. `sharing/create_sharing_handler.rs`
2. `sharing/list_sharing_handler.rs`
3. `sharing/update_sharing_handler.rs`
4. `sharing/delete_sharing_handler.rs`

#### Example Function Signature Changes

```rust
// Before
pub async fn get_chat_handler(chat_id: &Uuid, user_id: &Uuid) -> Result<ChatWithMessages> {
    // ...
}

// After
pub async fn get_chat_handler(chat_id: &Uuid, user: &AuthenticatedUser) -> Result<ChatWithMessages> {
    // ...
}
```

#### Code Changes Pattern

For each handler, we'll:
1. Update the function signature to accept `&AuthenticatedUser` instead of `&Uuid`
2. Replace all instances of `user_id` with `user.id` in function body
3. Leverage user attributes where applicable (like `user.avatar_url` or organization info)
4. Update database queries to filter by `user.id` instead of `user_id`

#### Example Implementation (for get_chat_handler.rs)

```rust
// Before
pub async fn get_chat_handler(chat_id: &Uuid, user_id: &Uuid) -> Result<ChatWithMessages> {
    // Run thread and messages queries concurrently
    let thread_future = {
        // ...
        tokio::spawn(async move {
            chats::table
                // ...
                .filter(chats::created_by.eq(user_id))
                // ...
        })
    };
    // ...
}

// After
pub async fn get_chat_handler(chat_id: &Uuid, user: &AuthenticatedUser) -> Result<ChatWithMessages> {
    // Run thread and messages queries concurrently
    let thread_future = {
        // ...
        let user_id = user.id;
        tokio::spawn(async move {
            chats::table
                // ...
                .filter(chats::created_by.eq(user_id))
                // ...
        })
    };
    // ...
    
    // We can now use user.avatar_url directly instead of extracting it from the database
    // This optimization is possible because we have the full user object
}
```

### Performance Optimizations

The refactoring will allow for several optimizations:

1. **Avoid User Lookups**: We can directly use user data from the `AuthenticatedUser` object instead of querying the database
2. **Organization Context**: We can use organization memberships for permission checks without additional queries
3. **Team Context**: We can use team memberships for enhanced authorization

### REST Endpoint Changes

REST endpoints will need minimal changes:

```rust
// Before
pub async fn get_chat_route(
    Path(chat_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<ChatWithMessages>, ApiError> {
    let result = get_chat_handler(&chat_id, &user.id).await?;
    // ...
}

// After 
pub async fn get_chat_route(
    Path(chat_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<ChatWithMessages>, ApiError> {
    let result = get_chat_handler(&chat_id, &user).await?;
    // ...
}
```

### Files to Modify

#### Handler Files
1. `/libs/handlers/src/chats/get_chat_handler.rs`
2. `/libs/handlers/src/chats/list_chats_handler.rs`
3. `/libs/handlers/src/chats/update_chats_handler.rs`
4. `/libs/handlers/src/chats/delete_chats_handler.rs`
5. `/libs/handlers/src/chats/post_chat_handler.rs`
6. `/libs/handlers/src/chats/get_raw_llm_messages_handler.rs`
7. `/libs/handlers/src/chats/sharing/create_sharing_handler.rs`
8. `/libs/handlers/src/chats/sharing/list_sharing_handler.rs`
9. `/libs/handlers/src/chats/sharing/update_sharing_handler.rs`
10. `/libs/handlers/src/chats/sharing/delete_sharing_handler.rs`

#### REST Endpoints
1. `/src/routes/rest/routes/chats/get_chat.rs`
2. `/src/routes/rest/routes/chats/list_chats.rs`
3. `/src/routes/rest/routes/chats/update_chat.rs`
4. `/src/routes/rest/routes/chats/update_chats.rs`
5. `/src/routes/rest/routes/chats/delete_chats.rs`
6. `/src/routes/rest/routes/chats/post_chat.rs`
7. `/src/routes/rest/routes/chats/get_chat_raw_llm_messages.rs`
8. `/src/routes/rest/routes/chats/sharing/create_sharing.rs`
9. `/src/routes/rest/routes/chats/sharing/list_sharing.rs`
10. `/src/routes/rest/routes/chats/sharing/update_sharing.rs`
11. `/src/routes/rest/routes/chats/sharing/delete_sharing.rs`

#### Tests (if they exist)
1. Any test files that directly call these chat handlers

## Implementation Plan

### Phase 1: Function Signatures
- ⏳ Update all chat handler function signatures
- ⏳ Adjust internal references to use `user.id` instead of `user_id`
- 🔜 Run initial tests to identify any immediate issues

### Phase 2: Functionality Updates
- 🔜 Optimize handlers to use `AuthenticatedUser` properties where applicable
- 🔜 Update any permission or filtering logic to leverage user roles
- 🔜 Implement comprehensive testing for all refactored handlers

### Phase 3: REST Endpoint Integration
- 🔜 Update all chat-related REST endpoints to pass the full user object
- 🔜 Run integration tests to ensure everything works together
- 🔜 Fix any issues that emerge during testing

### Phase 4: Documentation and Cleanup
- 🔜 Update function documentation to reflect new parameter
- 🔜 Clean up any legacy code related to user lookups
- 🔜 Finalize test suite for the refactored handlers

## Testing Strategy

### Unit Tests
- Each refactored handler will need unit tests with the new parameter
- Tests will need to use the new test utilities to create mock users
- Tests should verify handling of different user roles and permissions

### Integration Tests
- REST endpoints need to be tested to verify they properly pass the user object
- End-to-end flow tests to ensure everything works together
- Performance testing to confirm optimizations provide expected benefits

### Test Cases
1. User retrieving their own chat
2. User attempting to access a chat they don't own or have permission for
3. Admin user accessing another user's chat
4. Bulk operations with different user types
5. Handling of sharing operations with different permission levels

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to accept both formats temporarily
2. Implement wrapper functions until issues are resolved
3. Roll back specific problematic handlers if necessary

## Success Criteria
- All chat handlers accept `AuthenticatedUser` instead of just user ID
- All tests pass with the new implementation
- REST endpoints work correctly with refactored handlers
- No regression in functionality or performance
- Improved code maintainability and reduced redundant database queries

## Dependencies
- Completion of the test utilities for creating mock `AuthenticatedUser` objects
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing chat handlers implementation

## Timeline
Expected completion time: 1 week

This PRD depends on the completion of the test utilities PRD and should be implemented after that work is done.