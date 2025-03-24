# Messages Handlers Authentication Refactor

## Overview
This PRD outlines the plan to refactor all message handlers in `libs/handlers/src/messages/` to accept the complete `AuthenticatedUser` object instead of just the `user_id` parameter.

## Problem Statement
Currently, message handlers accept only a user ID (`Uuid`) as the user parameter. This approach has several limitations:

1. It lacks rich user context information such as organization memberships and roles
2. It requires additional database lookups to fetch user data within handlers
3. It doesn't align with the REST endpoints which already use the `AuthenticatedUser` type from middleware

By refactoring these handlers to accept the complete `AuthenticatedUser` object, we will:
- Improve code efficiency by reducing redundant database queries
- Enhance security by making permission checks more comprehensive
- Increase consistency across the codebase
- Improve test reliability with standardized test user fixtures

## Goals
- Update all message handlers to use `AuthenticatedUser` instead of user ID
- Ensure tests continue to pass with the new parameter format
- Optimize handler code to use available user context information
- Maintain backward compatibility with existing functionality

## Non-Goals
- Changing the business logic of the message handlers
- Modifying database schemas
- Adding new features to message handlers
- Changing the API contract between handlers and consumers

## Technical Design

### Overview
The refactoring will involve updating function signatures across all message handlers to accept `&AuthenticatedUser` instead of `&Uuid`, and then modifying the internal logic to use `user.id` instead of `user_id` where appropriate. We'll also leverage additional user information to optimize certain operations.

### Components to Modify

#### Message Handlers
1. `helpers/update_message_handler.rs`
2. `helpers/delete_message_handler.rs`
3. Any other message handlers or helper functions that use user ID

#### Example Function Signature Changes

```rust
// Before
pub async fn update_message_handler(
    message_id: &Uuid,
    update: &MessageUpdate,
    user_id: &Uuid
) -> Result<Message> {
    // ...
}

// After
pub async fn update_message_handler(
    message_id: &Uuid,
    update: &MessageUpdate,
    user: &AuthenticatedUser
) -> Result<Message> {
    // ...
}
```

#### Key Implementation Details

For each handler, we'll:
1. Update the function signature to accept `&AuthenticatedUser` instead of `&Uuid`
2. Replace all instances of `user_id` with `user.id` in function body
3. Leverage user attributes and organization info where applicable
4. Update database queries to filter by `user.id` instead of `user_id`
5. Enhance permission checks using organization and team roles

#### Example Implementation (for update_message_handler.rs)

```rust
// Before
pub async fn update_message_handler(
    message_id: &Uuid,
    update: &MessageUpdate,
    user_id: &Uuid
) -> Result<Message> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the message to verify ownership
    let message = messages::table
        .filter(messages::id.eq(message_id))
        .filter(messages::created_by.eq(user_id))
        .filter(messages::deleted_at.is_null())
        .first::<Message>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Message not found or you don't have permission to update it"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Update the message
    let updated_message = diesel::update(messages::table)
        .filter(messages::id.eq(message_id))
        .set(update.to_db_update())
        .get_result::<Message>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to update message: {}", e))?;
    
    Ok(updated_message)
}

// After
pub async fn update_message_handler(
    message_id: &Uuid,
    update: &MessageUpdate,
    user: &AuthenticatedUser
) -> Result<Message> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the message first to check ownership and chat relationships
    let message = messages::table
        .filter(messages::id.eq(message_id))
        .filter(messages::deleted_at.is_null())
        .first::<Message>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Message not found or has been deleted"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Enhanced permission check
    if message.created_by != user.id {
        // Get the chat to check if user has admin privileges in the chat's organization
        let chat = chats::table
            .filter(chats::id.eq(message.chat_id))
            .first::<Chat>(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to get chat: {}", e))?;
            
        // Check if user has admin privileges in this organization
        let is_org_admin = user.organizations.iter()
            .any(|org| org.id == chat.organization_id && 
                 (org.role == UserOrganizationRole::Admin || 
                  org.role == UserOrganizationRole::Owner));
        
        if !is_org_admin {
            return Err(anyhow!("You don't have permission to update this message"));
        }
    }
    
    // Update the message
    let updated_message = diesel::update(messages::table)
        .filter(messages::id.eq(message_id))
        .set(update.to_db_update())
        .get_result::<Message>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to update message: {}", e))?;
    
    Ok(updated_message)
}
```

### REST Endpoint Changes

REST endpoints will need minimal changes:

```rust
// Before
pub async fn update_message_route(
    Path(message_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(update): Json<MessageUpdateRequest>
) -> Result<ApiResponse<MessageResponse>, ApiError> {
    let message_update = MessageUpdate::from(update);
    match update_message_handler(&message_id, &message_update, &user.id).await {
        // ...
    }
}

// After
pub async fn update_message_route(
    Path(message_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(update): Json<MessageUpdateRequest>
) -> Result<ApiResponse<MessageResponse>, ApiError> {
    let message_update = MessageUpdate::from(update);
    match update_message_handler(&message_id, &message_update, &user).await {
        // ...
    }
}
```

### Files to Modify

#### Handler Files
1. `/libs/handlers/src/messages/helpers/update_message_handler.rs`
2. `/libs/handlers/src/messages/helpers/delete_message_handler.rs`
3. Any other message-related handlers that use user ID

#### REST Endpoints
1. `/src/routes/rest/routes/messages/update_message.rs`
2. `/src/routes/rest/routes/messages/delete_message.rs`
3. Any other REST endpoints that use message handlers

## Implementation Plan

### Phase 1: Handler Refactoring
- ⏳ Update signature and implementation of message handlers
- ⏳ Enhance permission checks using user organization information
- 🔜 Run tests to validate the changes

### Phase 2: REST Endpoint Integration
- 🔜 Update REST endpoints to pass the full user object
- 🔜 Run integration tests to ensure everything works together
- 🔜 Fix any issues that emerge during testing

## Testing Strategy

### Unit Tests
- Each refactored handler will need updated tests
- Tests will use the new test utilities to create mock users
- Tests should verify handling of different user roles and permissions

### Integration Tests
- End-to-end tests to validate the complete flow
- Tests for permission checks with various user types

### Test Cases
1. User updating their own message
2. User attempting to update a message they don't own
3. Admin user updating messages in their organization
4. Permission checks for messages in shared chats

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. Document specific issues for resolution in next attempt

## Success Criteria
- All message handlers successfully accept `AuthenticatedUser` instead of just user ID
- All tests pass with the new implementation
- REST endpoints work correctly with refactored handlers
- No regression in functionality or performance
- Enhanced permission checks using organization information

## Dependencies
- Completion of the test utilities for creating mock `AuthenticatedUser` objects
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing message handlers implementation
- Completion of the chats handlers refactoring (since messages are related to chats)

## Timeline
Expected completion time: 1-2 days

This PRD depends on the completion of the test utilities PRD and chats handlers refactoring, and should be implemented after those are completed.