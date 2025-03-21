---
title: API Sharing Permission Requirements
author: 
date: 2025-03-21
status: Draft
---

# API Sharing Permission Requirements

## Problem Statement

The current permission checks in our API endpoints do not clearly define two critical requirements:

1. **Adding Assets to Collections/Dashboards**: Permission requirements for adding assets to collections or dashboards are not clearly specified in the existing PRDs.

2. **Sharing Endpoint Permissions**: The permission level required to access and modify sharing settings via `/sharing` endpoints is not explicitly documented.

These gaps could lead to inconsistent implementation of permission checks across the application, potentially allowing users with insufficient permissions to perform operations they shouldn't be able to do.

### Current Limitations

- Lack of explicit documentation for permission requirements when adding assets to collections/dashboards
- No clear standard for permission requirements when accessing `/sharing` endpoints
- Potential for inconsistent implementation across different asset types

### Impact

- User Impact: Users might unexpectedly be able to or unable to perform certain operations
- System Impact: Security vulnerabilities and inconsistent behavior
- Business Impact: Potential unauthorized modifications to important business assets

## Requirements

### Functional Requirements

#### 1. Adding Assets to Collections/Dashboards

- Permission Requirement: Users must have at least "CanEdit" permission on a collection or dashboard to add assets to it
  - Details: This includes CanEdit, FullAccess, or Owner permission levels
  - Acceptance Criteria: Users with less than CanEdit permission (e.g., CanView, CanFilter) cannot add assets
  - Dependencies: Existing permission check implementations

#### 2. Sharing Endpoint Access

- Permission Requirement: Users must have "FullAccess" or "Owner" permission to access and modify sharing settings
  - Details: This applies to all `/sharing` endpoints across all asset types
  - Acceptance Criteria: Users with less than FullAccess permission (e.g., CanView, CanFilter, CanEdit) cannot modify sharing settings
  - Dependencies: Existing permission check implementations

### Non-Functional Requirements

- Consistency: These permission requirements must be applied consistently across all asset types
- Documentation: These requirements must be clearly documented in each asset-specific PRD
- Testing: Comprehensive tests must verify these permission requirements for all asset types

## Technical Design

### Updates to Existing Permission Check Implementations

For each asset type (Chats, Collections, Dashboards, Metrics), the following updates are required:

1. **Add Asset to Collection/Dashboard Handler**:

```rust
pub async fn add_asset_to_collection_handler(
    collection_id: &Uuid,
    asset_id: &Uuid,
    asset_type: AssetType,
    user_id: &Uuid,
) -> Result<()> {
    // Verify user has at least CanEdit permission on the collection
    verify_collection_permission(collection_id, user_id, AssetPermissionRole::CanEdit).await?;
    
    // Existing handler logic continues below...
    // ...
}
```

2. **Sharing Endpoint Handlers**:

```rust
pub async fn update_sharing_permissions_handler(
    asset_id: &Uuid,
    asset_type: AssetType, 
    permissions: Vec<AssetPermission>,
    user_id: &Uuid,
) -> Result<()> {
    // Verify user has at least FullAccess permission
    match asset_type {
        AssetType::Chat => {
            verify_chat_permission(asset_id, user_id, AssetPermissionRole::FullAccess).await?;
        },
        AssetType::Collection => {
            verify_collection_permission(asset_id, user_id, AssetPermissionRole::FullAccess).await?;
        },
        AssetType::DashboardFile => {
            verify_dashboard_permission(asset_id, user_id, AssetPermissionRole::FullAccess).await?;
        },
        AssetType::Metric => {
            verify_metric_permission(asset_id, user_id, AssetPermissionRole::FullAccess).await?;
        },
        _ => return Err(anyhow!("Unsupported asset type for sharing")),
    }
    
    // Existing handler logic continues below...
    // ...
}
```

### Updates to Existing PRDs

Each of the following PRDs needs to be updated to include these permission requirements:
- `api_chat_permission_checks.md`
- `api_collection_permission_checks.md`
- `api_dashboard_permission_checks.md`
- `api_metric_permission_checks.md`

## Implementation Plan

### Tasks
1. Update all asset-specific PRDs to include these requirements
2. Ensure all existing and new handlers implement these permission checks
3. Add tests to verify these permission requirements

### Dependencies
- Existing permission check functions in each asset handler
- Existing sharing library components

## Testing Strategy

### Unit Tests

For each asset type, add the following test cases:

#### Collection/Dashboard Asset Addition Permission Tests

```rust
#[tokio::test]
async fn test_add_asset_to_collection_with_canview_fails() {
    // Arrange: Set up user with only CanView permission on collection
    // Act: Attempt to add asset to collection
    // Assert: Operation fails with permission error
}

#[tokio::test]
async fn test_add_asset_to_collection_with_canedit_succeeds() {
    // Arrange: Set up user with CanEdit permission on collection
    // Act: Attempt to add asset to collection
    // Assert: Operation succeeds
}

#[tokio::test]
async fn test_add_asset_to_collection_with_fullaccess_succeeds() {
    // Arrange: Set up user with FullAccess permission on collection
    // Act: Attempt to add asset to collection
    // Assert: Operation succeeds
}
```

#### Sharing Endpoint Permission Tests

```rust
#[tokio::test]
async fn test_update_sharing_with_canedit_fails() {
    // Arrange: Set up user with only CanEdit permission on asset
    // Act: Attempt to update sharing settings
    // Assert: Operation fails with permission error
}

#[tokio::test]
async fn test_update_sharing_with_fullaccess_succeeds() {
    // Arrange: Set up user with FullAccess permission on asset
    // Act: Attempt to update sharing settings
    // Assert: Operation succeeds
}

#[tokio::test]
async fn test_update_sharing_with_owner_succeeds() {
    // Arrange: Set up user with Owner permission on asset
    // Act: Attempt to update sharing settings
    // Assert: Operation succeeds
}
```

### Integration Tests

For each asset type, integration tests should verify:
1. A user with only CanView cannot add assets to collections/dashboards or modify sharing settings
2. A user with CanEdit can add assets but cannot modify sharing settings
3. A user with FullAccess can both add assets and modify sharing settings
4. A user with Owner permission can both add assets and modify sharing settings

## Security Considerations

- Permission checks must happen at the beginning of handlers before any operations
- Failed permission checks should return consistent error messages that don't reveal sensitive information
- These permission requirements should be consistently enforced across all API endpoints, including REST and WebSocket interfaces
