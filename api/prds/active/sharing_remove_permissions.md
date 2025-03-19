# Remove Asset Permissions by Email PRD

## Overview
This PRD outlines the implementation of functionality to remove asset permissions using email addresses as user identifiers within the sharing access controls system.

## Background
Users need to be able to revoke access to assets from other users by specifying their email addresses. This requires enhancing the existing permission removal functionality to work with email addresses.

## Goals
- Implement a function to remove permissions using email addresses
- Soft delete the permission record (set deleted_at to current time)
- Validate inputs and handle errors appropriately
- Ensure proper permission checks

## Non-Goals
- Implementing UI components for permission removal
- Hard deleting permission records
- Batch removal operations

## Technical Design

### Component: Enhanced Remove Asset Permissions Module

Enhance the existing `remove_asset_permissions.rs` module with a new function:

```rust
pub async fn remove_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    updated_by: Uuid,
) -> Result<()> {
    // Implementation details
}
```

### Implementation Details

1. The function will first look up the user by email using the `find_user_by_email` function
2. If the user is found, it will soft delete the permission record
3. If the user is not found, it will return an appropriate error
4. The function will validate that the caller has permission to remove shares (Owner or FullAccess)
5. The function will use a database update to set the deleted_at field to the current time

### Database Update

The function will use the following update pattern:

```rust
diesel::update(asset_permissions::table)
    .filter(asset_permissions::identity_id.eq(user_id))
    .filter(asset_permissions::identity_type.eq(IdentityType::User))
    .filter(asset_permissions::asset_id.eq(asset_id))
    .filter(asset_permissions::asset_type.eq(asset_type))
    .filter(asset_permissions::deleted_at.is_null())
    .set((
        asset_permissions::deleted_at.eq(Utc::now()),
        asset_permissions::updated_at.eq(Utc::now()),
        asset_permissions::updated_by.eq(updated_by),
    ))
    .execute(&mut conn)
    .await
```

### Error Handling

The function should handle the following error cases:
- User not found
- Permission record not found
- Database errors
- Permission validation errors

## Testing Strategy

### Unit Tests
- Test removing an existing permission
- Test handling a non-existent user
- Test handling a non-existent permission
- Test permission validation

### Integration Tests
- Test the function in combination with permission creation and checking

## Dependencies
- User lookup module
- Database models and schema
- Diesel ORM
- Error handling utilities

## Implementation Plan
1. ✅ Enhance the `remove_asset_permissions.rs` file
2. ✅ Implement the `remove_share_by_email` function
3. ✅ Add validation and error handling
4. ✅ Write tests
5. ✅ Update the library exports in `lib.rs`

## Success Criteria
- ✅ Function correctly removes permissions using email addresses
- ✅ Appropriate validation and error handling is implemented
- ✅ Tests pass successfully
- ✅ Code is well-documented

## Permission Requirements
- Requires Owner or FullAccess permission to execute
