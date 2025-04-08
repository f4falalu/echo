---
title: Permission Field Fix
author: Claude
date: 2024-04-07
status: Draft
parent_prd: project_bug_fixes_and_testing.md
ticket: BUS-1063
---

# Permission Field Fix

## Problem Statement

The permission field in asset responses is inconsistent and sometimes missing required information. This causes issues with permission checking and display in the UI. The current implementation has several issues:

Current behavior:
- Permission field sometimes missing from responses
- Inconsistent permission field format
- Missing role information
- Incorrect inherited permissions
- Lack of comprehensive testing for permission scenarios

Expected behavior:
- Consistent permission field presence
- Standardized permission format
- Complete role information
- Proper inheritance handling
- Comprehensive test coverage using new test infrastructure

Impact:
- User Impact: Incorrect permission display and access control
- System Impact: Inconsistent permission state
- Testing Impact: Missing edge cases and inheritance scenarios

## Goals

1. Fix permission field consistency
2. Standardize permission format
3. Add complete role information
4. Fix permission inheritance
5. Implement comprehensive tests using new test infrastructure

## Non-Goals

1. Adding new permission types
2. Changing permission model
3. Modifying permission UI
4. Adding new permission features

## Technical Design

### Overview

The fix involves standardizing how permission fields are set in asset responses by consistently using the permission obtained from the initial authorization check. This ensures that the permission field in the response matches what was used for access control.

### Permission Field Consistency

The key issue is that we're retrieving permissions for authorization checks but sometimes not using the same permission object in the response. This causes inconsistencies. 

The solution is simple:

1. When fetching an asset, we already get the user's permissions through helper functions:
   - `fetch_metric_file_with_permissions`
   - `fetch_dashboard_file_with_permission`
   - `fetch_collection_with_permission`

2. We use the permission returned by these functions for both:
   - Authorization check (already being done)
   - Setting the `permission` field in the response (this needs fixing)

3. For public assets:
   - If a user doesn't have direct permissions but the asset is public, we should consistently grant `CanView` permission
   - The permission field should reflect this as a non-inherited permission

4. For denied access:
   - If a user doesn't have permissions and the asset isn't public, the handler should return an error before creating the response

### Implementation Details

Here's how to fix each handler:

```rust
// General pattern for all handlers

// 1. Fetch asset with permission (already being done)
let asset_with_permission = fetch_asset_with_permission(&asset_id, &user.id).await?;

// 2. Check if user has necessary permission (already being done)
if !check_permission_access(
    asset_with_permission.permission,
    &[AssetPermissionRole::CanView, ...],
    asset_with_permission.asset.organization_id,
    &user.organizations,
) {
    return Err(anyhow!("You don't have permission to view this asset"));
}

// 3. Extract permission for response (some handlers are missing this)
let permission = asset_with_permission.permission
    .unwrap_or(AssetPermissionRole::CanView); // Fall back to CanView for public assets

// 4. Use this permission consistently in the response
let response = SomeAssetResponse {
    // ...other fields
    permission, // Always use the same permission that was used for access check
    // ...other fields
};
```

#### Metrics Handler Update

```rust
// libs/handlers/src/metrics/get_metric_handler.rs

pub async fn get_metric_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    version_number: Option<i32>,
) -> Result<BusterMetric> {
    // 1. Fetch metric file with permission
    let metric_file_with_permission = fetch_metric_file_with_permissions(metric_id, &user.id)
        .await
        .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

    let metric_file_with_permission = if let Some(metric_file) = metric_file_with_permission {
        metric_file
    } else {
        return Err(anyhow!("Metric file not found"));
    };

    // 2. Check if user has at least CanView permission
    if !check_permission_access(
        metric_file_with_permission.permission,
        &[
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::CanView,
        ],
        metric_file_with_permission.metric_file.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!("You don't have permission to view this metric"));
    }

    // 3. Extract permission for consistent use in response
    let permission = metric_file_with_permission.permission
        .unwrap_or(AssetPermissionRole::CanView); // Default to CanView for public assets

    // ... rest of handler implementation ...

    // 4. Use the same permission in the response
    Ok(BusterMetric {
        // ... other fields ...
        permission,
        // ... other fields ...
    })
}
```

#### Dashboards Handler Update

```rust
// libs/handlers/src/dashboards/get_dashboard_handler.rs

pub async fn get_dashboard_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
    version_number: Option<i32>,
) -> Result<BusterDashboardResponse> {
    // 1. Fetch dashboard with permission
    let dashboard_with_permission =
        fetch_dashboard_file_with_permission(dashboard_id, &user.id).await?;

    // 2. If dashboard not found, return error
    let dashboard_with_permission = match dashboard_with_permission {
        Some(dwp) => dwp,
        None => return Err(anyhow!("Dashboard not found")),
    };

    // 3. Check if user has necessary permission
    if !check_permission_access(
        dashboard_with_permission.permission,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        dashboard_with_permission.dashboard_file.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!("You don't have permission to view this dashboard"));
    }

    // 4. Extract permission for consistent use
    let permission = dashboard_with_permission.permission
        .unwrap_or(AssetPermissionRole::CanView); // Default to CanView for public assets

    // ... rest of handler implementation ...

    // 5. Use the same permission consistently in response
    Ok(BusterDashboardResponse {
        access: permission,
        // ... other fields ...
        permission,
        // ... other fields ...
    })
}
```

#### Collections Handler Update

```rust
// libs/handlers/src/collections/get_collection_handler.rs

pub async fn get_collection_handler(
    user: &AuthenticatedUser,
    req: GetCollectionRequest,
) -> Result<CollectionState> {
    // 1. Fetch collection with permission
    let collection_with_permission = fetch_collection_with_permission(&req.id, &user.id).await?;
    
    // 2. If collection not found, return error
    let collection_with_permission = match collection_with_permission {
        Some(cwp) => cwp,
        None => return Err(anyhow!("Collection not found")),
    };
    
    // 3. Check if user has permission
    if !check_permission_access(
        collection_with_permission.permission,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        collection_with_permission.collection.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!("You don't have permission to view this collection"));
    }

    // 4. Extract permission for consistent use
    let permission = collection_with_permission.permission
        .unwrap_or(AssetPermissionRole::CanView); // Default to CanView for public assets

    // ... rest of handler implementation ...

    // 5. Use the same permission in the response
    let collection_state = CollectionState {
        collection: collection_with_permission.collection,
        assets: Some(formatted_assets),
        permission,
        // ... other fields ...
    };

    Ok(collection_state)
}
```

### Permission Field Verification

The modified handlers will ensure that:
1. If a user has permission (via individual, organization, or inherited permission), the correct permission is used in the response
2. If a user doesn't have permission but the asset is public, they get CanView permission
3. If a user doesn't have permission and the asset isn't public, they get an error before a response is created

This approach ensures consistency between permission checks and response fields without adding complexity to the system.

### Test Cases

```rust
// libs/handlers/tests/permission_field_test.rs

use anyhow::Result;
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType};
use database::tests::common::{TestDb, TestSetup};
use middleware::AuthenticatedUser;
use uuid::Uuid;

// Common test for permission field consistency in all asset types
async fn test_permission_field_consistency<F, R>(
    asset_type: AssetType,
    create_asset_fn: F,
    get_asset_fn: R,
) -> Result<()>
where
    F: Fn(&TestSetup) -> Result<Uuid>,
    R: Fn(&Uuid, &AuthenticatedUser) -> Result<bool>,
{
    // Test setup
    let setup = TestSetup::new(None).await?;
    
    // Create asset
    let asset_id = create_asset_fn(&setup)?;
    
    // Add permission for asset
    setup.db.add_permission(
        asset_id,
        setup.user.id,
        AssetPermissionRole::Owner,
        false,
        None,
    ).await?;
    
    // Get asset and check permission field
    let has_consistent_permission = get_asset_fn(&asset_id, &setup.user).await?;
    
    assert!(has_consistent_permission);
    
    Ok(())
}

#[tokio::test]
async fn test_metric_permission_field_consistency() -> Result<()> {
    test_permission_field_consistency(
        AssetType::MetricFile,
        |setup| {
            // Create test metric
            let metric_id = Uuid::new_v4();
            // ... setup code to create metric ...
            Ok(metric_id)
        },
        |metric_id, user| {
            // Get metric
            let metric = get_metric_handler(metric_id, user, None).await?;
            
            // Check if permission field matches what we set
            Ok(metric.permission == AssetPermissionRole::Owner)
        },
    ).await
}

#[tokio::test]
async fn test_dashboard_permission_field_consistency() -> Result<()> {
    test_permission_field_consistency(
        AssetType::DashboardFile,
        |setup| {
            // Create test dashboard
            let dashboard_id = Uuid::new_v4();
            // ... setup code to create dashboard ...
            Ok(dashboard_id)
        },
        |dashboard_id, user| {
            // Get dashboard
            let dashboard_response = get_dashboard_handler(dashboard_id, user, None).await?;
            
            // Check if permission fields are consistent
            Ok(
                dashboard_response.permission == AssetPermissionRole::Owner &&
                dashboard_response.access == AssetPermissionRole::Owner
            )
        },
    ).await
}

#[tokio::test]
async fn test_collection_permission_field_consistency() -> Result<()> {
    test_permission_field_consistency(
        AssetType::Collection,
        |setup| {
            // Create test collection
            let collection_id = Uuid::new_v4();
            // ... setup code to create collection ...
            Ok(collection_id)
        },
        |collection_id, user| {
            // Get collection
            let req = GetCollectionRequest { id: *collection_id };
            let collection = get_collection_handler(user, req).await?;
            
            // Check if permission field matches what we set
            Ok(collection.permission == AssetPermissionRole::Owner)
        },
    ).await
}

#[tokio::test]
async fn test_public_asset_permission_field() -> Result<()> {
    // Test setup
    let setup = TestSetup::new(None).await?;
    
    // Create a public metric
    let metric_id = Uuid::new_v4();
    // ... setup code to create metric ...
    
    // Make metric public
    let mut conn = setup.db.diesel_conn().await?;
    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .set((
            metric_files::publicly_accessible.eq(true),
            metric_files::publicly_enabled_by.eq(Some(setup.user.id)),
            metric_files::public_expiry_date.eq(Some(Utc::now() + chrono::Duration::days(7))),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create a new user without direct permissions
    let other_user = TestSetup::new(None).await?.user;
    
    // Get metric with new user
    let metric = get_metric_handler(&metric_id, &other_user, None).await?;
    
    // Public assets should have CanView permission by default
    assert_eq!(metric.permission, AssetPermissionRole::CanView);
    
    Ok(())
}

#[tokio::test]
async fn test_permission_inheritance_consistency() -> Result<()> {
    // Test setup
    let setup = TestSetup::new(None).await?;
    
    // Create parent metric
    let parent_id = Uuid::new_v4();
    // ... setup code to create parent metric ...
    
    // Create child metric
    let child_id = Uuid::new_v4();
    // ... setup code to create child metric ...
    
    // Set parent-child relationship
    let mut conn = setup.db.diesel_conn().await?;
    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(child_id))
        .set(metric_files::parent_id.eq(Some(parent_id)))
        .execute(&mut conn)
        .await?;
    
    // Add permission to parent
    setup.db.add_permission(
        parent_id,
        setup.user.id,
        AssetPermissionRole::Owner,
        false,
        None,
    ).await?;
    
    // Get child metric
    let child_metric = get_metric_handler(&child_id, &setup.user, None).await?;
    
    // Check if permission is inherited correctly
    assert_eq!(child_metric.permission, AssetPermissionRole::Owner);
    
    Ok(())
}

#[tokio::test]
async fn test_permission_denied_for_nonpublic_asset() -> Result<()> {
    // Test setup
    let setup = TestSetup::new(None).await?;
    
    // Create non-public metric
    let metric_id = Uuid::new_v4();
    // ... setup code to create metric ...
    
    // Create a new user without permissions
    let other_user = TestSetup::new(None).await?.user;
    
    // Try to get metric with new user
    let result = get_metric_handler(&metric_id, &other_user, None).await;
    
    // Should be denied access
    assert!(result.is_err());
    
    Ok(())
}
```

The tests will verify:

1. The permission field in responses matches the permission used for access control
2. Public assets grant CanView permission to users without direct permissions
3. Permission inheritance properly reflects in the permission field
4. Access is denied before a response is created when the user lacks permissions

## Implementation Plan

### Phase 1: Permission Field Consistency

1. Update handlers to extract and use permissions consistently:
   - `get_metric_handler.rs`
   - `get_dashboard_handler.rs`
   - `get_collection_handler.rs`

2. Add special handling for public assets to ensure they consistently get CanView permission

### Phase 2: Testing

1. Implement test cases to verify consistency:
   - Direct permission tests
   - Public asset permission tests
   - Inheritance tests
   - Access denial tests

2. Test across all asset types:
   - Metrics
   - Dashboards
   - Collections

## Implementation Summary

The implementation involves a simple but consistent approach across all handlers:

### Metrics Handler

```rust
// Extract permission for consistent use throughout the handler
// If the asset is public and the user has no direct permission, default to CanView
let permission = metric_file_with_permission.permission
    .unwrap_or(AssetPermissionRole::CanView);

// Later in the response construction
Ok(BusterMetric {
    // ... other fields
    permission,
    // ... other fields
})
```

### Dashboards Handler

```rust
// Extract permission for consistent use throughout the handler
// If the asset is public and the user has no direct permission, default to CanView
let permission = dashboard_with_permission.permission
    .unwrap_or(AssetPermissionRole::CanView);

// Use consistently in the response
Ok(BusterDashboardResponse {
    access: permission,
    // ... other fields
    permission,
    // ... other fields
})
```

### Collections Handler

```rust
// Extract permission for consistent use throughout the handler
// If the asset is public and the user has no direct permission, default to CanView
let permission = collection_with_permission.permission
    .unwrap_or(AssetPermissionRole::CanView);

// Use in the response
let collection_state = CollectionState {
    // ... other fields
    permission,
    // ... other fields
};
```

This approach ensures that:

1. We extract the permission value once after the access check
2. We use the same permission value throughout the handler
3. For public assets with no direct permission, we consistently use CanView
4. The permission field in the response matches exactly what was used for access control

The simplicity of this approach makes it easy to maintain and understand, while ensuring consistency across all asset types.

## Testing Strategy

### Unit Tests

1. Permission Consistency Tests
   - Test permission field matches permission used for access check
   - Verify access role is correctly reflected in responses
   - Test permission inheritance is properly reflected

2. Public Access Tests
   - Test public assets grant CanView permission
   - Test expired public assets deny access
   - Test password-protected public assets

3. Access Denial Tests
   - Test non-public assets deny access to unpermissioned users
   - Test proper error messages for denied access

### Integration Tests

1. API Tests
   - Test permission field in responses from REST endpoints
   - Verify consistency between access checks and response fields
   - Test public access endpoints

2. Workflow Tests
   - Test permission changes are immediately reflected in responses
   - Test public access toggling reflects properly in responses

### Test Coverage

Tests should cover the following scenarios:
- Direct permissions (Owner, CanEdit, CanView)
- Inherited permissions
- Organization-level permissions
- Public access
- Permission denial
- Edge cases (e.g., circular inheritance)

## Success Criteria

1. Permission Field Consistency
   - The permission field in each response always matches the permission used for access control
   - No response is generated for unauthorized access attempts

2. Public Access Handling
   - Public assets consistently grant CanView permission to unpermissioned users
   - Expired public access correctly denies access

3. Permission Inheritance
   - Inherited permissions are properly reflected in permission fields
   - Permission inheritance chains are properly traversed

4. Error Handling
   - Access denial occurs before response creation
   - Clear error messages for permission issues

5. Code Quality
   - No code duplication in permission handling
   - Clear and consistent permission check pattern across handlers

## Security Considerations

1. Permission Validation
   - Risk: Inconsistent permission checks could allow unauthorized access
   - Mitigation: Standardize permission check pattern across all handlers
   - Testing: Comprehensive permission test suite

2. Public Access Security
   - Risk: Public access could expose sensitive data
   - Mitigation: Consistent CanView-only access for public assets
   - Testing: Verify public assets only grant minimal required permissions

## Dependencies

1. Existing fetch functions:
   - `fetch_metric_file_with_permissions`
   - `fetch_dashboard_file_with_permission`
   - `fetch_collection_with_permission`

2. Shared access control function:
   - `check_permission_access`

3. Asset response types:
   - `BusterMetric`
   - `BusterDashboardResponse`
   - `CollectionState`

4. Testing infrastructure:
   - `TestSetup` for creating test environments
   - Database connection pooling for tests

5. Error handling:
   - `anyhow::Result` for standard error handling

## References

- [Test Infrastructure Documentation](api_test_infrastructure.md)
- [Permission System Documentation](link_to_docs)
- [Database Schema](link_to_schema)

## Appendix

### Related Files

- `libs/models/src/permissions.rs`
- `libs/models/src/asset.rs`
- `libs/models/tests/permission_field_test.rs`
- `libs/handlers/src/assets/*.rs`

### Permission Field Reference

Required fields:
- role: The user's role for the asset
- inherited: Whether the permission is inherited
- inherited_from: Parent asset ID if inherited
- granted_at: When the permission was granted
- granted_by: User ID who granted the permission 