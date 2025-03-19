# API Metrics REST Endpoints

## Problem Statement
Currently, the metrics API only supports GET operations through REST endpoints, which limits the ability to manage metrics through the API. Users need to be able to update and delete metrics through REST endpoints to provide a complete CRUD interface for metrics management.

### Current State
- The metrics REST API currently only supports:
  - GET /metrics - List metrics
  - GET /metrics/:id - Get a specific metric
  - GET /metrics/:id/data - Get metric data

### Desired State
- Add the following endpoints:
  - PUT /metrics/:id - Update a metric
  - DELETE /metrics/:id - Delete a metric

### Impact
- Enables full CRUD operations for metrics through REST API
- Improves developer experience by providing consistent API patterns
- Allows for programmatic management of metrics

## Technical Design

### Components Affected
- REST API routes for metrics
- Metrics handlers in the handlers library

### New Files
1. `/src/routes/rest/routes/metrics/update_metric.rs` - REST handler for updating metrics
2. `/src/routes/rest/routes/metrics/delete_metric.rs` - REST handler for deleting metrics
3. `/libs/handlers/src/metrics/update_metric_handler.rs` - Business logic for updating metrics
4. `/libs/handlers/src/metrics/delete_metric_handler.rs` - Business logic for deleting metrics

### Modified Files
1. `/src/routes/rest/routes/metrics/mod.rs` - Add new routes
2. `/libs/handlers/src/metrics/mod.rs` - Export new handlers
3. `/libs/handlers/src/metrics/types.rs` - Add new request types if needed

### Detailed Design

#### 1. Update Metric Endpoint (PUT /metrics/:id)

**Request Structure:**
```rust
#[derive(Debug, Deserialize)]
pub struct UpdateMetricRequest {
    pub title: Option<String>,
    pub sql: Option<String>,
    pub chart_config: Option<Value>,
    pub status: Option<Verification>,
    pub file: Option<String>,
}
```

**Handler Implementation:**
```rust
// update_metric.rs
pub async fn update_metric_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateMetricRequest>,
) -> Result<ApiResponse<BusterMetric>, (StatusCode, String)> {
    tracing::info!(
        "Processing PUT request for metric with ID: {}, user_id: {}",
        id,
        user.id
    );

    match update_metric_handler(&id, &user.id, request).await {
        Ok(updated_metric) => Ok(ApiResponse::JsonData(updated_metric)),
        Err(e) => {
            tracing::error!("Error updating metric: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update metric: {}", e)))
        }
    }
}
```

**Business Logic:**
The update_metric_handler will:
1. Validate the user has permission to update the metric
2. Fetch the existing metric
3. Update the fields provided in the request
4. Update the MetricYml content based on the provided fields
5. Save the updated metric to the database
6. Return the updated metric

#### 2. Delete Metric Endpoint (DELETE /metrics/:id)

**Handler Implementation:**
```rust
// delete_metric.rs
pub async fn delete_metric_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<()>, (StatusCode, String)> {
    tracing::info!(
        "Processing DELETE request for metric with ID: {}, user_id: {}",
        id,
        user.id
    );

    match delete_metric_handler(&id, &user.id).await {
        Ok(_) => Ok(ApiResponse::Success("Metric deleted successfully".to_string())),
        Err(e) => {
            tracing::error!("Error deleting metric: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete metric: {}", e)))
        }
    }
}
```

**Business Logic:**
The delete_metric_handler will:
1. Validate the user has permission to delete the metric
2. Soft delete the metric by setting the deleted_at field to the current UTC timestamp
3. Return success

### Access Control
For the initial implementation, we will stub out access controls. Future iterations will implement proper access control based on the organization and user permissions.

## Implementation Plan

### Phase 1: Update Metric Endpoint
1. Create update_metric_handler.rs in libs/handlers/src/metrics
2. Update libs/handlers/src/metrics/mod.rs to export the new handler
3. Create update_metric.rs in src/routes/rest/routes/metrics
4. Update src/routes/rest/routes/metrics/mod.rs to include the new route
5. Test the endpoint with Postman/curl

### Phase 2: Delete Metric Endpoint
1. Create delete_metric_handler.rs in libs/handlers/src/metrics
2. Update libs/handlers/src/metrics/mod.rs to export the new handler
3. Create delete_metric.rs in src/routes/rest/routes/metrics
4. Update src/routes/rest/routes/metrics/mod.rs to include the new route
5. Test the endpoint with Postman/curl

## Testing Strategy

### Unit Tests
- Test update_metric_handler with various input combinations
- Test delete_metric_handler for successful deletion and error cases

### Integration Tests
- Test PUT /metrics/:id with valid and invalid payloads
- Test DELETE /metrics/:id with valid and invalid IDs
- Test error handling for both endpoints

### Manual Testing
- Use Postman/curl to verify the endpoints work as expected
- Verify metrics are properly updated in the database
- Verify metrics are properly marked as deleted

## Dependencies

### Files
- `/libs/database/src/models.rs` - MetricFile model
- `/libs/database/src/schema.rs` - Database schema
- `/libs/database/src/types/metric_yml.rs` - MetricYml type
- `/libs/database/src/enums.rs` - Verification enum

## File References
- `/src/routes/rest/routes/metrics/get_metric.rs`
- `/libs/handlers/src/metrics/get_metric_handler.rs`
- `/libs/handlers/src/metrics/types.rs`

## Security Considerations
- All endpoints require authentication
- Authorization will be stubbed for now but should be implemented in the future
- Input validation must be thorough to prevent SQL injection

## Monitoring and Logging
- All endpoint calls should be logged with tracing
- Errors should be logged with appropriate context
- Metrics should be collected for endpoint performance

## Rollback Plan
If issues are discovered:
1. Revert the changes to the affected files
2. Deploy the previous version
3. Investigate and fix the issues in a new PR
