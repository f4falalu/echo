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

Current behavior:
- Public sharing parameters using `Option<Option<T>>` are confusing and error-prone
- Diesel treats `None` as "don't update" vs `Some(None)` as "update to null"
- No clear distinction between "remove value" and "don't change value"
- Inconsistent handling between metrics and dashboards

Expected behavior:
- Clear enum for handling null vs none cases
- Consistent parameter handling across assets
- Proper diesel changeset updates
- Type-safe handling of public sharing fields

## Technical Design

### Parameter Types

```rust
/// Represents a field that can be either kept unchanged, set to null, or updated with a value
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UpdateField<T> {
    NoChange,
    SetNull,
    Update(T),
}

/// Request for updating sharing settings
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSharingRequest {
    /// List of users to share with
    pub users: Option<Vec<ShareRecipient>>,
    /// Whether the asset should be publicly accessible
    pub publicly_accessible: Option<bool>,
    /// Password for public access
    pub public_password: UpdateField<String>,
    /// Expiration date for public access
    pub public_expiry_date: UpdateField<DateTime<Utc>>,
}

impl<T> UpdateField<T> {
    /// Converts the UpdateField into an Option<Option<T>> for diesel
    pub fn into_option(self) -> Option<Option<T>> {
        match self {
            UpdateField::NoChange => None,
            UpdateField::SetNull => Some(None),
            UpdateField::Update(value) => Some(Some(value)),
        }
    }
}
```

### Handler Update

```rust
pub async fn update_sharing_handler(
    asset_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateSharingRequest,
) -> Result<()> {
    // ... permission checks ...

    let mut changeset = diesel::update(dsl::asset_files)
        .filter(dsl::id.eq(asset_id));

    // Only include fields in changeset if they should be updated
    if let Some(publicly_accessible) = request.publicly_accessible {
        changeset = changeset.set(dsl::publicly_accessible.eq(publicly_accessible));
        
        // Update publicly_enabled_by based on publicly_accessible
        let enabled_by = if publicly_accessible {
            Some(user.id)
        } else {
            None
        };
        changeset = changeset.set(dsl::publicly_enabled_by.eq(enabled_by));
    }

    // Handle public_password using UpdateField
    match request.public_password {
        UpdateField::Update(password) => {
            changeset = changeset.set(dsl::public_password.eq(Some(password)));
        }
        UpdateField::SetNull => {
            changeset = changeset.set(dsl::public_password.eq(None::<String>));
        }
        UpdateField::NoChange => {}
    }

    // Handle public_expiry_date using UpdateField
    match request.public_expiry_date {
        UpdateField::Update(date) => {
            changeset = changeset.set(dsl::public_expiry_date.eq(Some(date)));
        }
        UpdateField::SetNull => {
            changeset = changeset.set(dsl::public_expiry_date.eq(None::<DateTime<Utc>>));
        }
        UpdateField::NoChange => {}
    }

    // Execute the update
    changeset.execute(&mut conn).await?;

    Ok(())
}
```

### Test Cases

```rust
// libs/handlers/tests/sharing/public_update_tests.rs

use chrono::{Duration, Utc};
use database::tests::common::{TestSetup, UserOrganizationRole};
use database::tests::common::assets::AssetTestHelpers;

#[tokio::test]
async fn test_metric_public_updates() -> Result<()> {
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test metric
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric",
        setup.organization.id
    ).await?;

    // Test 1: Make public with password and expiry
    let request = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: Some(true),
        public_password: UpdateField::Update("secretpass123".to_string()),
        public_expiry_date: UpdateField::Update(Utc::now() + Duration::days(7)),
    };

    let result = update_metric_sharing_handler(&metric_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify updates
    let metric = fetch_metric_with_permission(&metric_id, &setup.user.id).await?;
    assert!(metric.publicly_accessible);
    assert_eq!(metric.publicly_enabled_by, Some(setup.user.id));
    assert_eq!(metric.public_password, Some("secretpass123".to_string()));
    assert!(metric.public_expiry_date.is_some());

    // Test 2: Remove password but keep public
    let request = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: None, // Don't change
        public_password: UpdateField::SetNull,
        public_expiry_date: UpdateField::NoChange,
    };

    let result = update_metric_sharing_handler(&metric_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify only password was removed
    let metric = fetch_metric_with_permission(&metric_id, &setup.user.id).await?;
    assert!(metric.publicly_accessible); // Still public
    assert_eq!(metric.publicly_enabled_by, Some(setup.user.id));
    assert_eq!(metric.public_password, None); // Password removed
    assert!(metric.public_expiry_date.is_some()); // Expiry unchanged

    // Test 3: Make private
    let request = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: Some(false),
        public_password: UpdateField::NoChange,
        public_expiry_date: UpdateField::NoChange,
    };

    let result = update_metric_sharing_handler(&metric_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify made private
    let metric = fetch_metric_with_permission(&metric_id, &setup.user.id).await?;
    assert!(!metric.publicly_accessible);
    assert_eq!(metric.publicly_enabled_by, None);
    assert_eq!(metric.public_password, None);
    assert!(metric.public_expiry_date.is_some()); // Unchanged since NoChange

    // Test 4: Clear all public settings
    let request = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: Some(false),
        public_password: UpdateField::SetNull,
        public_expiry_date: UpdateField::SetNull,
    };

    let result = update_metric_sharing_handler(&metric_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify all public settings cleared
    let metric = fetch_metric_with_permission(&metric_id, &setup.user.id).await?;
    assert!(!metric.publicly_accessible);
    assert_eq!(metric.publicly_enabled_by, None);
    assert_eq!(metric.public_password, None);
    assert_eq!(metric.public_expiry_date, None);

    Ok(())
}

#[tokio::test]
async fn test_dashboard_public_updates() -> Result<()> {
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test dashboard
    let dashboard_id = AssetTestHelpers::create_test_dashboard(
        &setup.db,
        "Test Dashboard",
        setup.organization.id
    ).await?;

    // Test 1: Make public with expiry but no password
    let request = UpdateDashboardSharingRequest {
        users: None,
        publicly_accessible: Some(true),
        public_password: UpdateField::NoChange,
        public_expiry_date: UpdateField::Update(Utc::now() + Duration::days(7)),
    };

    let result = update_dashboard_sharing_handler(&dashboard_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify updates
    let dashboard = fetch_dashboard_with_permission(&dashboard_id, &setup.user.id).await?;
    assert!(dashboard.publicly_accessible);
    assert_eq!(dashboard.publicly_enabled_by, Some(setup.user.id));
    assert_eq!(dashboard.public_password, None);
    assert!(dashboard.public_expiry_date.is_some());

    // Test 2: Add password to public dashboard
    let request = UpdateDashboardSharingRequest {
        users: None,
        publicly_accessible: None, // Don't change
        public_password: UpdateField::Update("dashpass123".to_string()),
        public_expiry_date: UpdateField::NoChange,
    };

    let result = update_dashboard_sharing_handler(&dashboard_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify password added
    let dashboard = fetch_dashboard_with_permission(&dashboard_id, &setup.user.id).await?;
    assert!(dashboard.publicly_accessible); // Still public
    assert_eq!(dashboard.publicly_enabled_by, Some(setup.user.id));
    assert_eq!(dashboard.public_password, Some("dashpass123".to_string()));
    assert!(dashboard.public_expiry_date.is_some()); // Unchanged

    // Test 3: Update expiry only
    let new_expiry = Utc::now() + Duration::days(14);
    let request = UpdateDashboardSharingRequest {
        users: None,
        publicly_accessible: None,
        public_password: UpdateField::NoChange,
        public_expiry_date: UpdateField::Update(new_expiry),
    };

    let result = update_dashboard_sharing_handler(&dashboard_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify only expiry updated
    let dashboard = fetch_dashboard_with_permission(&dashboard_id, &setup.user.id).await?;
    assert!(dashboard.publicly_accessible); // Unchanged
    assert_eq!(dashboard.publicly_enabled_by, Some(setup.user.id));
    assert_eq!(dashboard.public_password, Some("dashpass123".to_string())); // Unchanged
    assert!(dashboard.public_expiry_date.unwrap().timestamp() == new_expiry.timestamp());

    // Test 4: Make private but keep password and expiry
    let request = UpdateDashboardSharingRequest {
        users: None,
        publicly_accessible: Some(false),
        public_password: UpdateField::NoChange,
        public_expiry_date: UpdateField::NoChange,
    };

    let result = update_dashboard_sharing_handler(&dashboard_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify made private but kept other settings
    let dashboard = fetch_dashboard_with_permission(&dashboard_id, &setup.user.id).await?;
    assert!(!dashboard.publicly_accessible);
    assert_eq!(dashboard.publicly_enabled_by, None);
    assert_eq!(dashboard.public_password, Some("dashpass123".to_string())); // Unchanged
    assert!(dashboard.public_expiry_date.is_some()); // Unchanged

    // Test 5: Clear all public settings
    let request = UpdateDashboardSharingRequest {
        users: None,
        publicly_accessible: Some(false),
        public_password: UpdateField::SetNull,
        public_expiry_date: UpdateField::SetNull,
    };

    let result = update_dashboard_sharing_handler(&dashboard_id, &setup.user, request).await;
    assert!(result.is_ok());

    // Verify all public settings cleared
    let dashboard = fetch_dashboard_with_permission(&dashboard_id, &setup.user.id).await?;
    assert!(!dashboard.publicly_accessible);
    assert_eq!(dashboard.publicly_enabled_by, None);
    assert_eq!(dashboard.public_password, None);
    assert_eq!(dashboard.public_expiry_date, None);

    Ok(())
}

#[tokio::test]
async fn test_public_update_edge_cases() -> Result<()> {
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test metric
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric",
        setup.organization.id
    ).await?;

    // Test 1: Make public with expired date (should fail)
    let request = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: Some(true),
        public_password: UpdateField::NoChange,
        public_expiry_date: UpdateField::Update(Utc::now() - Duration::days(1)),
    };

    let result = update_metric_sharing_handler(&metric_id, &setup.user, request).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("expiry date must be in the future"));

    // Test 2: Update with empty password (should fail)
    let request = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: Some(true),
        public_password: UpdateField::Update("".to_string()),
        public_expiry_date: UpdateField::NoChange,
    };

    let result = update_metric_sharing_handler(&metric_id, &setup.user, request).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("password cannot be empty"));

    // Test 3: Concurrent updates
    let concurrent_setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;

    let request1 = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: Some(true),
        public_password: UpdateField::Update("pass1".to_string()),
        public_expiry_date: UpdateField::NoChange,
    };

    let request2 = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: Some(true),
        public_password: UpdateField::Update("pass2".to_string()),
        public_expiry_date: UpdateField::NoChange,
    };

    let (result1, result2) = tokio::join!(
        update_metric_sharing_handler(&metric_id, &setup.user, request1),
        update_metric_sharing_handler(&metric_id, &concurrent_setup.user, request2)
    );

    assert!(result1.is_ok() || result2.is_ok()); // At least one should succeed
    
    // Verify final state (last write wins)
    let metric = fetch_metric_with_permission(&metric_id, &setup.user.id).await?;
    assert!(metric.publicly_accessible);
    assert!(metric.public_password == Some("pass1".to_string()) || 
           metric.public_password == Some("pass2".to_string()));

    Ok(())
}

#[tokio::test]
async fn test_public_update_permissions() -> Result<()> {
    // Test with viewer role (should not be able to update public settings)
    let setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric",
        setup.organization.id
    ).await?;

    let request = UpdateMetricSharingRequest {
        users: None,
        publicly_accessible: Some(true),
        public_password: UpdateField::NoChange,
        public_expiry_date: UpdateField::NoChange,
    };

    let result = update_metric_sharing_handler(&metric_id, &setup.user, request).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("permission"));

    Ok(())
}
```

These tests cover:

1. Metric Public Updates:
   - Making public with password and expiry
   - Removing password while keeping public
   - Making private
   - Clearing all public settings

2. Dashboard Public Updates:
   - Making public with expiry only
   - Adding password to public dashboard
   - Updating expiry only
   - Making private while keeping settings
   - Clearing all public settings

3. Edge Cases:
   - Expired dates
   - Empty passwords
   - Concurrent updates
   - Permission checks

Each test verifies:
- Correct field updates
- Field preservation when using `NoChange`
- Proper null handling with `SetNull`
- Proper enabled_by updates
- Permission enforcement

Would you like me to implement any additional test cases or modify the existing ones?

## Implementation Plan

### Phase 1: Type Updates
1. [x] Add `UpdateField` enum
2. [x] Update sharing request structs
3. [x] Add helper methods for diesel conversion

### Phase 2: Handler Updates
1. [x] Update metric sharing handler
2. [x] Update dashboard sharing handler
3. [x] Add changeset logic
4. [x] Update tests

### Phase 3: REST Updates
1. [x] Update REST handlers for new types
2. [x] Add request validation
3. [x] Update error handling

## Success Criteria
1. [x] Clear distinction between null and no-change cases
2. [x] Proper handling of public sharing fields
3. [x] Consistent behavior across assets
4. [x] All tests passing

## References

### Related Files
- `libs/handlers/src/metrics/sharing/update_sharing_handler.rs`
- `libs/handlers/src/dashboards/sharing/update_sharing_handler.rs`
- `server/src/routes/rest/routes/metrics/sharing/update_sharing.rs`
- `server/src/routes/rest/routes/dashboards/sharing/update_sharing.rs`

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