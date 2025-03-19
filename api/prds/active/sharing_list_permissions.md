# List Asset Permissions PRD

## Overview
This PRD outlines the implementation of functionality to list all permissions for a given asset within the sharing access controls system.

## Background
Users need to be able to view who has access to an asset and what level of permission they have. This requires enhancing the existing permission listing functionality.

## Goals
- Implement a function to list all permissions for an asset
- Include user information in the results
- Support filtering by permission types
- Handle pagination if needed

## Non-Goals
- Implementing UI components for displaying permissions
- Listing permissions across multiple assets
- Complex search or filtering beyond basic permission types

## Technical Design

### Component: Enhanced List Asset Permissions Module

Enhance the existing `list_asset_permissions.rs` module with a new function:

```rust
pub async fn list_shares(
    asset_id: Uuid,
    asset_type: AssetType,
) -> Result<Vec<AssetPermissionWithUser>> {
    // Implementation details
}
```

### Data Structure

Create a new struct to represent a permission with user information:

```rust
pub struct AssetPermissionWithUser {
    pub permission: AssetPermission,
    pub user: Option<UserInfo>,
}

pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}
```

### Implementation Details

1. The function will query the database to find all permissions for the given asset
2. It will join with the users table to include user information
3. It will filter out soft-deleted permissions
4. It will return a list of permissions with user information

### Database Query

The function will use the following query pattern:

```rust
asset_permissions::table
    .inner_join(users::table.on(asset_permissions::identity_id.eq(users::id)))
    .filter(asset_permissions::asset_id.eq(asset_id))
    .filter(asset_permissions::asset_type.eq(asset_type))
    .filter(asset_permissions::deleted_at.is_null())
    .select((
        asset_permissions::all_columns,
        users::id,
        users::email,
        users::name,
        users::avatar_url,
    ))
    .load::<(AssetPermission, Uuid, String, Option<String>, Option<String>)>(&mut conn)
    .await
```

### Error Handling

The function should handle the following error cases:
- Database connection errors
- Query execution errors
- Invalid asset ID or type

## Testing Strategy

### Unit Tests
- Test listing permissions for an asset with permissions
- Test listing permissions for an asset without permissions
- Test error handling for database issues

### Integration Tests
- Test the function in combination with permission creation and removal

## Dependencies
- Database models and schema
- Diesel ORM
- Error handling utilities

## Implementation Plan
1. Enhance the `list_asset_permissions.rs` file
2. Create the necessary data structures
3. Implement the `list_shares` function
4. Add error handling
5. Write tests
6. Update the library exports in `lib.rs`

## Success Criteria
- Function correctly lists permissions for an asset
- User information is included in the results
- Appropriate error handling is implemented
- Tests pass successfully
- Code is well-documented

## Permission Requirements
- Available to all permission levels
