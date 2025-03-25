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
- Update tests to use the test utilities created in the metrics handlers PRD
- Optimize handler code to use available user context information
- Ensure tests pass with the new parameter format
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
    
    // Get the dashboard without filtering by user initially
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
    
    // Enhanced permission checking using user context
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

### Phase A: Core Dashboard Handlers (Days 1-3)
- ⏳ Update signatures and implementations of core dashboard handlers
- ⏳ Create/update tests for these handlers
- ⏳ Run tests to verify functionality
- ✅ Success criteria: All core dashboard handlers pass tests with the new parameter format

### Phase B: Dashboard Collection Management Handlers (Days 4-5)
- 🔜 Update collection management handler signatures and implementations
- 🔜 Create/update tests for these handlers
- 🔜 Run tests to verify functionality
- ✅ Success criteria: All collection management handlers pass tests with the new parameter format

### Phase C: Dashboard Sharing Handlers (Day 6)
- 🔜 Update sharing handler signatures and implementations
- 🔜 Update existing sharing tests
- 🔜 Run tests to verify functionality
- ✅ Success criteria: All sharing handlers pass tests with the new parameter format

### Phase D: REST Integration (Day 7)
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
async fn test_get_dashboard_with_owner() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization
    let org_id = Uuid::new_v4();
    
    // Create test dashboard
    let dashboard_id = Uuid::new_v4();
    let creator_id = Uuid::new_v4();
    let test_dashboard = create_test_dashboard(dashboard_id, org_id, creator_id).await?;
    insert_test_dashboard(&test_dashboard).await?;
    
    // Create test user with the new utilities - as the owner
    let user = create_test_user(
        Some(creator_id),
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
    let result = get_dashboard_handler(&dashboard_id, &user).await;
    
    // Assert success
    assert!(result.is_ok());
    // Additional assertions...
    
    // Cleanup
    cleanup_test_dashboard(dashboard_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_as_org_admin() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization
    let org_id = Uuid::new_v4();
    
    // Create test dashboard
    let dashboard_id = Uuid::new_v4();
    let creator_id = Uuid::new_v4(); // Different from admin
    let test_dashboard = create_test_dashboard(dashboard_id, org_id, creator_id).await?;
    insert_test_dashboard(&test_dashboard).await?;
    
    // Create test admin user
    let admin_user = create_test_admin_user(Some(org_id));
    
    // Test using the full user object
    let result = get_dashboard_handler(&dashboard_id, &admin_user).await;
    
    // Assert success - admin should be able to access
    assert!(result.is_ok());
    // Additional assertions...
    
    // Cleanup
    cleanup_test_dashboard(dashboard_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_unauthorized() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organizations
    let org_id = Uuid::new_v4();
    let different_org_id = Uuid::new_v4();
    
    // Create test dashboard
    let dashboard_id = Uuid::new_v4();
    let creator_id = Uuid::new_v4();
    let test_dashboard = create_test_dashboard(dashboard_id, org_id, creator_id).await?;
    test_dashboard.publicly_accessible = false; // Ensure it's not publicly accessible
    insert_test_dashboard(&test_dashboard).await?;
    
    // Create user from different organization
    let different_org_user = create_test_regular_user(Some(different_org_id));
    
    // Test using the full user object
    let result = get_dashboard_handler(&dashboard_id, &different_org_user).await;
    
    // Assert error - unauthorized
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("access"));
    
    // Cleanup
    cleanup_test_dashboard(dashboard_id).await?;
    
    Ok(())
}
```

### Test Cases

1. Owner User Tests
   - User accessing their own dashboard
   - User attempting to update their own dashboard

2. Admin User Tests
   - Admin accessing a dashboard they don't own
   - Admin updating a dashboard in their organization

3. Regular User Tests
   - User attempting to access a dashboard they don't own
   - User in wrong organization attempting access

4. Permission Tests
   - User with explicit permissions through sharing
   - User without permissions attempting access

5. Collection Management Tests
   - Adding dashboard to a collection with permission
   - Attempting to add dashboard without permission
   - Removing dashboard from a collection with permission
   - Attempting to remove dashboard without permission

### Special Focus: List_sharing_test.rs
Since there is already an existing test file for dashboard sharing, special care will be taken to update this test file:

```rust
// Update existing test for sharing listing

#[tokio::test]
async fn test_list_dashboard_sharing() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test data
    let dashboard_id = Uuid::new_v4();
    // [...existing test setup...]
    
    // Update to use new test user utilities
    let admin_user = create_test_admin_user(Some(org_id));
    
    // Test sharing listing with the AuthenticatedUser object
    let result = list_dashboard_sharing_handler(&dashboard_id, &admin_user).await;
    
    // Rest of the test remains similar
    // ...
}
```

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. Document specific issues for resolution
3. Implement a phased approach if needed, starting with less complex handlers

## Success Criteria
For this PRD to be considered fully implemented:
1. All dashboard handlers successfully accept `AuthenticatedUser` instead of just user ID
2. All tests are created or updated and pass with the new implementation
3. REST endpoints correctly pass the full user object
4. No regression in functionality or performance
5. Enhanced permission checks work correctly

## Dependencies
- Completion of the test utilities created in the metrics handlers PRD
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing dashboards handlers implementation
