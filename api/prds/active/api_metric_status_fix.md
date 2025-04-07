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

Expected behavior:
- Status field from request updates metric file
- Status changes are persisted
- Status values are validated

## Goals

1. Fix status field propagation in update handler
2. Add status field validation
3. Add tests for status updates
4. Document status field behavior

## Non-Goals

1. Changing status field schema
2. Adding new status values
3. Modifying status field behavior
4. Adding status-related features

## Technical Design

### Overview

The fix involves modifying the `update_metric_handler` to properly handle the status field and adding appropriate tests using the new test infrastructure.

### File Changes

1. Update the update handler:

```rust
// libs/handlers/src/metrics/update_metric_handler.rs

pub async fn update_metric_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateMetricRequest,
) -> Result<BusterMetric> {
    // ... existing permission checks ...

    // Build update query - include verification in main update
    let builder = diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null());

    // Update based on whether verification and metadata are provided
    let update_result = if let Some(verification) = request.verification {
        if let Some(metadata) = data_metadata {
            builder
                .set((
                    metric_files::name.eq(content.name.clone()),
                    metric_files::verification.eq(verification), // Include verification
                    metric_files::content.eq(content_json),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::version_history.eq(current_version_history),
                    metric_files::data_metadata.eq(metadata),
                ))
                .execute(&mut conn)
                .await
        } else {
            builder
                .set((
                    metric_files::name.eq(content.name.clone()),
                    metric_files::verification.eq(verification), // Include verification
                    metric_files::content.eq(content_json),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::version_history.eq(current_version_history),
                ))
                .execute(&mut conn)
                .await
        }
    } else {
        if let Some(metadata) = data_metadata {
            builder
                .set((
                    metric_files::name.eq(content.name.clone()),
                    metric_files::content.eq(content_json),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::version_history.eq(current_version_history),
                    metric_files::data_metadata.eq(metadata),
                ))
                .execute(&mut conn)
                .await
        } else {
            builder
                .set((
                    metric_files::name.eq(content.name.clone()),
                    metric_files::content.eq(content_json),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::version_history.eq(current_version_history),
                ))
                .execute(&mut conn)
                .await
        }
    };

    match update_result {
        Ok(_) => get_metric_handler(metric_id, user, None).await,
        Err(e) => Err(anyhow!("Failed to update metric: {}", e)),
    }
}
```

2. Add tests:

```rust
// libs/handlers/tests/metrics/update_metric_test.rs

#[tokio::test]
async fn test_update_metric_status() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test metric
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric",
        setup.organization.id
    ).await?;
    
    // Add owner permission
    PermissionTestHelpers::create_permission(
        &setup.db,
        metric_id,
        setup.user.id,
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
    assert_eq!(updated_metric.status, Verification::Verified);
    
    // Verify database was updated
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
    
    // Create test metric
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric",
        setup.organization.id
    ).await?;
    
    // Add view-only permission
    PermissionTestHelpers::create_permission(
        &setup.db,
        metric_id,
        setup.user.id,
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
    
    // Verify status was not updated
    let mut conn = setup.db.diesel_conn().await?;
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_ne!(db_metric.verification, Verification::Verified);
    
    Ok(())
}
```

### Dependencies

1. Test infrastructure from [Test Infrastructure Setup](api_test_infrastructure.md)
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

1. Implement test cases using new infrastructure
2. Test all status update scenarios
3. Test permission requirements
4. Test error cases

## Testing Strategy

### Unit Tests

- Test status field validation
- Test permission requirements
- Test error handling
- Test default behavior

### Integration Tests

- Test complete update workflow
- Verify database state
- Test concurrent updates
- Test version history

## Success Criteria

1. Status updates are persisted correctly
2. All tests pass
3. No regressions in other functionality
4. Documentation is updated

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