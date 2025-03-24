# Handler Authentication Refactor

## Overview
This PRD outlines the plan to refactor all handlers in `libs/handlers` to accept the complete `AuthenticatedUser` object from `libs/middleware/src/types.rs` instead of just the `user_id` parameter.

## Problem Statement
Currently, handlers in the `libs/handlers` directory accept only a user ID (`Uuid`) as the user parameter. This approach has several limitations:

1. It lacks rich user context information such as organization memberships, team memberships, and roles
2. It requires additional database lookups to fetch user data within handlers
3. It doesn't align with the REST endpoints which already use the `AuthenticatedUser` type from middleware

By refactoring these handlers to accept the complete `AuthenticatedUser` object, we will:
- Improve code efficiency by reducing redundant database queries
- Enhance security by making permission checks more comprehensive
- Increase consistency across the codebase
- Improve test reliability with standardized test user fixtures

## Goals
- Update all get, update, delete, and share handlers to use `AuthenticatedUser` instead of user ID
- Create test utilities to generate mock `AuthenticatedUser` objects for testing
- Ensure backward compatibility with existing endpoints
- Maintain or improve performance
- Improve security by leveraging user role information

## Non-Goals
- Changing the business logic of the handlers
- Modifying database schemas
- Changing endpoint URLs or parameters
- Adding new functionality to handlers

## Technical Design

### Overview
The refactoring will involve updating handler function signatures across all handler modules to accept `&AuthenticatedUser` instead of `&Uuid`, and then modifying the internal logic to use `user.id` instead of `user_id` where appropriate. We'll also create test utilities to support this change.

### Components to Create/Modify

#### 1. New Test Utility Module
```
/libs/handlers/tests/common/test_utils.rs
```

This module will provide functions to create mock `AuthenticatedUser` objects for testing.

```rust
use middleware::AuthenticatedUser;
use database::enums::{TeamToUserRole, UserOrganizationRole};
use chrono::Utc;
use uuid::Uuid;
use serde_json::Value;

/// Creates a mock authenticated user for testing
pub fn create_test_user(
    id: Option<Uuid>,
    org_id: Option<Uuid>,
    team_id: Option<Uuid>
) -> AuthenticatedUser {
    let user_id = id.unwrap_or_else(Uuid::new_v4);
    let org_id = org_id.unwrap_or_else(Uuid::new_v4);
    let team_id = team_id.unwrap_or_else(Uuid::new_v4);
    
    AuthenticatedUser {
        id: user_id,
        email: format!("test-{}@example.com", user_id),
        name: Some(format!("Test User {}", user_id)),
        config: serde_json::json!({}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: serde_json::json!({"avatar": "test-avatar.jpg"}),
        avatar_url: Some("test-avatar.jpg".to_string()),
        organizations: vec![
            middleware::OrganizationMembership {
                id: org_id,
                role: UserOrganizationRole::Admin,
            }
        ],
        teams: vec![
            middleware::TeamMembership {
                id: team_id,
                role: TeamToUserRole::Owner,
            }
        ],
    }
}

/// Creates a mock admin user for testing
pub fn create_test_admin_user() -> AuthenticatedUser {
    create_test_user(None, None, None)
}

/// Creates a mock regular user for testing
pub fn create_test_regular_user(org_id: Uuid) -> AuthenticatedUser {
    let mut user = create_test_user(None, Some(org_id), None);
    user.organizations[0].role = UserOrganizationRole::Member;
    user
}
```

#### 2. Handler Refactoring Pattern

For each handler, we'll change the function signature and implementation:

```rust
// Before
pub async fn get_chat_handler(chat_id: &Uuid, user_id: &Uuid) -> Result<ChatWithMessages> {
    // ...
    .filter(chats::created_by.eq(user_id))
    // ...
}

// After
pub async fn get_chat_handler(chat_id: &Uuid, user: &AuthenticatedUser) -> Result<ChatWithMessages> {
    // ...
    .filter(chats::created_by.eq(user.id))
    // ...
}
```

#### 3. REST Endpoint Updates

REST endpoints already use `AuthenticatedUser` through middleware:

```rust
// Before
match update_chats_handler(vec![chat_update], &user.id).await {
    // ...
}

// After
match update_chats_handler(vec![chat_update], &user).await {
    // ...
}
```

### List of Files to Modify

#### Chat Handlers
- `/libs/handlers/src/chats/get_chat_handler.rs`
- `/libs/handlers/src/chats/list_chats_handler.rs`
- `/libs/handlers/src/chats/update_chats_handler.rs`
- `/libs/handlers/src/chats/delete_chats_handler.rs`
- `/libs/handlers/src/chats/post_chat_handler.rs`
- `/libs/handlers/src/chats/sharing/create_sharing_handler.rs`
- `/libs/handlers/src/chats/sharing/list_sharing_handler.rs`
- `/libs/handlers/src/chats/sharing/update_sharing_handler.rs`
- `/libs/handlers/src/chats/sharing/delete_sharing_handler.rs`

#### Collection Handlers
- `/libs/handlers/src/collections/get_collection_handler.rs`
- `/libs/handlers/src/collections/list_collections_handler.rs`
- `/libs/handlers/src/collections/create_collection_handler.rs`
- `/libs/handlers/src/collections/update_collection_handler.rs`
- `/libs/handlers/src/collections/delete_collection_handler.rs`
- `/libs/handlers/src/collections/add_assets_to_collection_handler.rs`
- `/libs/handlers/src/collections/add_dashboards_to_collection_handler.rs`
- `/libs/handlers/src/collections/remove_assets_from_collection_handler.rs`
- `/libs/handlers/src/collections/remove_metrics_from_collection_handler.rs`
- `/libs/handlers/src/collections/sharing/create_sharing_handler.rs`
- `/libs/handlers/src/collections/sharing/list_sharing_handler.rs`
- `/libs/handlers/src/collections/sharing/update_sharing_handler.rs`
- `/libs/handlers/src/collections/sharing/delete_sharing_handler.rs`

#### Dashboard Handlers
- `/libs/handlers/src/dashboards/get_dashboard_handler.rs`
- `/libs/handlers/src/dashboards/list_dashboard_handler.rs`
- `/libs/handlers/src/dashboards/create_dashboard_handler.rs`
- `/libs/handlers/src/dashboards/update_dashboard_handler.rs`
- `/libs/handlers/src/dashboards/delete_dashboard_handler.rs`
- `/libs/handlers/src/dashboards/remove_dashboard_from_collections_handler.rs`
- `/libs/handlers/src/dashboards/sharing/create_sharing_handler.rs`
- `/libs/handlers/src/dashboards/sharing/list_sharing_handler.rs`
- `/libs/handlers/src/dashboards/sharing/update_sharing_handler.rs`
- `/libs/handlers/src/dashboards/sharing/delete_sharing_handler.rs`

#### Metrics Handlers
- `/libs/handlers/src/metrics/get_metric_handler.rs`
- `/libs/handlers/src/metrics/get_metric_data_handler.rs`
- `/libs/handlers/src/metrics/list_metrics_handler.rs`
- `/libs/handlers/src/metrics/update_metric_handler.rs`
- `/libs/handlers/src/metrics/delete_metric_handler.rs`
- `/libs/handlers/src/metrics/add_metric_to_collections_handler.rs`
- `/libs/handlers/src/metrics/remove_metrics_from_collection_handler.rs`
- `/libs/handlers/src/metrics/post_metric_dashboard_handler.rs`
- `/libs/handlers/src/metrics/sharing/create_sharing_handler.rs`
- `/libs/handlers/src/metrics/sharing/list_sharing_handler.rs`
- `/libs/handlers/src/metrics/sharing/update_sharing_handler.rs`
- `/libs/handlers/src/metrics/sharing/delete_sharing_handler.rs`

#### Data Source Handlers
- `/libs/handlers/src/data_sources/get_data_source_handler.rs`
- `/libs/handlers/src/data_sources/list_data_sources_handler.rs`
- `/libs/handlers/src/data_sources/update_data_source_handler.rs`

#### Message Handlers
- `/libs/handlers/src/messages/helpers/update_message_handler.rs`
- `/libs/handlers/src/messages/helpers/delete_message_handler.rs`

#### Favorites Handlers
- `/libs/handlers/src/favorites/list_favorites.rs`
- `/libs/handlers/src/favorites/create_favorite.rs`
- `/libs/handlers/src/favorites/update_favorites.rs`
- `/libs/handlers/src/favorites/delete_favorite.rs`

#### REST Endpoints (Examples)
- `/src/routes/rest/routes/chats/update_chat.rs`
- `/src/routes/rest/routes/collections/update_collection.rs`
- `/src/routes/rest/routes/dashboards/update_dashboard.rs`
- `/src/routes/rest/routes/metrics/update_metric.rs`

#### Test Files
- `/libs/handlers/tests/metrics/delete_metric_test.rs`
- `/libs/handlers/tests/metrics/update_metric_test.rs`
- `/libs/handlers/tests/metrics/post_metric_dashboard_test.rs`
- `/libs/handlers/tests/dashboards/list_sharing_test.rs`

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- ⏳ Create `test_utils.rs` module with mock user functions
- ⏳ Update test helper functions to support `AuthenticatedUser`
- 🔜 Update metrics handler tests to use new test utilities
- 🔜 Refactor metric handlers (highest priority due to existing tests)

### Phase 2: Chat and Message Handlers (Week 2)
- 🔜 Refactor chat handler function signatures
- 🔜 Update chat handler implementations
- 🔜 Update chat handler tests
- 🔜 Refactor message handlers
- 🔜 Update message handler tests

### Phase 3: Collection and Dashboard Handlers (Week 3)
- 🔜 Refactor collection handler function signatures
- 🔜 Update collection handler implementations
- 🔜 Update collection handler tests
- 🔜 Refactor dashboard handlers
- 🔜 Update dashboard handler tests

### Phase 4: Remaining Handlers (Week 4)
- 🔜 Refactor data source handlers
- 🔜 Update data source handler tests
- 🔜 Refactor favorites handlers
- 🔜 Update favorites handler tests

### Phase 5: Integration and REST Endpoint Updates (Week 5)
- 🔜 Update REST endpoints to pass full user object
- 🔜 Run comprehensive integration tests
- 🔜 Fix any edge cases or issues
- 🔜 Verify all functionality works as expected

## Testing Strategy

### Unit Tests
- Each refactored handler will have updated unit tests
- Tests will use the new mock user utilities
- Tests will verify handling of different user roles and permissions

### Integration Tests
- End-to-end tests will validate the complete request flow
- Tests will verify that REST endpoints work correctly with refactored handlers
- Tests will validate behavior with various user profiles

### Test Cases
1. Admin user accessing resources they own
2. Admin user accessing resources they don't own
3. Regular user accessing their own resources
4. Regular user attempting to access resources they don't have permission for
5. User from a different organization attempting to access resources

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. Document specific issues encountered
3. Re-implement with fixes

## Success Criteria
- All handlers use `AuthenticatedUser` instead of just user ID
- All tests pass with the new implementation
- REST endpoints work correctly with refactored handlers
- No regression in functionality or performance
- Improved code maintainability

## Dependencies
- `middleware::AuthenticatedUser` from `libs/middleware/src/types.rs`
- Database models and schema
- Existing test utilities

## Priority Order
1. Test utilities (highest priority - required for all other work)
2. Metrics handlers (have existing tests to validate approach)
3. Chat handlers (core functionality)
4. Message handlers (part of chat functionality)
5. Collection handlers (used throughout the application)
6. Dashboard handlers (used throughout the application)
7. Favorites handlers (used across multiple features)
8. Data source handlers (less direct user interaction)

## Timeline
- Phase 1: Week 1
- Phase 2: Week 2  
- Phase 3: Week 3
- Phase 4: Week 4
- Phase 5: Week 5

Total duration: 5 weeks