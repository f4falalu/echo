---
title: Bulk Metric Status Update Endpoint
author: Claude
date: 2024-04-07
status: Draft
parent_prd: project_bug_fixes_and_testing.md
ticket: BUS-1070
---

# Bulk Metric Status Update Endpoint

## Problem Statement

Currently, metric verification statuses can only be updated one at a time through the `update_metric_handler`. This creates inefficiency when users need to update the status of multiple metrics simultaneously.

Current behavior:
- Each metric status update requires a separate API call
- High latency for bulk operations (N API calls for N metrics)
- Increased network traffic and server load
- No atomic batch update capability
- Inconsistent state during partial failures
- No way to track bulk update progress
- Higher chance of rate limiting issues

Expected behavior:
- Single API call for multiple metric updates
- Efficient batch processing with concurrent updates
- Reduced network overhead and server load
- Partial success handling with detailed error reporting
- Atomic updates within batches
- Clear progress tracking for bulk operations
- Proper rate limiting for bulk requests

Impact:
- User Impact: Slower workflow for bulk operations, poor UX for mass updates
- System Impact: Increased server load from multiple requests, inefficient resource usage
- Performance Impact: Higher latency, more network traffic, potential timeouts
- Reliability Impact: Higher failure rate due to multiple requests

## Goals

1. Implement bulk update endpoint for metric statuses with single API call
2. Support concurrent processing with batched updates (50 metrics per batch)
3. Handle partial failures gracefully with detailed error reporting
4. Maintain consistency with single update behavior and permissions
5. Provide clear success/failure status for each metric
6. Implement comprehensive testing with all edge cases covered

## Non-Goals

1. Changing metric status schema or adding new status values
2. Modifying existing single update endpoint behavior
3. Changing permission model or access control
4. Modifying metric file structure or validation rules
5. Adding new metric fields or metadata

## Implementation Plan

### Phase 1: Handler Implementation ⏳ (In Progress)

#### Technical Design

```rust
// libs/handlers/src/metrics/types.rs
#[derive(Debug, Serialize, Deserialize)]
pub struct BulkUpdateMetricsRequest {
    pub updates: Vec<MetricStatusUpdate>,
    #[serde(default = "default_batch_size")]
    pub batch_size: usize,  // Optional batch size, defaults to 50
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricStatusUpdate {
    pub id: Uuid,
    pub verification: VerificationEnum,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkUpdateMetricsResponse {
    pub updated_metrics: Vec<BusterMetric>,
    pub failed_updates: Vec<FailedMetricUpdate>,
    pub total_processed: usize,
    pub success_count: usize,
    pub failure_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FailedMetricUpdate {
    pub metric_id: Uuid,
    pub error: String,
    pub error_code: String,  // Specific error code for client handling
}

// libs/handlers/src/metrics/bulk_update_metrics_handler.rs
pub async fn bulk_update_metrics_handler(
    updates: Vec<MetricStatusUpdate>,
    batch_size: Option<usize>,
    user: &AuthenticatedUser,
) -> Result<BulkUpdateMetricsResponse> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    let batch_size = batch_size.unwrap_or(50);
    
    tracing::info!(
        user_id = %user.id,
        update_count = updates.len(),
        batch_size = batch_size,
        "Starting bulk metric status update"
    );

    let mut updated_metrics = Vec::with_capacity(updates.len());
    let mut failed_updates = Vec::new();

    // Process in batches
    for chunk in updates.chunks(batch_size) {
        let futures: Vec<_> = chunk
            .iter()
            .map(|update| process_single_update(&mut conn, update, user))
            .collect();

        let results = try_join_all(futures).await?;

        for (update, result) in chunk.iter().zip(results) {
            match result {
                Ok(metric) => updated_metrics.push(metric),
                Err(e) => {
                    tracing::warn!(
                        metric_id = %update.id,
                        error = %e,
                        "Failed to update metric status"
                    );
                    failed_updates.push(FailedMetricUpdate {
                        metric_id: update.id,
                        error: e.to_string(),
                        error_code: map_error_to_code(&e),
                    });
                }
            }
        }
    }

    Ok(BulkUpdateMetricsResponse {
        total_processed: updates.len(),
        success_count: updated_metrics.len(),
        failure_count: failed_updates.len(),
        updated_metrics,
        failed_updates,
    })
}
```

#### Implementation Steps

1. [ ] Add new types for bulk update request/response
   - Define request/response structs
   - Add validation for batch size
   - Add error code mapping
   - Add comprehensive documentation

2. [ ] Implement bulk update handler
   - Add batch processing logic
   - Implement concurrent updates
   - Add error handling and logging
   - Add metrics collection
   - Add permission validation

3. [ ] Add REST endpoint implementation
   - Add route handler
   - Add request validation
   - Add error handling
   - Configure rate limiting
   - Add response formatting

4. [ ] Add comprehensive tests
   - Unit tests for handler
   - Integration tests for endpoint
   - Performance tests
   - Error case testing

#### Tests

##### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use database::tests::common::TestDb;
    use database::tests::common::permissions::PermissionTestHelpers;
    use database::tests::common::assets::AssetTestHelpers;

    #[tokio::test]
    async fn test_successful_bulk_update() -> Result<()> {
        let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
        
        // Create test metrics
        let metric_ids = create_test_metrics(&setup, 5).await?;
        let updates = create_test_updates(&metric_ids, Verification::Verified);
        
        let result = bulk_update_metrics_handler(updates, None, &setup.user).await?;
        
        assert_eq!(result.success_count, 5);
        assert_eq!(result.failure_count, 0);
        assert!(result.failed_updates.is_empty());
        
        // Verify database state
        verify_metric_statuses(&setup, &metric_ids, Verification::Verified).await?;
        
        Ok(())
    }

    #[tokio::test]
    async fn test_partial_failure() -> Result<()> {
        let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
        
        // Create mix of accessible and inaccessible metrics
        let (allowed_metrics, denied_metrics) = create_mixed_permission_metrics(&setup).await?;
        let updates = create_mixed_updates(&allowed_metrics, &denied_metrics);
        
        let result = bulk_update_metrics_handler(updates, None, &setup.user).await?;
        
        assert_eq!(result.success_count, allowed_metrics.len());
        assert_eq!(result.failure_count, denied_metrics.len());
        
        // Verify correct error codes
        for failed in result.failed_updates {
            assert_eq!(failed.error_code, "PERMISSION_DENIED");
        }
        
        Ok(())
    }

    #[tokio::test]
    async fn test_concurrent_updates() -> Result<()> {
        let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
        
        // Create large batch of metrics
        let metric_ids = create_test_metrics(&setup, 100).await?;
        let updates = create_test_updates(&metric_ids, Verification::Verified);
        
        // Test with different batch sizes
        let batch_sizes = vec![10, 25, 50];
        
        for batch_size in batch_sizes {
            let start = Instant::now();
            let result = bulk_update_metrics_handler(
                updates.clone(), 
                Some(batch_size), 
                &setup.user
            ).await?;
            
            let duration = start.elapsed();
            
            assert_eq!(result.success_count, 100);
            assert!(duration < Duration::from_secs(2), 
                "Update took too long with batch_size {}", batch_size);
        }
        
        Ok(())
    }
}
```

##### Integration Tests
```rust
#[tokio::test]
async fn test_bulk_update_endpoint() -> Result<()> {
    let app = test::init_test_app().await;
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Test Scenario: Successful bulk update
    let test_metrics = create_test_metrics(&setup, 10).await?;
    let request = BulkUpdateMetricsRequest {
        updates: create_test_updates(&test_metrics, Verification::Verified),
        batch_size: Some(5),
    };
    
    let response = app
        .put("/metrics")
        .header("Authorization", &setup.auth_token)
        .json(&request)
        .send()
        .await?;
        
    assert_eq!(response.status(), StatusCode::OK);
    
    let body: BulkUpdateMetricsResponse = response.json().await?;
    assert_eq!(body.success_count, 10);
    
    // Test Scenario: Invalid batch size
    let response = app
        .put("/metrics")
        .header("Authorization", &setup.auth_token)
        .json(&BulkUpdateMetricsRequest {
            updates: vec![],
            batch_size: Some(1001), // Too large
        })
        .send()
        .await;
        
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    
    // Test Scenario: Rate limiting
    let large_batch = create_test_updates(&create_test_metrics(&setup, 1000).await?, Verification::Verified);
    
    let responses = join_all((0..10).map(|_| {
        app.put("/metrics")
           .header("Authorization", &setup.auth_token)
           .json(&BulkUpdateMetricsRequest {
               updates: large_batch.clone(),
               batch_size: None,
           })
           .send()
    })).await;
    
    assert!(responses.iter().any(|r| r.status() == StatusCode::TOO_MANY_REQUESTS));
    
    Ok(())
}
```

#### Success Criteria
- [ ] All unit tests pass with 100% coverage of handler code
- [ ] Integration tests verify all success and error cases
- [ ] Performance tests show acceptable latency (<2s for 100 updates)
- [ ] Error handling correctly identifies and reports all failure cases
- [ ] Logging provides clear audit trail of all operations
- [ ] Rate limiting prevents abuse of the endpoint

### Phase 2: Monitoring and Metrics 🔜 (Not Started)

[Similar structure to Phase 1 - will detail monitoring implementation]

## Security Considerations

1. Authentication & Authorization
   - Risk: Unauthorized bulk updates
   - Mitigation: Validate user permissions for each metric
   - Testing: Test with different user roles and permissions

2. Rate Limiting
   - Risk: DoS from large/frequent bulk requests
   - Mitigation: Implement per-user rate limits
   - Testing: Verify rate limit enforcement

3. Input Validation
   - Risk: Invalid/malicious input data
   - Mitigation: Strict request validation
   - Testing: Test with invalid/malformed requests

4. Audit Logging
   - Risk: Lack of accountability
   - Mitigation: Comprehensive logging of all operations
   - Testing: Verify audit log completeness

## Dependencies

1. Metric Update Handler
   - Interface changes: None
   - Testing requirements: Verify compatibility
   - Integration points: Reuse existing permission checks

2. Database Schema
   - Interface changes: None
   - Testing requirements: Verify concurrent updates
   - Performance requirements: Monitor connection pool

3. Test Infrastructure
   - Requirements: Use TestDb and TestSetup
   - Integration: Follow testing best practices
   - Coverage: Ensure comprehensive test coverage

## References

- [Metric Status Update Fix](api_metric_status_fix.md)
- [Test Infrastructure](api_test_infrastructure.md)
- [Project Bug Fixes](project_bug_fixes_and_testing.md)
- [REST API Guidelines](rest.md)
- [Handler Guidelines](handlers.md)
- [Testing Guidelines](testing.md)

## Rollout Plan

1. Development
   - Implement handler
   - Create endpoint
   - Add tests

2. Testing
   - Unit testing
   - Integration testing
   - Performance testing

3. Deployment
   - Deploy to staging
   - Monitor performance
   - Deploy to production

## Appendix

### Related Files

- `libs/handlers/src/metrics/bulk_update_metrics_handler.rs`
- `libs/handlers/src/metrics/types.rs`
- `server/src/routes/rest/routes/metrics/bulk_update_metrics.rs`
- `server/src/routes/rest/routes/metrics/mod.rs`

### Testing Examples

```rust
#[tokio::test]
async fn test_bulk_update_metrics() -> Result<()> {
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Create test metrics
    let metric_ids = vec![
        AssetTestHelpers::create_test_metric(&setup.db, "Test Metric 1").await?,
        AssetTestHelpers::create_test_metric(&setup.db, "Test Metric 2").await?,
    ];
    
    // Add permissions
    for metric_id in &metric_ids {
        PermissionTestHelpers::create_permission(
            &setup.db,
            *metric_id,
            AssetPermissionRole::CanEdit
        ).await?;
    }
    
    // Create update request
    let updates = metric_ids
        .iter()
        .map(|id| MetricStatusUpdate {
            id: *id,
            verification: Verification::Verified,
        })
        .collect();
    
    // Perform bulk update
    let result = bulk_update_metrics_handler(updates, &setup.user).await?;
    
    // Verify results
    assert_eq!(result.updated_metrics.len(), metric_ids.len());
    assert!(result.failed_updates.is_empty());
    
    Ok(())
}
``` 