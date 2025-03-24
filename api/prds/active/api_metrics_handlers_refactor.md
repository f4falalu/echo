# Metrics Handlers Authentication Refactor

## Overview
This PRD outlines the plan to refactor all metric handlers in `libs/handlers/src/metrics/` to accept the complete `AuthenticatedUser` object instead of just the `user_id` parameter.

## Problem Statement
Currently, metric handlers accept only a user ID (`Uuid`) as the user parameter. This approach has several limitations:

1. It lacks rich user context information such as organization memberships and roles
2. It requires additional database lookups to fetch user data within handlers
3. It doesn't align with the REST endpoints which already use the `AuthenticatedUser` type from middleware

By refactoring these handlers to accept the complete `AuthenticatedUser` object, we will:
- Improve code efficiency by reducing redundant database queries
- Enhance security by making permission checks more comprehensive
- Increase consistency across the codebase
- Improve test reliability with standardized test user fixtures

## Goals
- Update all metric handlers to use `AuthenticatedUser` instead of user ID
- Create necessary test utilities for creating mock `AuthenticatedUser` objects
- Ensure tests pass with the new parameter format
- Optimize handler code to use available user context information
- Maintain backward compatibility with existing functionality

## Non-Goals
- Changing the business logic of the metric handlers
- Modifying database schemas
- Adding new features to metric handlers
- Changing the API contract between handlers and consumers

## Technical Design

### Overview
The refactoring will involve updating function signatures across all metric handlers to accept `&AuthenticatedUser` instead of `&Uuid`, and then modifying the internal logic to use `user.id` instead of `user_id` where appropriate. We'll also leverage additional user information to optimize certain operations.

### Components to Create/Modify

#### 1. Test Utilities (Required First)
Create a new module in `libs/handlers/tests/common/test_utils.rs` with functions to generate mock `AuthenticatedUser` objects:

```rust
// libs/handlers/tests/common/test_utils.rs
use middleware::AuthenticatedUser;
use middleware::{OrganizationMembership, TeamMembership};
use database::enums::{TeamToUserRole, UserOrganizationRole};
use chrono::{DateTime, Utc};
use serde_json::Value;
use uuid::Uuid;

/// Creates a mock authenticated user for testing with customizable properties
pub fn create_test_user(
    id: Option<Uuid>,
    email: Option<String>,
    name: Option<String>,
    avatar_url: Option<String>,
    config: Option<Value>,
    attributes: Option<Value>,
    organizations: Option<Vec<OrganizationMembership>>,
    teams: Option<Vec<TeamMembership>>,
    created_at: Option<DateTime<Utc>>,
    updated_at: Option<DateTime<Utc>>
) -> AuthenticatedUser {
    let user_id = id.unwrap_or_else(Uuid::new_v4);
    let now = Utc::now();
    
    AuthenticatedUser {
        id: user_id,
        email: email.unwrap_or_else(|| format!("test-{}@example.com", user_id)),
        name: name.or_else(|| Some(format!("Test User {}", user_id))),
        avatar_url,
        config: config.unwrap_or_else(|| serde_json::json!({})),
        attributes: attributes.unwrap_or_else(|| serde_json::json!({"avatar": "test-avatar.jpg"})),
        organizations: organizations.unwrap_or_else(Vec::new),
        teams: teams.unwrap_or_else(Vec::new),
        created_at: created_at.unwrap_or(now),
        updated_at: updated_at.unwrap_or(now),
    }
}

/// Creates a basic test user with default values
pub fn create_basic_test_user() -> AuthenticatedUser {
    create_test_user(
        None, None, None, None, None, None, None, None, None, None
    )
}

/// Creates a mock admin user for testing
pub fn create_test_admin_user(org_id: Option<Uuid>) -> AuthenticatedUser {
    let organization_id = org_id.unwrap_or_else(Uuid::new_v4);
    
    create_test_user(
        None, 
        None,
        Some("Admin User".to_string()),
        None,
        None,
        None,
        Some(vec![
            OrganizationMembership {
                id: organization_id,
                role: UserOrganizationRole::Admin,
            }
        ]),
        None,
        None,
        None
    )
}

/// Creates a mock regular user for testing
pub fn create_test_regular_user(org_id: Option<Uuid>) -> AuthenticatedUser {
    let organization_id = org_id.unwrap_or_else(Uuid::new_v4);
    
    create_test_user(
        None, 
        None,
        Some("Regular User".to_string()),
        None,
        None,
        None,
        Some(vec![
            OrganizationMembership {
                id: organization_id,
                role: UserOrganizationRole::Member,
            }
        ]),
        None,
        None,
        None
    )
}

/// Creates a mock user with specific organization role
pub fn create_test_org_user(
    org_id: Uuid,
    role: UserOrganizationRole
) -> AuthenticatedUser {
    create_test_user(
        None, 
        None,
        None,
        None,
        None,
        None,
        Some(vec![
            OrganizationMembership {
                id: org_id,
                role,
            }
        ]),
        None,
        None,
        None
    )
}
```

#### 2. Update Test Helper Module
Update the test helpers to use these new utilities:

```rust
// In libs/handlers/tests/common/mod.rs or metrics/mod.rs

use super::test_utils::{create_test_user, create_test_admin_user, create_test_regular_user};
use middleware::AuthenticatedUser;

/// Updates existing test functions to use the AuthenticatedUser
pub async fn setup_test_with_user() -> (TestContext, AuthenticatedUser) {
    let context = setup_test_environment().await?;
    let user = create_test_admin_user(None);
    
    (context, user)
}
```

#### 3. Metric Handlers to Refactor

1. Core Metric Handlers:
   - `get_metric_handler.rs`
   - `get_metric_data_handler.rs`
   - `list_metrics_handler.rs`
   - `update_metric_handler.rs`
   - `delete_metric_handler.rs`

2. Collection-Related Metric Handlers:
   - `add_metric_to_collections_handler.rs`
   - `remove_metrics_from_collection_handler.rs`
   - `post_metric_dashboard_handler.rs`

3. Sharing Handlers:
   - `sharing/create_sharing_handler.rs`
   - `sharing/list_sharing_handler.rs`
   - `sharing/update_sharing_handler.rs`
   - `sharing/delete_sharing_handler.rs`

#### Example Function Signature Changes

```rust
// Before
pub async fn delete_metric_handler(metric_id: &Uuid, user_id: &Uuid) -> Result<()> {
    // ...
}

// After
pub async fn delete_metric_handler(metric_id: &Uuid, user: &AuthenticatedUser) -> Result<()> {
    // ...
}
```

#### Example Implementation (for delete_metric_handler.rs)

```rust
// Before
pub async fn delete_metric_handler(metric_id: &Uuid, user_id: &Uuid) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the metric to check ownership
    let metric = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .first::<MetricFile>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Metric not found or already deleted"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Verify the user has permission to delete this metric
    if metric.created_by != *user_id {
        // Additional permission check logic...
    }
    
    // Soft delete the metric by setting deleted_at
    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .set(metric_files::deleted_at.eq(Utc::now()))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to delete metric: {}", e))?;
    
    Ok(())
}

// After
pub async fn delete_metric_handler(metric_id: &Uuid, user: &AuthenticatedUser) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the metric to check ownership
    let metric = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .first::<MetricFile>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Metric not found or already deleted"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Verify the user has permission to delete this metric
    if metric.created_by != user.id {
        // Enhanced permission check using organization role
        let has_org_permission = user.organizations.iter()
            .any(|org| org.id == metric.organization_id && 
                 (org.role == UserOrganizationRole::Admin || 
                  org.role == UserOrganizationRole::Owner));
        
        if !has_org_permission {
            return Err(anyhow!("You don't have permission to delete this metric"));
        }
    }
    
    // Soft delete the metric by setting deleted_at
    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .set(metric_files::deleted_at.eq(Utc::now()))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to delete metric: {}", e))?;
    
    Ok(())
}
```

### REST Endpoint Changes

REST endpoints will need minimal changes to pass the full user object:

```rust
// Before
pub async fn delete_metric_route(
    Path(metric_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<()>, ApiError> {
    match delete_metric_handler(&metric_id, &user.id).await {
        // ...
    }
}

// After
pub async fn delete_metric_route(
    Path(metric_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<()>, ApiError> {
    match delete_metric_handler(&metric_id, &user).await {
        // ...
    }
}
```

### Files to Modify

#### Handler Files
1. `/libs/handlers/src/metrics/get_metric_handler.rs`
2. `/libs/handlers/src/metrics/get_metric_data_handler.rs`
3. `/libs/handlers/src/metrics/list_metrics_handler.rs`
4. `/libs/handlers/src/metrics/update_metric_handler.rs`
5. `/libs/handlers/src/metrics/delete_metric_handler.rs`
6. `/libs/handlers/src/metrics/add_metric_to_collections_handler.rs`
7. `/libs/handlers/src/metrics/remove_metrics_from_collection_handler.rs`
8. `/libs/handlers/src/metrics/post_metric_dashboard_handler.rs`
9. `/libs/handlers/src/metrics/sharing/create_sharing_handler.rs`
10. `/libs/handlers/src/metrics/sharing/list_sharing_handler.rs`
11. `/libs/handlers/src/metrics/sharing/update_sharing_handler.rs`
12. `/libs/handlers/src/metrics/sharing/delete_sharing_handler.rs`

#### Test Files
1. `/libs/handlers/tests/metrics/delete_metric_test.rs`
2. `/libs/handlers/tests/metrics/update_metric_test.rs`
3. `/libs/handlers/tests/metrics/post_metric_dashboard_test.rs`
4. `/libs/handlers/tests/common/test_utils.rs` (new file to create)
5. `/libs/handlers/tests/common/mod.rs` (update to include test_utils)

#### REST Endpoints
1. `/src/routes/rest/routes/metrics/get_metric.rs`
2. `/src/routes/rest/routes/metrics/get_metric_data.rs`
3. `/src/routes/rest/routes/metrics/list_metrics.rs`
4. `/src/routes/rest/routes/metrics/update_metric.rs`
5. `/src/routes/rest/routes/metrics/delete_metric.rs`
6. Other related REST endpoints that use metrics handlers

## Implementation Plan

### Phase 1: Test Utilities (Days 1-2)
- ⏳ Create `test_utils.rs` module with functions to generate mock `AuthenticatedUser` objects in the handlers direcctor
- ⏳ Add these to the common test module
- ⏳ Create unit tests for the utility functions themselves
- ✅ Success criteria: Utilities can create users with various roles and permissions

### Phase 2: Core Metric Handlers (Days 3-4)
- 🔜 Update signatures and implementations of core metric handlers
- 🔜 Update related tests to use the new user format
- 🔜 Run tests to verify changes
- ✅ Success criteria: All core handlers pass tests with the new parameter format

### Phase 3: Collection-Related Handlers (Day 5)
- 🔜 Update collection-related handler signatures and implementations
- 🔜 Update related tests
- 🔜 Run tests to verify changes
- ✅ Success criteria: All collection-related handlers pass tests

### Phase 4: Sharing Handlers (Day 6)
- 🔜 Update sharing handler signatures and implementations
- 🔜 Update related tests
- 🔜 Run tests to verify changes
- ✅ Success criteria: All sharing handlers pass tests

### Phase 5: REST Integration (Day 7)
- 🔜 Update REST endpoints to pass the full user object
- 🔜 Run integration tests
- 🔜 Fix any issues
- ✅ Success criteria: All REST endpoints work correctly with the refactored handlers

## Testing Strategy

### Unit Tests
- Update each existing test to use the new test utilities
- Add tests for different user roles and permissions
- Every handler must have tests that pass before considering the refactoring complete

#### Example Test Update
```rust
// Before
#[tokio::test]
async fn test_delete_metric_integration() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test user ID
    let user_id = Uuid::new_v4();
    
    // Test using user_id
    let result = delete_metric_handler(&metric_id, &user_id).await;
    
    // Assert...
}

// After
#[tokio::test]
async fn test_delete_metric_integration() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test user with the new utilities
    let user = create_test_admin_user(None);
    
    // Test using the full user object
    let result = delete_metric_handler(&metric_id, &user).await;
    
    // Assert...
}
```

### Test Cases

1. Regular User Tests
   - User accessing their own metric
   - User attempting to access a metric they don't own

2. Admin User Tests
   - Admin accessing a metric in their organization
   - Admin attempting to access a metric in another organization

3. Permission Tests
   - User with explicit permissions to a metric
   - User without permissions attempting access

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. Document specific issues for resolution
3. Implement a phased approach if needed, starting with less complex handlers

## Success Criteria
For this PRD to be considered fully implemented:
1. All metric handlers successfully accept `AuthenticatedUser` instead of just user ID
2. All tests are updated and pass with the new implementation
3. REST endpoints correctly pass the full user object
4. No regression in functionality or performance
5. Enhanced permission checks work correctly

## Dependencies
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing metrics handlers implementation
- Existing test infrastructure

## Timeline
Expected completion time: 1 week (7 business days)

- Days 1-2: Test utilities implementation
- Days 3-4: Core metric handlers refactoring
- Day 5: Collection-related handlers refactoring
- Day 6: Sharing handlers refactoring
- Day 7: REST integration and final testing