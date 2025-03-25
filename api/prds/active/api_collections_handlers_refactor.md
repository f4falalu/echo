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
- Update tests to use the test utilities created in the metrics handlers PRD
- Optimize handler code to use available user context information
- Ensure tests pass with the new parameter format
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
Any test files that use collection handlers will need to be updated to use the test utilities.

## Implementation Plan

### Phase A: Core Collection Handlers (Days 1-3)
- ⏳ Update signatures and implementations of core collection handlers
- ⏳ Create/update tests for these handlers
- ⏳ Run tests to verify functionality
- ✅ Success criteria: All core collection handlers pass tests with the new parameter format

### Phase B: Collection Asset Management Handlers (Days 4-5)
- 🔜 Update asset management handler signatures and implementations
- 🔜 Create/update tests for these handlers
- 🔜 Run tests to verify functionality
- ✅ Success criteria: All asset management handlers pass tests with the new parameter format

### Phase C: Collection Sharing Handlers (Day 6)
- 🔜 Update sharing handler signatures and implementations
- 🔜 Create/update tests for these handlers
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
async fn test_get_collection_with_owner() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization
    let org_id = Uuid::new_v4();
    
    // Create test collection
    let collection_id = Uuid::new_v4();
    let creator_id = Uuid::new_v4();
    let test_collection = create_test_collection(collection_id, org_id, creator_id).await?;
    insert_test_collection(&test_collection).await?;
    
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
    let result = get_collection_handler(&collection_id, &user).await;
    
    // Assert success
    assert!(result.is_ok());
    // Additional assertions...
    
    // Cleanup
    cleanup_test_collection(collection_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_get_collection_as_org_admin() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization
    let org_id = Uuid::new_v4();
    
    // Create test collection
    let collection_id = Uuid::new_v4();
    let creator_id = Uuid::new_v4(); // Different from admin
    let test_collection = create_test_collection(collection_id, org_id, creator_id).await?;
    insert_test_collection(&test_collection).await?;
    
    // Create test admin user
    let admin_user = create_test_admin_user(Some(org_id));
    
    // Test using the full user object
    let result = get_collection_handler(&collection_id, &admin_user).await;
    
    // Assert success - admin should be able to access
    assert!(result.is_ok());
    // Additional assertions...
    
    // Cleanup
    cleanup_test_collection(collection_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_get_collection_unauthorized() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organizations
    let org_id = Uuid::new_v4();
    let different_org_id = Uuid::new_v4();
    
    // Create test collection
    let collection_id = Uuid::new_v4();
    let creator_id = Uuid::new_v4();
    let test_collection = create_test_collection(collection_id, org_id, creator_id).await?;
    test_collection.publicly_accessible = false; // Ensure it's not publicly accessible
    insert_test_collection(&test_collection).await?;
    
    // Create user from different organization
    let different_org_user = create_test_regular_user(Some(different_org_id));
    
    // Test using the full user object
    let result = get_collection_handler(&collection_id, &different_org_user).await;
    
    // Assert error - unauthorized
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("access"));
    
    // Cleanup
    cleanup_test_collection(collection_id).await?;
    
    Ok(())
}
```

### Test Cases

1. Owner User Tests
   - User accessing their own collection
   - User attempting to update their own collection

2. Admin User Tests
   - Admin accessing a collection they don't own
   - Admin updating a collection in their organization

3. Regular User Tests
   - User attempting to access a collection they don't own
   - User in wrong organization attempting access

4. Permission Tests
   - User with explicit permissions through sharing
   - User without permissions attempting access

5. Asset Management Tests
   - Adding assets to a collection with permission
   - Attempting to add assets without permission
   - Removing assets with permission
   - Attempting to remove assets without permission

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. Document specific issues for resolution
3. Implement a phased approach if needed, starting with less complex handlers

## Success Criteria
For this PRD to be considered fully implemented:
1. All collection handlers successfully accept `AuthenticatedUser` instead of just user ID
2. All tests are created or updated and pass with the new implementation
3. REST endpoints correctly pass the full user object
4. No regression in functionality or performance
5. Enhanced permission checks work correctly

## Dependencies
- Completion of the test utilities created in the metrics handlers PRD
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing collections handlers implementation

