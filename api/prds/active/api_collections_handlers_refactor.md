# Collections Handlers Authentication Refactor

## Overview
This PRD outlines the plan to refactor all collection handlers in `libs/handlers/src/collections/` to accept the complete `AuthenticatedUser` object instead of just the `user_id` parameter.

## Problem Statement
Currently, collection handlers accept only a user ID (`Uuid`) as the user parameter. This approach has several limitations:

1. It lacks rich user context information such as organization memberships and roles
2. It requires additional database lookups to fetch user data within handlers
3. It doesn't align with the REST endpoints which already use the `AuthenticatedUser` type from middleware

By refactoring these handlers to accept the complete `AuthenticatedUser` object, we will:
- Improve code efficiency by reducing redundant database queries
- Enhance security by making permission checks more comprehensive
- Increase consistency across the codebase
- Improve test reliability with standardized test user fixtures

## Goals
- Update all collection handlers to use `AuthenticatedUser` instead of user ID
- Ensure tests continue to pass with the new parameter format
- Optimize handler code to use available user context information
- Maintain backward compatibility with existing functionality

## Non-Goals
- Changing the business logic of the collection handlers
- Modifying database schemas
- Adding new features to collection handlers
- Changing the API contract between handlers and consumers

## Technical Design

### Overview
The refactoring will involve updating function signatures across all collection handlers to accept `&AuthenticatedUser` instead of `&Uuid`, and then modifying the internal logic to use `user.id` instead of `user_id` where appropriate. We'll also leverage additional user information to optimize certain operations.

### Components to Modify

#### Collection Core Handlers
1. `create_collection_handler.rs`
2. `get_collection_handler.rs`
3. `list_collections_handler.rs`
4. `update_collection_handler.rs`
5. `delete_collection_handler.rs`

#### Collection Asset Management Handlers
1. `add_assets_to_collection_handler.rs`
2. `add_dashboards_to_collection_handler.rs`
3. `remove_assets_from_collection_handler.rs`
4. `remove_metrics_from_collection_handler.rs`

#### Collection Sharing Handlers
1. `sharing/create_sharing_handler.rs`
2. `sharing/list_sharing_handler.rs`
3. `sharing/update_sharing_handler.rs`
4. `sharing/delete_sharing_handler.rs`

#### Example Function Signature Changes

```rust
// Before
pub async fn get_collection_handler(collection_id: &Uuid, user_id: &Uuid) -> Result<CollectionResponse> {
    // ...
}

// After
pub async fn get_collection_handler(collection_id: &Uuid, user: &AuthenticatedUser) -> Result<CollectionResponse> {
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

#### Example Implementation (for get_collection_handler.rs)

```rust
// Before
pub async fn get_collection_handler(collection_id: &Uuid, user_id: &Uuid) -> Result<CollectionResponse> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the collection
    let collection = collections::table
        .filter(collections::id.eq(collection_id))
        .filter(collections::created_by.eq(user_id).or(collections::publicly_accessible.eq(true)))
        .filter(collections::deleted_at.is_null())
        .first::<Collection>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Collection not found or you don't have access"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Additional logic...
    
    Ok(CollectionResponse::from(collection))
}

// After
pub async fn get_collection_handler(collection_id: &Uuid, user: &AuthenticatedUser) -> Result<CollectionResponse> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get the collection with enhanced permission checking
    let collection = collections::table
        .filter(collections::id.eq(collection_id))
        .filter(collections::deleted_at.is_null())
        .first::<Collection>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => 
                anyhow!("Collection not found"),
            _ => anyhow!("Database error: {}", e),
        })?;
    
    // Check user permissions with enhanced context
    if collection.created_by != user.id && !collection.publicly_accessible {
        // Check if user is an admin of the collection's organization
        let is_org_admin = user.organizations.iter()
            .any(|org| org.id == collection.organization_id && 
                 (org.role == UserOrganizationRole::Admin || org.role == UserOrganizationRole::Owner));
        
        if !is_org_admin {
            // Check for explicit collection permissions
            let has_permission = check_collection_permission(&collection_id, &user.id, &mut conn).await?;
            
            if !has_permission {
                return Err(anyhow!("You don't have access to this collection"));
            }
        }
    }
    
    // Additional logic...
    
    Ok(CollectionResponse::from(collection))
}
```

### REST Endpoint Changes

REST endpoints will need minimal changes:

```rust
// Before
pub async fn get_collection_route(
    Path(collection_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<CollectionResponse>, ApiError> {
    match get_collection_handler(&collection_id, &user.id).await {
        // ...
    }
}

// After
pub async fn get_collection_route(
    Path(collection_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<CollectionResponse>, ApiError> {
    match get_collection_handler(&collection_id, &user).await {
        // ...
    }
}
```

### Files to Modify

#### Handler Files
1. `/libs/handlers/src/collections/create_collection_handler.rs`
2. `/libs/handlers/src/collections/get_collection_handler.rs`
3. `/libs/handlers/src/collections/list_collections_handler.rs`
4. `/libs/handlers/src/collections/update_collection_handler.rs`
5. `/libs/handlers/src/collections/delete_collection_handler.rs`
6. `/libs/handlers/src/collections/add_assets_to_collection_handler.rs`
7. `/libs/handlers/src/collections/add_dashboards_to_collection_handler.rs`
8. `/libs/handlers/src/collections/remove_assets_from_collection_handler.rs`
9. `/libs/handlers/src/collections/remove_metrics_from_collection_handler.rs`
10. `/libs/handlers/src/collections/sharing/create_sharing_handler.rs`
11. `/libs/handlers/src/collections/sharing/list_sharing_handler.rs`
12. `/libs/handlers/src/collections/sharing/update_sharing_handler.rs`
13. `/libs/handlers/src/collections/sharing/delete_sharing_handler.rs`

#### REST Endpoints
1. `/src/routes/rest/routes/collections/create_collection.rs`
2. `/src/routes/rest/routes/collections/get_collection.rs`
3. `/src/routes/rest/routes/collections/list_collections.rs`
4. `/src/routes/rest/routes/collections/update_collection.rs`
5. `/src/routes/rest/routes/collections/delete_collection.rs`
6. Other related REST endpoints for asset management and sharing

#### Tests
Any tests that use the collection handlers will need to be updated.

## Implementation Plan

### Phase 1: Core Collection Handlers
- ⏳ Update signature and implementation of core collection handlers
- ⏳ Modify internal logic to use the user object for enhanced permission checks
- 🔜 Run tests to validate the changes

### Phase 2: Asset Management Handlers
- 🔜 Update asset management handler signatures
- 🔜 Modify internal logic to use the user object
- 🔜 Run tests to validate the changes

### Phase 3: Sharing Handlers
- 🔜 Update sharing handler signatures
- 🔜 Modify internal logic to use the user object
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
- Verify collections handlers work correctly with related assets

### Test Cases
1. User creating a new collection
2. User accessing their own collection
3. User attempting to access a collection they don't own or have permission for
4. Admin user accessing collections in their organization
5. Adding/removing assets with different permission levels

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. For critical handlers, implement temporary dual-parameter support
3. Document specific issues for resolution in next attempt

## Success Criteria
- All collection handlers successfully accept `AuthenticatedUser` instead of just user ID
- All tests pass with the new implementation
- REST endpoints work correctly with refactored handlers
- No regression in functionality or performance
- Enhanced permission checks using organization and team information

## Dependencies
- Completion of the test utilities for creating mock `AuthenticatedUser` objects
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing collections handlers implementation

## Timeline
Expected completion time: 1 week

This PRD depends on the completion of the test utilities PRD and should be implemented after the chat and metrics handlers refactoring.