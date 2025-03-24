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
- Ensure tests continue to pass with the new parameter format
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

### Components to Modify

#### Metric Handlers
1. `get_metric_handler.rs`
2. `get_metric_data_handler.rs`
3. `list_metrics_handler.rs`
4. `update_metric_handler.rs`
5. `delete_metric_handler.rs`
6. `add_metric_to_collections_handler.rs`
7. `remove_metrics_from_collection_handler.rs`
8. `post_metric_dashboard_handler.rs`

#### Metric Sharing Handlers
1. `sharing/create_sharing_handler.rs`
2. `sharing/list_sharing_handler.rs`
3. `sharing/update_sharing_handler.rs`
4. `sharing/delete_sharing_handler.rs`

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

#### Key Implementation Details

For each handler, we'll:
1. Update the function signature to accept `&AuthenticatedUser` instead of `&Uuid`
2. Replace all instances of `user_id` with `user.id` in function body
3. Leverage user attributes and organization info where applicable
4. Update database queries to filter by `user.id` instead of `user_id`

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

#### REST Endpoints
1. `/src/routes/rest/routes/metrics/get_metric.rs`
2. `/src/routes/rest/routes/metrics/get_metric_data.rs`
3. `/src/routes/rest/routes/metrics/list_metrics.rs`
4. `/src/routes/rest/routes/metrics/update_metric.rs`
5. `/src/routes/rest/routes/metrics/delete_metric.rs`
6. Other related REST endpoints that use metrics handlers

## Implementation Plan

### Phase 1: Test Updates
- ⏳ Update test utilities to support `AuthenticatedUser` creation
- ⏳ Refactor existing metric handler tests to use the new user format
- 🔜 Ensure tests properly validate authorization logic

### Phase 2: Handler Refactoring
- 🔜 Update handler function signatures to accept `AuthenticatedUser`
- 🔜 Modify internal logic to use `user.id` and leverage user context
- 🔜 Enhance permission checks using organization and team information
- 🔜 Run comprehensive tests for all changes

### Phase 3: REST Endpoint Integration
- 🔜 Update REST endpoints to pass the full user object to handlers
- 🔜 Run integration tests to ensure everything works together
- 🔜 Fix any issues that emerge during testing

### Phase 4: Documentation and Cleanup
- 🔜 Update function documentation to reflect new parameter
- 🔜 Clean up any legacy code related to user lookups
- 🔜 Final validation with all tests

## Testing Strategy

### Unit Tests
- Each refactored handler will need updated unit tests
- Tests will use the new test utilities to create mock users
- Tests should verify handling of different user roles and permissions

### Integration Tests
- End-to-end tests to validate the complete flow
- Tests for permission checks with various user types
- Verify metrics handlers work correctly with collections and dashboards

### Test Cases
1. Standard user deleting their own metric
2. Admin user deleting another user's metric
3. Regular user attempting to delete a metric they don't own
4. Bulk operations with different permission levels
5. Organization-based permission checks

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. For critical handlers, implement temporary dual-parameter support
3. Document specific issues for resolution in next attempt

## Success Criteria
- All metric handlers successfully accept `AuthenticatedUser` instead of just user ID
- All tests pass with the new implementation
- REST endpoints work correctly with refactored handlers
- No regression in functionality or performance
- Enhanced permission checks using organization and team information

## Dependencies
- Completion of the test utilities for creating mock `AuthenticatedUser` objects
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing metrics handlers implementation

## Timeline
Expected completion time: 1 week

This PRD depends on the completion of the test utilities PRD and should be implemented before other resource handlers due to having existing tests.