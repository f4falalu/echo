# Create/Update Asset Permissions by Email PRD

## Overview
This PRD outlines the implementation of functionality to create or update asset permissions using email addresses as user identifiers within the sharing access controls system.

## Background
Users need to be able to share assets with other users by specifying their email addresses and the desired permission level. This requires enhancing the existing permission creation functionality to work with email addresses.

## Goals
- Implement a function to create or update permissions using email addresses
- Support Owner and FullAccess permission levels
- Validate inputs and handle errors appropriately
- Update existing records if permissions already exist

## Non-Goals
- Implementing UI components for sharing
- Handling organization-wide permission policies
- Supporting permission levels beyond Owner and FullAccess

## Technical Design

### Component: Enhanced Create Asset Permission Module

Enhance the existing `create_asset_permission.rs` module with a new function:

```rust
pub async fn create_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<AssetPermission> {
    // Implementation details
}
```

### Implementation Details

1. The function will first look up the user by email using the `find_user_by_email` function
2. If the user is found, it will create or update the permission record
3. If the user is not found, it will return an appropriate error
4. The function will validate that the role is either Owner or FullAccess
5. The function will use the existing `create_share` function to create or update the permission

### Permission Validation

The function should validate that:
- The role is either Owner or FullAccess
- The asset type is valid (not deprecated)
- The user has permission to share the asset (requires separate permission check)

### Error Handling

The function should handle the following error cases:
- User not found
- Invalid permission level
- Database errors
- Permission validation errors

## Testing Strategy

### Unit Tests
- Test creating a new permission
- Test updating an existing permission
- Test handling a non-existent user
- Test permission validation

### Integration Tests
- Test the function in combination with permission checking

## Dependencies
- User lookup module
- Existing create_share function
- Database models and schema
- Diesel ORM
- Error handling utilities

## Implementation Plan
1. Enhance the `create_asset_permission.rs` file
2. Implement the `create_share_by_email` function
3. Add validation and error handling
4. Write tests
5. Update the library exports in `lib.rs`

## Success Criteria
- Function correctly creates or updates permissions using email addresses
- Appropriate validation and error handling is implemented
- Tests pass successfully
- Code is well-documented

## Permission Requirements
- Requires Owner or FullAccess permission to execute
