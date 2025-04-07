---
title: Public Sharing Parameters Fix
author: Claude
date: 2024-04-07
status: Draft
parent_prd: project_bug_fixes_and_testing.md
ticket: BUS-1064
---

# Public Sharing Parameters Fix

## Problem Statement

The public sharing functionality is not properly handling sharing parameters, particularly in the context of asset visibility and access control. The current implementation has several issues:

Current behavior:
- Public sharing parameters are not properly validated
- Inconsistent handling of visibility settings
- Missing checks for valid sharing configurations
- Lack of proper error handling for invalid parameters

Expected behavior:
- Proper validation of all sharing parameters
- Consistent visibility handling
- Clear error messages for invalid configurations
- Proper access control enforcement

## Goals

1. Fix public sharing parameter validation
2. Implement proper visibility checks
3. Add comprehensive parameter validation
4. Improve error handling
5. Add tests for sharing scenarios

## Non-Goals

1. Adding new sharing features
2. Modifying sharing UI
3. Changing sharing model
4. Adding new permission types

## Technical Design

### Overview

The fix involves updating the sharing parameter validation logic and implementing proper checks for visibility settings.

### Parameter Validation

```rust
// libs/handlers/src/sharing/validate.rs

#[derive(Debug, Serialize, Deserialize)]
pub struct SharingParameters {
    pub is_public: bool,
    pub allow_anonymous: bool,
    pub expiration: Option<DateTime<Utc>>,
    pub access_level: AccessLevel,
}

impl SharingParameters {
    pub fn validate(&self) -> Result<(), HandlerError> {
        // Check for valid combinations
        if self.is_public && !self.allow_anonymous {
            return Err(HandlerError::BadRequest(
                "Public sharing must allow anonymous access".to_string()
            ));
        }
        
        // Validate expiration
        if let Some(exp) = self.expiration {
            if exp < Utc::now() {
                return Err(HandlerError::BadRequest(
                    "Expiration date must be in the future".to_string()
                ));
            }
        }
        
        // Validate access level
        if self.is_public && self.access_level > AccessLevel::ReadOnly {
            return Err(HandlerError::BadRequest(
                "Public sharing cannot grant write access".to_string()
            ));
        }
        
        Ok(())
    }
}
```

### Sharing Handler Update

```rust
// libs/handlers/src/sharing/update_sharing.rs

pub async fn update_sharing_handler(
    asset_id: &Uuid,
    user: &AuthenticatedUser,
    params: SharingParameters,
) -> Result<Response, HandlerError> {
    // Validate parameters
    params.validate()?;
    
    // Check user permissions
    let asset = Asset::find_by_id(asset_id).await?;
    if !user.can_manage_sharing(&asset) {
        return Err(HandlerError::Forbidden(
            "User does not have permission to update sharing settings".to_string()
        ));
    }
    
    // Update sharing settings
    asset.update_sharing(params).await?;
    
    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(json!({"status": "success"}).to_string())
        .unwrap())
}
```

### Test Cases

```rust
// libs/handlers/tests/sharing/sharing_params_test.rs

#[tokio::test]
async fn test_invalid_public_sharing() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    let params = SharingParameters {
        is_public: true,
        allow_anonymous: false,
        expiration: None,
        access_level: AccessLevel::ReadOnly,
    };
    
    let result = params.validate();
    assert!(result.is_err());
    
    Ok(())
}

#[tokio::test]
async fn test_expired_sharing() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    let params = SharingParameters {
        is_public: true,
        allow_anonymous: true,
        expiration: Some(Utc::now() - Duration::hours(1)),
        access_level: AccessLevel::ReadOnly,
    };
    
    let result = params.validate();
    assert!(result.is_err());
    
    Ok(())
}

#[tokio::test]
async fn test_invalid_public_access() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    let params = SharingParameters {
        is_public: true,
        allow_anonymous: true,
        expiration: None,
        access_level: AccessLevel::ReadWrite,
    };
    
    let result = params.validate();
    assert!(result.is_err());
    
    Ok(())
}

#[tokio::test]
async fn test_valid_sharing() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test asset
    let asset_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Test Asset",
        setup.organization.id
    ).await?;
    
    // Add owner permission
    PermissionTestHelpers::create_permission(
        &setup.db,
        asset_id,
        setup.user.id,
        AssetPermissionRole::Owner
    ).await?;
    
    let params = SharingParameters {
        is_public: true,
        allow_anonymous: true,
        expiration: Some(Utc::now() + Duration::days(7)),
        access_level: AccessLevel::ReadOnly,
    };
    
    let response = update_sharing_handler(
        &asset_id,
        &setup.user,
        params.clone()
    ).await;
    
    assert!(response.is_ok());
    
    // Verify sharing settings in database
    let mut conn = setup.db.diesel_conn().await?;
    let sharing = sharing_settings::table
        .filter(sharing_settings::asset_id.eq(asset_id))
        .first::<SharingSettings>(&mut conn)
        .await?;
    
    assert_eq!(sharing.is_public, params.is_public);
    assert_eq!(sharing.allow_anonymous, params.allow_anonymous);
    assert_eq!(sharing.access_level, params.access_level);
    assert_eq!(sharing.expiration, params.expiration);
    
    Ok(())
}

#[tokio::test]
async fn test_sharing_update_history() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test asset
    let asset_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Test Asset",
        setup.organization.id
    ).await?;
    
    // Add owner permission
    PermissionTestHelpers::create_permission(
        &setup.db,
        asset_id,
        setup.user.id,
        AssetPermissionRole::Owner
    ).await?;
    
    let params = SharingParameters {
        is_public: true,
        allow_anonymous: true,
        expiration: None,
        access_level: AccessLevel::ReadOnly,
    };
    
    // Update sharing settings
    update_sharing_handler(
        &asset_id,
        &setup.user,
        params
    ).await?;
    
    // Verify history entry in database
    let mut conn = setup.db.diesel_conn().await?;
    let history = sharing_history::table
        .filter(sharing_history::asset_id.eq(asset_id))
        .order_by(sharing_history::created_at.desc())
        .first::<SharingHistory>(&mut conn)
        .await?;
    
    assert_eq!(history.user_id, setup.user.id);
    assert_eq!(history.action, "update");
    
    Ok(())
}
```

### Dependencies

1. Test infrastructure from [Test Infrastructure Setup](api_test_infrastructure.md)
2. Existing sharing implementation
3. Permission system
4. Error handling system from [HTTP Status Code Fix](api_http_status_fix.md)

## Implementation Plan

### Phase 1: Parameter Validation

1. Implement parameter validation
2. Add validation tests
3. Update error handling
4. Document validation rules

### Phase 2: Handler Updates

1. Update sharing handlers
2. Add validation checks
3. Implement error handling
4. Add handler tests

### Phase 3: Testing

1. Add validation tests
2. Test sharing scenarios
3. Test error cases
4. Test edge cases

## Testing Strategy

### Unit Tests

- Test parameter validation
- Test invalid combinations
- Test expiration handling
- Test access level validation

### Integration Tests

- Test sharing updates
- Test permission checks
- Test error handling
- Test complete sharing flow

## Success Criteria

1. All sharing parameters are properly validated
2. Invalid configurations are rejected
3. Tests pass for all scenarios
4. Documentation is updated

## Rollout Plan

1. Implement validation changes
2. Update handlers
3. Deploy to staging
4. Monitor for issues
5. Deploy to production

## Appendix

### Related Files

- `libs/handlers/src/sharing/validate.rs`
- `libs/handlers/src/sharing/update_sharing.rs`
- `libs/handlers/tests/sharing/sharing_params_test.rs`
- `libs/models/src/sharing.rs`

### Sharing Parameter Reference

Valid parameter combinations:
- Public sharing must allow anonymous access
- Public sharing limited to read-only access
- Expiration date must be in the future
- Non-public sharing can have any access level 