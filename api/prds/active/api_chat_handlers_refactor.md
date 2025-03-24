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
- Update tests to use the test utilities created in the metrics handlers PRD
- Optimize handler code to use available user context information
- Ensure tests pass with the new parameter format
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
5. Enhance permission checks using organization and team roles

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
    
    // Add enhanced permission checks using organization roles
    if thread.created_by != user.id {
        // Check if user has admin privileges in the organization
        let has_org_permission = user.organizations.iter()
            .any(|org| org.id == thread.organization_id &&
                 (org.role == UserOrganizationRole::Admin || 
                  org.role == UserOrganizationRole::Owner));
                  
        if !has_org_permission {
            return Err(anyhow!("You don't have permission to access this chat"));
        }
    }
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

#### Tests
Any test files that directly call these chat handlers will need to be updated to use the test utilities.

## Implementation Plan

### Phase A: Core Chat Handlers (Days 1-3)
- ⏳ Update signatures and implementations of core chat handlers
- ⏳ Create or update tests for these handlers
- ⏳ Run tests to verify functionality
- ✅ Success criteria: All core chat handlers pass tests with the new parameter format

### Phase B: Chat Sharing Handlers (Days 4-5)
- 🔜 Update signatures and implementations of sharing handlers
- 🔜 Create or update tests for these handlers
- 🔜 Run tests to verify functionality
- ✅ Success criteria: All sharing handlers pass tests with the new parameter format

### Phase C: REST Endpoint Integration (Days 6-7)
- 🔜 Update REST endpoints to pass the full user object
- 🔜 Run integration tests
- 🔜 Fix any issues
- ✅ Success criteria: All REST endpoints work correctly with the refactored handlers

## Testing Strategy

### Unit Tests
- Create tests if they don't exist
- Update existing tests to use the test utilities
- Add tests for different user roles and permissions
- Every handler must have tests that pass before considering the refactoring complete

#### Example Test Creation/Update
```rust
#[tokio::test]
async fn test_get_chat_with_owner() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization
    let org_id = Uuid::new_v4();
    
    // Create test chat
    let chat_id = Uuid::new_v4();
    let test_chat = create_test_chat(chat_id, org_id).await?;
    insert_test_chat(&test_chat).await?;
    
    // Create test user with the new utilities - as the owner
    let user = create_test_user(
        Some(test_chat.created_by),
        None, 
        None,
        None,
        None, 
        None,
        Some(vec![
            OrganizationMembership {
                id: org_id,
                role: UserOrganizationRole::Member,
            }
        ]),
        None,
        None,
        None
    );
    
    // Test using the full user object
    let result = get_chat_handler(&chat_id, &user).await;
    
    // Assert success
    assert!(result.is_ok());
    // Additional assertions...
    
    // Cleanup
    cleanup_test_chat(chat_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_get_chat_with_org_admin() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization
    let org_id = Uuid::new_v4();
    
    // Create test chat
    let chat_id = Uuid::new_v4();
    let creator_id = Uuid::new_v4(); // Different from the admin user
    let test_chat = create_test_chat_with_creator(chat_id, org_id, creator_id).await?;
    insert_test_chat(&test_chat).await?;
    
    // Create test admin user with the new utilities
    let admin_user = create_test_admin_user(Some(org_id));
    
    // Test using the full user object
    let result = get_chat_handler(&chat_id, &admin_user).await;
    
    // Assert success - admin should be able to access
    assert!(result.is_ok());
    // Additional assertions...
    
    // Cleanup
    cleanup_test_chat(chat_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_get_chat_unauthorized() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organizations
    let org_id = Uuid::new_v4();
    let different_org_id = Uuid::new_v4();
    
    // Create test chat
    let chat_id = Uuid::new_v4();
    let creator_id = Uuid::new_v4();
    let test_chat = create_test_chat_with_creator(chat_id, org_id, creator_id).await?;
    insert_test_chat(&test_chat).await?;
    
    // Create user from different organization
    let different_org_user = create_test_regular_user(Some(different_org_id));
    
    // Test using the full user object
    let result = get_chat_handler(&chat_id, &different_org_user).await;
    
    // Assert error - unauthorized
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("permission"));
    
    // Cleanup
    cleanup_test_chat(chat_id).await?;
    
    Ok(())
}
```

### Test Cases

1. Owner User Tests
   - User accessing their own chat
   - User attempting to update their own chat

2. Admin User Tests
   - Admin accessing a chat they don't own
   - Admin updating a chat in their organization

3. Regular User Tests
   - User attempting to access a chat they don't own
   - User in wrong organization attempting access

4. Permission Tests
   - User with explicit permissions through sharing
   - User without permissions attempting access

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. Document specific issues for resolution
3. Implement a phased approach if needed, starting with less complex handlers

## Success Criteria
For this PRD to be considered fully implemented:
1. All chat handlers successfully accept `AuthenticatedUser` instead of just user ID
2. All tests are created or updated and pass with the new implementation
3. REST endpoints correctly pass the full user object
4. No regression in functionality or performance
5. Enhanced permission checks work correctly using organization roles

## Dependencies
- Completion of the test utilities created in the metrics handlers PRD
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing chat handlers implementation

## Timeline
Expected completion time: 1 week (7 business days)

- Days 1-3: Core chat handlers refactoring and testing
- Days 4-5: Chat sharing handlers refactoring and testing
- Days 6-7: REST integration and final validation