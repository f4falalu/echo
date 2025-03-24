# Dashboards Handlers Authentication Refactor

## Overview
This PRD outlines the plan to refactor all dashboard handlers in `libs/handlers/src/dashboards/` to accept the complete `AuthenticatedUser` object instead of just the `user_id` parameter.

## Problem Statement
Currently, dashboard handlers accept only a user ID (`Uuid`) as the user parameter. This approach has several limitations:

1. It lacks rich user context information such as organization memberships and roles
2. It requires additional database lookups to fetch user data within handlers
3. It doesn't align with the REST endpoints which already use the `AuthenticatedUser` type from middleware

By refactoring these handlers to accept the complete `AuthenticatedUser` object, we will:
- Improve code efficiency by reducing redundant database queries
- Enhance security by making permission checks more comprehensive
- Increase consistency across the codebase
- Improve test reliability with standardized test user fixtures

## Goals
- Update all dashboard handlers to use `AuthenticatedUser` instead of user ID
- Ensure tests continue to pass with the new parameter format
- Optimize handler code to use available user context information
- Maintain backward compatibility with existing functionality

## Non-Goals
- Changing the business logic of the dashboard handlers
- Modifying database schemas
- Adding new features to dashboard handlers
- Changing the API contract between handlers and consumers

## Technical Design

### Overview
The refactoring will involve updating function signatures across all dashboard handlers to accept `&AuthenticatedUser` instead of `&Uuid`, and then modifying the internal logic to use `user.id` instead of `user_id` where appropriate. We'll also leverage additional user information to optimize certain operations.

### Components to Modify

#### Dashboard Core Handlers
1. `create_dashboard_handler.rs`
2. `get_dashboard_handler.rs`
3. `list_dashboard_handler.rs`
4. `update_dashboard_handler.rs`
5. `delete_dashboard_handler.rs`

#### Dashboard Collection Management Handlers
1. `add_dashboard_to_collections_handler.rs`
2. `remove_dashboard_from_collections_handler.rs`

#### Dashboard Sharing Handlers
1. `sharing/create_sharing_handler.rs`
2. `sharing/list_sharing_handler.rs`
3. `sharing/update_sharing_handler.rs`
4. `sharing/delete_sharing_handler.rs`

#### Example Function Signature Changes

```rust
// Before
pub async fn get_dashboard_handler(dashboard_id: &Uuid, user_id: &Uuid) -> Result<DashboardResponse> {
    // ...
}

// After
pub async fn get_dashboard_handler(dashboard_id: &Uuid, user: &AuthenticatedUser) -> Result<DashboardResponse> {
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

#### Example Implementation (for get_dashboard_handler.rs)

```rust
// Before
pub async fn get_dashboard_handler(dashboard_id: &Uuid, user_id: &Uuid) -> Result<DashboardResponse> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the dashboard
    let dashboard = dashboard_files::table
        .filter(dashboard_files::id.eq(dashboard_id))
        .filter(dashboard_files::created_by.eq(user_id).or(dashboard_files::publicly_accessible.eq(true)))
        .filter(dashboard_files::deleted_at.is_null())
        .first::<DashboardFile>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Dashboard not found or you don't have access"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Additional logic...
    
    Ok(DashboardResponse::from(dashboard))
}

// After
pub async fn get_dashboard_handler(dashboard_id: &Uuid, user: &AuthenticatedUser) -> Result<DashboardResponse> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the dashboard with enhanced permission checking
    let dashboard = dashboard_files::table
        .filter(dashboard_files::id.eq(dashboard_id))
        .filter(dashboard_files::deleted_at.is_null())
        .first::<DashboardFile>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Dashboard not found"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Check user permissions with enhanced context
    if dashboard.created_by != user.id && !dashboard.publicly_accessible {
        // Check if user is an admin of the dashboard's organization
        let is_org_admin = user.organizations.iter()
            .any(|org| org.id == dashboard.organization_id && 
                 (org.role == UserOrganizationRole::Admin || org.role == UserOrganizationRole::Owner));
        
        if !is_org_admin {
            // Check for explicit dashboard permissions
            let has_permission = check_dashboard_permission(&dashboard_id, &user.id, &mut conn).await?;
            
            if !has_permission {
                return Err(anyhow!("You don't have access to this dashboard"));
            }
        }
    }
    
    // Additional logic...
    
    Ok(DashboardResponse::from(dashboard))
}
```

### REST Endpoint Changes

REST endpoints will need minimal changes:

```rust
// Before
pub async fn get_dashboard_route(
    Path(dashboard_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<DashboardResponse>, ApiError> {
    match get_dashboard_handler(&dashboard_id, &user.id).await {
        // ...
    }
}

// After
pub async fn get_dashboard_route(
    Path(dashboard_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<DashboardResponse>, ApiError> {
    match get_dashboard_handler(&dashboard_id, &user).await {
        // ...
    }
}
```

### Files to Modify

#### Handler Files
1. `/libs/handlers/src/dashboards/create_dashboard_handler.rs`
2. `/libs/handlers/src/dashboards/get_dashboard_handler.rs`
3. `/libs/handlers/src/dashboards/list_dashboard_handler.rs`
4. `/libs/handlers/src/dashboards/update_dashboard_handler.rs`
5. `/libs/handlers/src/dashboards/delete_dashboard_handler.rs`
6. `/libs/handlers/src/dashboards/add_dashboard_to_collections_handler.rs`
7. `/libs/handlers/src/dashboards/remove_dashboard_from_collections_handler.rs`
8. `/libs/handlers/src/dashboards/sharing/create_sharing_handler.rs`
9. `/libs/handlers/src/dashboards/sharing/list_sharing_handler.rs`
10. `/libs/handlers/src/dashboards/sharing/update_sharing_handler.rs`
11. `/libs/handlers/src/dashboards/sharing/delete_sharing_handler.rs`

#### Tests
1. `/libs/handlers/tests/dashboards/list_sharing_test.rs`
2. Any other existing dashboard handler tests

#### REST Endpoints
1. `/src/routes/rest/routes/dashboards/create_dashboard.rs`
2. `/src/routes/rest/routes/dashboards/get_dashboard.rs`
3. `/src/routes/rest/routes/dashboards/list_dashboards.rs`
4. `/src/routes/rest/routes/dashboards/update_dashboard.rs`
5. `/src/routes/rest/routes/dashboards/delete_dashboard.rs`
6. Other related REST endpoints for collection management and sharing

## Implementation Plan

### Phase 1: Core Dashboard Handlers
- ⏳ Update signature and implementation of core dashboard handlers
- ⏳ Modify internal logic to use the user object for enhanced permission checks
- 🔜 Update tests to use the new test utilities

### Phase 2: Collection Management Handlers
- 🔜 Update collection management handler signatures
- 🔜 Modify internal logic to use the user object
- 🔜 Run tests to validate the changes

### Phase 3: Sharing Handlers
- 🔜 Update sharing handler signatures
- 🔜 Modify internal logic to use the user object
- 🔜 Update existing sharing tests
- 🔜 Run tests to validate the changes

### Phase 4: REST Endpoint Integration
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
- Verify dashboards handlers work correctly with collections

### Test Cases
1. User creating a new dashboard
2. User accessing their own dashboard
3. User attempting to access a dashboard they don't own or have permission for
4. Admin user accessing dashboards in their organization
5. Dashboard sharing operations with different permission levels
6. Dashboard collection management with different permission levels

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. For critical handlers, implement temporary dual-parameter support
3. Document specific issues for resolution in next attempt

## Success Criteria
- All dashboard handlers successfully accept `AuthenticatedUser` instead of just user ID
- All tests pass with the new implementation
- REST endpoints work correctly with refactored handlers
- No regression in functionality or performance
- Enhanced permission checks using organization and team information

## Dependencies
- Completion of the test utilities for creating mock `AuthenticatedUser` objects
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing dashboards handlers implementation
- Completion of collections handlers refactoring (since dashboards interact closely with collections)

## Timeline
Expected completion time: 1 week

This PRD depends on the completion of the test utilities PRD and collections handlers refactoring, and should be implemented after those are completed.