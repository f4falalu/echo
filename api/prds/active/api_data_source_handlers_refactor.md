# Data Source Handlers Authentication Refactor

## Overview
This PRD outlines the plan to refactor all data source handlers in `libs/handlers/src/data_sources/` to accept the complete `AuthenticatedUser` object instead of just the `user_id` parameter.

## Problem Statement
Currently, data source handlers accept only a user ID (`Uuid`) as the user parameter. This approach has several limitations:

1. It lacks rich user context information such as organization memberships and roles
2. It requires additional database lookups to fetch user data within handlers
3. It doesn't align with the REST endpoints which already use the `AuthenticatedUser` type from middleware

By refactoring these handlers to accept the complete `AuthenticatedUser` object, we will:
- Improve code efficiency by reducing redundant database queries
- Enhance security by making permission checks more comprehensive
- Increase consistency across the codebase
- Improve test reliability with standardized test user fixtures

## Goals
- Update all data source handlers to use `AuthenticatedUser` instead of user ID
- Ensure tests continue to pass with the new parameter format
- Optimize handler code to use available user context information
- Maintain backward compatibility with existing functionality

## Non-Goals
- Changing the business logic of the data source handlers
- Modifying database schemas
- Adding new features to data source handlers
- Changing the API contract between handlers and consumers

## Technical Design

### Overview
The refactoring will involve updating function signatures across all data source handlers to accept `&AuthenticatedUser` instead of `&Uuid`, and then modifying the internal logic to use `user.id` instead of `user_id` where appropriate. We'll also leverage additional user information to optimize certain operations.

### Components to Modify

#### Data Source Handlers
1. `get_data_source_handler.rs`
2. `list_data_sources_handler.rs`
3. `update_data_source_handler.rs`

#### Example Function Signature Changes

```rust
// Before
pub async fn get_data_source_handler(data_source_id: &Uuid, user_id: &Uuid) -> Result<DataSourceResponse> {
    // ...
}

// After
pub async fn get_data_source_handler(data_source_id: &Uuid, user: &AuthenticatedUser) -> Result<DataSourceResponse> {
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

#### Example Implementation (for get_data_source_handler.rs)

```rust
// Before
pub async fn get_data_source_handler(data_source_id: &Uuid, user_id: &Uuid) -> Result<DataSourceResponse> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the data source
    let data_source = data_sources::table
        .filter(data_sources::id.eq(data_source_id))
        .filter(data_sources::created_by.eq(user_id))
        .first::<DataSource>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Data source not found or you don't have access"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Additional logic...
    
    Ok(DataSourceResponse::from(data_source))
}

// After
pub async fn get_data_source_handler(data_source_id: &Uuid, user: &AuthenticatedUser) -> Result<DataSourceResponse> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the data source with enhanced permission checking
    let data_source = data_sources::table
        .filter(data_sources::id.eq(data_source_id))
        .first::<DataSource>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Data source not found"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Check user permissions with enhanced context
    if data_source.created_by != user.id {
        // Check if user is an admin of the data source's organization
        let is_org_admin = user.organizations.iter()
            .any(|org| org.id == data_source.organization_id && 
                 (org.role == UserOrganizationRole::Admin || org.role == UserOrganizationRole::Owner));
        
        if !is_org_admin {
            return Err(anyhow!("You don't have access to this data source"));
        }
    }
    
    // Additional logic...
    
    Ok(DataSourceResponse::from(data_source))
}
```

### REST Endpoint Changes

REST endpoints will need minimal changes:

```rust
// Before
pub async fn get_data_source_route(
    Path(data_source_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<DataSourceResponse>, ApiError> {
    match get_data_source_handler(&data_source_id, &user.id).await {
        // ...
    }
}

// After
pub async fn get_data_source_route(
    Path(data_source_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<DataSourceResponse>, ApiError> {
    match get_data_source_handler(&data_source_id, &user).await {
        // ...
    }
}
```

### Files to Modify

#### Handler Files
1. `/libs/handlers/src/data_sources/get_data_source_handler.rs`
2. `/libs/handlers/src/data_sources/list_data_sources_handler.rs`
3. `/libs/handlers/src/data_sources/update_data_source_handler.rs`

#### REST Endpoints
1. `/src/routes/rest/routes/data_sources/get_data_source.rs`
2. `/src/routes/rest/routes/data_sources/list_data_sources.rs`
3. `/src/routes/rest/routes/data_sources/update_data_source.rs`

## Implementation Plan

### Phase 1: Handler Refactoring
- ⏳ Update signature and implementation of all data source handlers
- ⏳ Modify internal logic to use the user object for enhanced permission checks
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
1. User accessing their own data source
2. User attempting to access a data source they don't own
3. Admin user accessing data sources in their organization
4. User from a different organization attempting to access a data source

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. Document specific issues for resolution in next attempt

## Success Criteria
- All data source handlers successfully accept `AuthenticatedUser` instead of just user ID
- All tests pass with the new implementation
- REST endpoints work correctly with refactored handlers
- No regression in functionality or performance
- Enhanced permission checks using organization information

## Dependencies
- Completion of the test utilities for creating mock `AuthenticatedUser` objects
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing data source handlers implementation

## Timeline
Expected completion time: 2-3 days

This PRD depends on the completion of the test utilities PRD and can be implemented in parallel with other handler refactorings.