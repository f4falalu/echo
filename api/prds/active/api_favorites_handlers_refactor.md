# Favorites Handlers Authentication Refactor

## Overview
This PRD outlines the plan to refactor all favorites handlers in `libs/handlers/src/favorites/` to accept the complete `AuthenticatedUser` object instead of just the `user_id` parameter.

## Problem Statement
Currently, favorites handlers accept only a user ID (`Uuid`) as the user parameter. This approach has several limitations:

1. It lacks rich user context information such as organization memberships and roles
2. It requires additional database lookups to fetch user data within handlers
3. It doesn't align with the REST endpoints which already use the `AuthenticatedUser` type from middleware

By refactoring these handlers to accept the complete `AuthenticatedUser` object, we will:
- Improve code efficiency by reducing redundant database queries
- Enhance security by making permission checks more comprehensive
- Increase consistency across the codebase
- Improve test reliability with standardized test user fixtures

## Goals
- Update all favorites handlers to use `AuthenticatedUser` instead of user ID
- Ensure tests continue to pass with the new parameter format
- Optimize handler code to use available user context information
- Maintain backward compatibility with existing functionality

## Non-Goals
- Changing the business logic of the favorites handlers
- Modifying database schemas
- Adding new features to favorites handlers
- Changing the API contract between handlers and consumers

## Technical Design

### Overview
The refactoring will involve updating function signatures across all favorites handlers to accept `&AuthenticatedUser` instead of `&Uuid`, and then modifying the internal logic to use `user.id` instead of `user_id` where appropriate.

### Components to Modify

#### Favorites Handlers
1. `list_favorites.rs`
2. `create_favorite.rs`
3. `update_favorites.rs`
4. `delete_favorite.rs`
5. `favorites_utils.rs` (if it contains any user-related functions)

#### Example Function Signature Changes

```rust
// Before
pub async fn list_favorites_handler(user_id: &Uuid) -> Result<Vec<FavoriteResponse>> {
    // ...
}

// After
pub async fn list_favorites_handler(user: &AuthenticatedUser) -> Result<Vec<FavoriteResponse>> {
    // ...
}
```

#### Key Implementation Details

For each handler, we'll:
1. Update the function signature to accept `&AuthenticatedUser` instead of `&Uuid`
2. Replace all instances of `user_id` with `user.id` in function body
3. Update database queries to filter by `user.id` instead of `user_id`

#### Example Implementation (for list_favorites.rs)

```rust
// Before
pub async fn list_favorites_handler(user_id: &Uuid) -> Result<Vec<FavoriteResponse>> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get all favorites for this user
    let favorites = user_favorites::table
        .filter(user_favorites::user_id.eq(user_id))
        .filter(user_favorites::deleted_at.is_null())
        .order_by(user_favorites::updated_at.desc())
        .load::<UserFavorite>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to load favorites: {}", e))?;
    
    // Convert to response format
    let responses = favorites.into_iter()
        .map(FavoriteResponse::from)
        .collect();
    
    Ok(responses)
}

// After
pub async fn list_favorites_handler(user: &AuthenticatedUser) -> Result<Vec<FavoriteResponse>> {
    let mut conn = get_pg_pool().get().await?;
    
    // Get all favorites for this user
    let favorites = user_favorites::table
        .filter(user_favorites::user_id.eq(user.id))
        .filter(user_favorites::deleted_at.is_null())
        .order_by(user_favorites::updated_at.desc())
        .load::<UserFavorite>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to load favorites: {}", e))?;
    
    // Convert to response format
    let responses = favorites.into_iter()
        .map(FavoriteResponse::from)
        .collect();
    
    Ok(responses)
}
```

### REST Endpoint Changes

REST endpoints will need minimal changes:

```rust
// Before
pub async fn list_favorites_route(
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<Vec<FavoriteResponse>>, ApiError> {
    match list_favorites_handler(&user.id).await {
        // ...
    }
}

// After
pub async fn list_favorites_route(
    Extension(user): Extension<AuthenticatedUser>
) -> Result<ApiResponse<Vec<FavoriteResponse>>, ApiError> {
    match list_favorites_handler(&user).await {
        // ...
    }
}
```

### Files to Modify

#### Handler Files
1. `/libs/handlers/src/favorites/list_favorites.rs`
2. `/libs/handlers/src/favorites/create_favorite.rs`
3. `/libs/handlers/src/favorites/update_favorites.rs`
4. `/libs/handlers/src/favorites/delete_favorite.rs`
5. `/libs/handlers/src/favorites/favorites_utils.rs` (if applicable)

#### REST Endpoints
1. `/src/routes/rest/routes/users/favorites/list_favorites.rs`
2. `/src/routes/rest/routes/users/favorites/create_favorite.rs`
3. `/src/routes/rest/routes/users/favorites/update_favorites.rs`
4. `/src/routes/rest/routes/users/favorites/delete_favorite.rs`

## Implementation Plan

### Phase 1: Handler Refactoring
- ⏳ Update signature and implementation of all favorites handlers
- ⏳ Modify any utility functions that use user ID
- 🔜 Run tests to validate the changes

### Phase 2: REST Endpoint Integration
- 🔜 Update REST endpoints to pass the full user object
- 🔜 Run integration tests to ensure everything works together
- 🔜 Fix any issues that emerge during testing

## Testing Strategy

### Unit Tests
- Each refactored handler will need updated tests
- Tests will use the new test utilities to create mock users

### Integration Tests
- End-to-end tests to validate the complete flow
- Verify favorites operations for different user types

### Test Cases
1. User listing their favorites
2. User creating a new favorite
3. User updating their favorites
4. User deleting a favorite
5. Verifying that users can only access their own favorites

## Rollback Plan
If issues arise during implementation:
1. Revert affected handlers to original implementation
2. Document specific issues for resolution in next attempt

## Success Criteria
- All favorites handlers successfully accept `AuthenticatedUser` instead of just user ID
- All tests pass with the new implementation
- REST endpoints work correctly with refactored handlers
- No regression in functionality or performance

## Dependencies
- Completion of the test utilities for creating mock `AuthenticatedUser` objects
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Existing favorites handlers implementation

## Timeline
Expected completion time: 1-2 days

This PRD depends on the completion of the test utilities PRD and can be implemented in parallel with other handler refactorings.