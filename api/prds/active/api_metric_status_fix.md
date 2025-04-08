---
title: Metric Status Update Fix
author: Claude
date: 2024-04-07
status: Draft
parent_prd: project_bug_fixes_and_testing.md
ticket: BUS-1069
---

# Metric Status Update Fix

## Problem Statement

The metric status field is not being properly propagated to the metric_file object when updates are made. Currently, when a metric is updated through the `update_metric_handler`, the status field in the request is not being included in the database update operation.

Current behavior:
- Status field in update request is ignored
- Metric file status remains unchanged
- No validation of status values
- Lack of comprehensive testing around status updates

Expected behavior:
- Status field from request updates metric file
- Status changes are persisted
- Status values are validated
- Comprehensive test coverage using new test infrastructure

Impact:
- User Impact: Metric status not reflecting actual state
- System Impact: Inconsistent metric state
- Testing Impact: Missing edge cases and validation

## Goals

1. Fix status field propagation in update handler
2. Add status field validation
3. Implement comprehensive tests using new test infrastructure
4. Document status field behavior and testing patterns

## Non-Goals

1. Changing status field schema
2. Adding new status values
3. Modifying status field behavior
4. Adding status-related features

## Technical Design

### Overview

The fix involves modifying the `update_metric_handler` to properly handle the status field and adding comprehensive tests using the new test infrastructure.

### File Changes

1. Update the update handler:

```rust
// libs/handlers/src/metrics/update_metric_handler.rs

#[derive(AsChangeset)]
#[diesel(table_name = metric_files)]
struct MetricFileChangeset {
    name: String,
    content: serde_json::Value,
    updated_at: DateTime<Utc>,
    version_history: VersionHistory,
    verification: Option<Verification>,
    data_metadata: Option<DataMetadata>,
}

pub async fn update_metric_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateMetricRequest,
) -> Result<BusterMetric> {
    // ... existing permission checks ...

    // Convert content to JSON for storage
    let content_json = serde_json::to_value(content.clone())?;

    // Create changeset for update
    let changeset = MetricFileChangeset {
        name: content.name.clone(),
        content: content_json,
        updated_at: Utc::now(),
        version_history: current_version_history,
        verification: request.verification,
        data_metadata: data_metadata,
    };

    // Execute the update
    let update_result = diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .set(changeset)
        .execute(&mut conn)
        .await;

    match update_result {
        Ok(_) => get_metric_handler(metric_id, user, None).await,
        Err(e) => Err(anyhow!("Failed to update metric: {}", e)),
    }
}
```

2. Add tests using new infrastructure:

```rust
// libs/handlers/tests/metrics/update_metric_test.rs

use database::tests::common::{TestDb, TestSetup};
use database::tests::common::permissions::PermissionTestHelpers;
use database::tests::common::assets::AssetTestHelpers;

#[tokio::test]
async fn test_update_metric_status() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test metric using asset helpers
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric"
    ).await?;
    
    // Add owner permission using permission helpers
    PermissionTestHelpers::create_permission(
        &setup.db,
        metric_id,
        AssetPermissionRole::Owner
    ).await?;
    
    // Create update request with new status
    let request = UpdateMetricRequest {
        verification: Some(Verification::Verified),
        ..Default::default()
    };
    
    // Update metric
    let updated_metric = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await?;
    
    // Verify status was updated
    assert_eq!(updated_metric.verification, Verification::Verified);
    
    // Verify database was updated using test db connection
    let mut conn = setup.db.diesel_conn().await?;
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_eq!(db_metric.verification, Verification::Verified);
    
    Ok(())
}

#[tokio::test]
async fn test_update_metric_status_unauthorized() -> Result<()> {
    // Create test setup with viewer role
    let setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    // Create test metric using asset helpers
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric"
    ).await?;
    
    // Add view-only permission using permission helpers
    PermissionTestHelpers::create_permission(
        &setup.db,
        metric_id,
        AssetPermissionRole::CanView
    ).await?;
    
    // Create update request with new status
    let request = UpdateMetricRequest {
        verification: Some(Verification::Verified),
        ..Default::default()
    };
    
    // Attempt update should fail
    let result = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await;
    
    assert!(result.is_err());
    
    // Verify status was not updated using test db connection
    let mut conn = setup.db.diesel_conn().await?;
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_ne!(db_metric.verification, Verification::Verified);
    
    Ok(())
}

#[tokio::test]
async fn test_update_metric_status_edge_cases() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test metric using asset helpers
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric"
    ).await?;
    
    // Add editor permission using permission helpers
    PermissionTestHelpers::create_permission(
        &setup.db,
        metric_id,
        AssetPermissionRole::CanEdit
    ).await?;
    
    // Test edge cases
    
    // Case 1: Update with null verification
    let request = UpdateMetricRequest {
        verification: None,
        ..Default::default()
    };
    
    let result = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await?;
    
    // Verify original status preserved
    assert_eq!(result.verification, Verification::Unverified);
    
    // Case 2: Update with invalid verification (should be handled by type system)
    
    // Case 3: Concurrent updates
    let concurrent_setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Add permission for concurrent user
    PermissionTestHelpers::create_permission(
        &concurrent_setup.db,
        metric_id,
        AssetPermissionRole::CanEdit
    ).await?;
    
    // Attempt concurrent updates
    let request1 = UpdateMetricRequest {
        verification: Some(Verification::Verified),
        ..Default::default()
    };
    
    let request2 = UpdateMetricRequest {
        verification: Some(Verification::Invalid),
        ..Default::default()
    };
    
    let (result1, result2) = tokio::join!(
        update_metric_handler(&metric_id, &setup.user, request1),
        update_metric_handler(&metric_id, &concurrent_setup.user, request2)
    );
    
    // Both updates should succeed, last one wins
    assert!(result1.is_ok());
    assert!(result2.is_ok());
    
    // Verify final state
    let mut conn = setup.db.diesel_conn().await?;
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    // Last update should win
    assert_eq!(db_metric.verification, Verification::Invalid);
    
    Ok(())
}
```

### Dependencies

1. Test infrastructure from [Test Infrastructure Setup](api_test_infrastructure.md)
   - TestDb for database connections
   - TestSetup for user/org creation
   - PermissionTestHelpers for permission management
   - AssetTestHelpers for metric creation
2. Existing metric update handler
3. Database schema and models
4. Permission system

## Implementation Plan

### Phase 1: Fix Implementation

1. Update the handler code to include status field
2. Add validation for status values
3. Ensure proper error handling
4. Update documentation

### Phase 2: Testing

1. Implement test cases using new test infrastructure:
   - Basic status update tests
   - Permission validation tests
   - Edge case tests
   - Concurrent update tests
2. Verify test isolation using TestDb
3. Validate cleanup functionality

## Testing Strategy

### Unit Tests

1. Status Update Tests
   - Test successful status update
   - Verify database state after update
   - Check version history updates

2. Permission Tests
   - Test updates with different user roles
   - Verify unauthorized updates fail
   - Test permission inheritance

3. Edge Case Tests
   - Test null status updates
   - Test invalid status values
   - Test concurrent updates

### Integration Tests

1. API Tests
   - Test API endpoint with status updates
   - Verify response format
   - Check error handling

2. Workflow Tests
   - Test status updates in full workflow
   - Verify status propagation
   - Test with other metric operations

### Test Data Management

Using the new test infrastructure:
- Unique test IDs for isolation
- Automatic cleanup after tests
- Standardized test data creation

## Success Criteria

1. All tests passing using new infrastructure
2. Status updates working correctly
3. Proper error handling implemented
4. Test coverage for edge cases
5. Documentation updated

## Security Considerations

1. Permission Validation
   - Risk: Unauthorized status updates
   - Mitigation: Comprehensive permission tests
   - Testing: Role-based access tests

2. Data Integrity
   - Risk: Invalid status values
   - Mitigation: Status validation
   - Testing: Edge case validation

## References

- [Test Infrastructure Documentation](api_test_infrastructure.md)
- [Metric Handler Documentation](link_to_docs)
- [Database Schema](link_to_schema)

## Rollout Plan

1. Implement fix with tests
2. Review and validate changes
3. Deploy to staging
4. Monitor for issues
5. Deploy to production

## Appendix

### Related Files

- `libs/handlers/src/metrics/update_metric_handler.rs`
- `libs/handlers/tests/metrics/update_metric_test.rs`
- `libs/database/schema.rs` 