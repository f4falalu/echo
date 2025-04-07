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

Expected behavior:
- Consistent permission field presence
- Standardized permission format
- Complete role information
- Proper inheritance handling

## Goals

1. Fix permission field consistency
2. Standardize permission format
3. Add complete role information
4. Fix permission inheritance
5. Add permission field tests

## Non-Goals

1. Adding new permission types
2. Changing permission model
3. Modifying permission UI
4. Adding new permission features

## Technical Design

### Overview

The fix involves standardizing the permission field format and ensuring consistent inclusion in responses.

### Permission Field Structure

```rust
// libs/models/src/permissions.rs

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionField {
    pub role: AssetPermissionRole,
    pub inherited: bool,
    pub inherited_from: Option<Uuid>,
    pub granted_at: DateTime<Utc>,
    pub granted_by: Option<Uuid>,
}

impl PermissionField {
    pub fn new(
        role: AssetPermissionRole,
        inherited: bool,
        inherited_from: Option<Uuid>,
        granted_by: Option<Uuid>,
    ) -> Self {
        Self {
            role,
            inherited,
            inherited_from,
            granted_at: Utc::now(),
            granted_by,
        }
    }
    
    pub fn from_permission(permission: &Permission) -> Self {
        Self {
            role: permission.role,
            inherited: permission.inherited,
            inherited_from: permission.inherited_from,
            granted_at: permission.granted_at,
            granted_by: permission.granted_by,
        }
    }
}
```

### Asset Response Update

```rust
// libs/models/src/asset.rs

#[derive(Debug, Serialize)]
pub struct AssetResponse {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub permission: PermissionField,  // Now required
    // ... other fields ...
}

impl Asset {
    pub async fn to_response(
        &self,
        user_id: Uuid,
        conn: &mut PgConnection
    ) -> Result<AssetResponse> {
        // Get user's permission
        let permission = Permission::find_for_user(
            self.id,
            user_id,
            conn
        ).await?;
        
        Ok(AssetResponse {
            id: self.id,
            name: self.name.clone(),
            created_at: self.created_at,
            updated_at: self.updated_at,
            permission: PermissionField::from_permission(&permission),
            // ... other fields ...
        })
    }
}
```

### Test Cases

```rust
// libs/models/tests/permission_field_test.rs

#[tokio::test]
async fn test_permission_field_direct() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test asset
    let asset_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Test Asset",
        setup.organization.id
    ).await?;
    
    // Add direct permission
    let permission = PermissionTestHelpers::create_permission(
        &setup.db,
        asset_id,
        setup.user.id,
        AssetPermissionRole::Owner
    ).await?;
    
    // Get asset response
    let mut conn = setup.db.diesel_conn().await?;
    let asset = Asset::find_by_id(asset_id).await?;
    let response = asset.to_response(
        setup.user.id,
        &mut conn
    ).await?;
    
    // Verify permission field
    assert_eq!(response.permission.role, AssetPermissionRole::Owner);
    assert!(!response.permission.inherited);
    assert!(response.permission.inherited_from.is_none());
    assert_eq!(
        response.permission.granted_by,
        Some(setup.user.id)
    );
    
    Ok(())
}

#[tokio::test]
async fn test_permission_field_inherited() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create parent asset
    let parent_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Parent Asset",
        setup.organization.id
    ).await?;
    
    // Create child asset
    let child_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Child Asset",
        setup.organization.id
    ).await?;
    
    // Add parent permission
    PermissionTestHelpers::create_permission(
        &setup.db,
        parent_id,
        setup.user.id,
        AssetPermissionRole::Owner
    ).await?;
    
    // Set inheritance
    let mut conn = setup.db.diesel_conn().await?;
    diesel::update(assets::table)
        .filter(assets::id.eq(child_id))
        .set(assets::parent_id.eq(parent_id))
        .execute(&mut conn)
        .await?;
    
    // Get child asset response
    let child = Asset::find_by_id(child_id).await?;
    let response = child.to_response(
        setup.user.id,
        &mut conn
    ).await?;
    
    // Verify inherited permission field
    assert_eq!(response.permission.role, AssetPermissionRole::Owner);
    assert!(response.permission.inherited);
    assert_eq!(response.permission.inherited_from, Some(parent_id));
    
    Ok(())
}

#[tokio::test]
async fn test_permission_field_missing() -> Result<()> {
    // Create test setup with viewer role
    let setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    // Create asset without permission
    let asset_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Test Asset",
        setup.organization.id
    ).await?;
    
    // Try to get asset response
    let mut conn = setup.db.diesel_conn().await?;
    let asset = Asset::find_by_id(asset_id).await?;
    let result = asset.to_response(
        setup.user.id,
        &mut conn
    ).await;
    
    assert!(result.is_err());
    
    // Verify error is logged
    let error_log = error_logs::table
        .filter(error_logs::asset_id.eq(asset_id))
        .filter(error_logs::user_id.eq(setup.user.id))
        .first::<ErrorLog>(&mut conn)
        .await?;
    
    assert_eq!(error_log.error_type, "missing_permission");
    
    Ok(())
}

#[tokio::test]
async fn test_permission_field_serialization() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test asset
    let asset_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Test Asset",
        setup.organization.id
    ).await?;
    
    // Add permission
    PermissionTestHelpers::create_permission(
        &setup.db,
        asset_id,
        setup.user.id,
        AssetPermissionRole::Owner
    ).await?;
    
    // Get asset response
    let mut conn = setup.db.diesel_conn().await?;
    let asset = Asset::find_by_id(asset_id).await?;
    let response = asset.to_response(
        setup.user.id,
        &mut conn
    ).await?;
    
    // Serialize response
    let json = serde_json::to_value(&response)?;
    
    // Verify permission field structure
    assert!(json.get("permission").is_some());
    assert_eq!(
        json["permission"]["role"].as_str(),
        Some("owner")
    );
    assert_eq!(
        json["permission"]["inherited"].as_bool(),
        Some(false)
    );
    assert!(json["permission"]["inherited_from"].is_null());
    assert!(json["permission"]["granted_at"].is_string());
    assert!(json["permission"]["granted_by"].is_string());
    
    Ok(())
}
```

### Dependencies

1. Test infrastructure from [Test Infrastructure Setup](api_test_infrastructure.md)
2. Existing permission system
3. Asset response handling
4. Error handling system from [HTTP Status Code Fix](api_http_status_fix.md)

## Implementation Plan

### Phase 1: Field Structure

1. Implement permission field structure
2. Add field serialization
3. Update response types
4. Document field format

### Phase 2: Response Updates

1. Update asset responses
2. Add permission field
3. Handle missing permissions
4. Add response tests

### Phase 3: Testing

1. Add field tests
2. Test inheritance
3. Test error cases
4. Test edge cases

## Testing Strategy

### Unit Tests

- Test field structure
- Test serialization
- Test inheritance
- Test missing permissions

### Integration Tests

- Test response format
- Test permission flow
- Test error handling
- Test complete asset flow

## Success Criteria

1. Permission field is consistent
2. Inheritance works correctly
3. Tests pass for all scenarios
4. Documentation is updated

## Rollout Plan

1. Implement field changes
2. Update responses
3. Deploy to staging
4. Monitor for issues
5. Deploy to production

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