# Sharing Access Controls PRD

## Overview
This PRD outlines the implementation of sharing access controls for assets within the system. The sharing functionality will allow users to grant permissions to other users for specific assets, manage those permissions, and check access rights.

## Background
The system needs a robust permission system to control access to various assets. Each asset has an owner and can be shared with other users with different permission levels. The sharing functionality will be implemented in the `libs/sharing` library.

## Goals
- ✅ Implement a modular, testable sharing access control system
- ✅ Support creating, updating, removing, and listing asset permissions
- ✅ Enable permission checks for assets
- ✅ Provide email-based user lookup for sharing functionality

## Non-Goals
- Implementing UI components for sharing
- Handling organization-wide permission policies
- Implementing batch operations beyond what's specified

## Technical Design

The implementation will be divided into the following components:

### 1. User Lookup by Email ✅

Create a module to look up users by their email addresses, which will be used when sharing assets with users via email.

### 2. Create/Update Asset Permissions ✅

Implement functionality to create or update permissions for a user on an asset, using email address as the identifier.

### 3. Remove Asset Permissions ✅

Implement functionality to remove a user's permissions for an asset, using email address as the identifier.

### 4. List Asset Permissions ✅

Implement functionality to list all permissions for a given asset.

### 5. Check Asset Permissions ✅

Implement functionality to check if a user has the required permission level for an asset.

## Detailed Requirements

### 1. User Lookup by Email ✅

**Ticket: Implement User Lookup by Email**

- ✅ Create a `user_lookup.rs` module in the sharing library
- ✅ Implement a function to find a user by email address
- ✅ Return the user ID and other relevant information
- ✅ Handle cases where the user doesn't exist
- ✅ Ensure proper error handling

```rust
// Function signature
pub async fn find_user_by_email(email: &str) -> Result<Option<User>>;
```

### 2. Create/Update Asset Permissions ✅

**Ticket: Implement Create/Update Asset Permissions by Email**

- ✅ Enhance the existing `create_asset_permission.rs` module
- ✅ Implement a function to create or update permissions using email
- ✅ Support Owner and FullAccess permission levels
- ✅ Validate inputs and handle errors appropriately
- ✅ Update the existing record if permission already exists

```rust
// Function signature
pub async fn create_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<AssetPermission>;
```

### 3. Remove Asset Permissions ✅

**Ticket: Implement Remove Asset Permissions by Email**

- ✅ Enhance the existing `remove_asset_permissions.rs` module
- ✅ Implement a function to remove permissions using email
- ✅ Soft delete the permission record (set deleted_at to current time)
- ✅ Validate inputs and handle errors appropriately

```rust
// Function signature
pub async fn remove_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    updated_by: Uuid,
) -> Result<()>;
```

### 4. List Asset Permissions ✅

**Ticket: Implement List Asset Permissions**

- ✅ Enhance the existing `list_asset_permissions.rs` module
- ✅ Implement a function to list all permissions for an asset
- ✅ Include user information in the results
- ✅ Support filtering by permission types
- ✅ Handle pagination if needed

```rust
// Function signature
pub async fn list_shares(
    asset_id: Uuid,
    asset_type: AssetType,
) -> Result<Vec<AssetPermissionWithUser>>;
```

### 5. Check Asset Permissions ✅

**Ticket: Implement Check Asset Permissions**

- ✅ Uncomment and enhance the existing `check_asset_permission.rs` module
- ✅ Ensure the function checks if a user has the required permission level
- ✅ Support checking against specific permission levels
- ✅ Optimize for performance with caching if necessary

```rust
// Function signature already exists in the codebase
pub async fn check_access(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_id: Uuid,
    identity_type: IdentityType,
) -> Result<Option<AssetPermissionRole>>;
```

## Permission Requirements

Each function has specific permission requirements:

1. **Create/Update Permissions**: Requires Owner or FullAccess permission
2. **Remove Permissions**: Requires Owner or FullAccess permission
3. **List Permissions**: Available to all permission levels
4. **Check Permissions**: Internal function, no permission requirements

## Testing Strategy

Each component should have:

1. **Unit Tests**: Test individual functions with mocked dependencies ✅
2. **Integration Tests**: Test the interaction between components ✅
3. **Permission Tests**: Verify permission checks are enforced correctly ✅
4. **Error Handling Tests**: Verify proper error handling for edge cases ✅

## Implementation Plan

The implementation will be divided into the following tickets:

1. **Ticket 1**: Implement User Lookup by Email ✅
2. **Ticket 2**: Implement Create/Update Asset Permissions by Email ✅
3. **Ticket 3**: Implement Remove Asset Permissions by Email ✅
4. **Ticket 4**: Implement List Asset Permissions ✅
5. **Ticket 5**: Implement Check Asset Permissions ✅

Each ticket should be implemented and tested independently, allowing for parallel development and incremental deployment.

## Success Metrics

- ✅ All functions pass unit and integration tests
- ✅ Performance meets requirements (response times under 100ms)
- ✅ Error handling is robust and user-friendly
- ✅ Code is modular and maintainable

## Future Considerations

- Adding support for bulk operations
- Implementing more granular permission levels
- Adding support for time-limited permissions
- Integrating with notification systems for permission changes