# API Metrics Sharing REST Endpoints

## Problem Statement
Currently, there is no way to manage sharing permissions for metrics through REST endpoints. Users need to be able to share metrics with other users, update sharing permissions, and remove sharing permissions through REST endpoints.

### Current State
- The metrics REST API currently only supports basic CRUD operations
- There is no way to manage sharing permissions for metrics through REST endpoints

### Desired State
- Add the following endpoints:
  - POST /metrics/:id/sharing - Share a metric with users
  - PUT /metrics/:id/sharing - Update sharing permissions for users
  - DELETE /metrics/:id/sharing - Remove sharing permissions for users

### Impact
- Enables programmatic management of metric sharing permissions
- Improves collaboration capabilities for metrics
- Provides consistent API patterns for resource sharing across the application

## Technical Design

### Components Affected
- REST API routes for metrics
- Handlers for managing metric sharing permissions

### New Files
1. `/src/routes/rest/routes/metrics/sharing/mod.rs` - Router configuration for sharing endpoints
2. `/src/routes/rest/routes/metrics/sharing/create_sharing.rs` - REST handler for creating sharing permissions
3. `/src/routes/rest/routes/metrics/sharing/update_sharing.rs` - REST handler for updating sharing permissions
4. `/src/routes/rest/routes/metrics/sharing/delete_sharing.rs` - REST handler for deleting sharing permissions
5. `/libs/handlers/src/metrics/sharing/mod.rs` - Export sharing handlers
6. `/libs/handlers/src/metrics/sharing/create_sharing_handler.rs` - Business logic for creating sharing permissions
7. `/libs/handlers/src/metrics/sharing/update_sharing_handler.rs` - Business logic for updating sharing permissions
8. `/libs/handlers/src/metrics/sharing/delete_sharing_handler.rs` - Business logic for deleting sharing permissions

### Modified Files
1. `/src/routes/rest/routes/metrics/mod.rs` - Add sharing router
2. `/libs/handlers/src/metrics/mod.rs` - Export sharing module

### Detailed Design

#### 1. Create Sharing Endpoint (POST /metrics/:id/sharing)

**Request Structure:**
```rust
#[derive(Debug, Deserialize)]
pub struct SharingRequest {
    pub emails: Vec<String>,
    pub role: AssetPermissionRole,
}
```

**Handler Implementation:**
```rust
// create_sharing.rs
pub async fn create_metric_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<SharingRequest>,
) -> Result<ApiResponse<()>, (StatusCode, String)> {
    tracing::info!(
        "Processing POST request for metric sharing with ID: {}, user_id: {}",
        id,
        user.id
    );

    match create_metric_sharing_handler(&id, &user.id, request.emails, request.role).await {
        Ok(_) => Ok(ApiResponse::Success("Sharing permissions created successfully".to_string())),
        Err(e) => {
            tracing::error!("Error creating sharing permissions: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create sharing permissions: {}", e)))
        }
    }
}
```

**Business Logic:**
The create_metric_sharing_handler will:
1. Validate the user has permission to share the metric
2. Validate the metric exists
3. Resolve email addresses to user IDs
4. Create AssetPermission entries for each user with the specified role
5. Return success

#### 2. Update Sharing Endpoint (PUT /metrics/:id/sharing)

**Request Structure:**
```rust
#[derive(Debug, Deserialize)]
pub struct SharingRequest {
    pub emails: Vec<String>,
    pub role: AssetPermissionRole,
}
```

**Handler Implementation:**
```rust
// update_sharing.rs
pub async fn update_metric_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<SharingRequest>,
) -> Result<ApiResponse<()>, (StatusCode, String)> {
    tracing::info!(
        "Processing PUT request for metric sharing with ID: {}, user_id: {}",
        id,
        user.id
    );

    match update_metric_sharing_handler(&id, &user.id, request.emails, request.role).await {
        Ok(_) => Ok(ApiResponse::Success("Sharing permissions updated successfully".to_string())),
        Err(e) => {
            tracing::error!("Error updating sharing permissions: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update sharing permissions: {}", e)))
        }
    }
}
```

**Business Logic:**
The update_metric_sharing_handler will:
1. Validate the user has permission to update sharing for the metric
2. Validate the metric exists
3. Resolve email addresses to user IDs
4. Update existing AssetPermission entries for each user with the new role
5. Return success

#### 3. Delete Sharing Endpoint (DELETE /metrics/:id/sharing)

**Request Structure:**
```rust
#[derive(Debug, Deserialize)]
pub struct DeleteSharingRequest {
    pub emails: Vec<String>,
}
```

**Handler Implementation:**
```rust
// delete_sharing.rs
pub async fn delete_metric_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<DeleteSharingRequest>,
) -> Result<ApiResponse<()>, (StatusCode, String)> {
    tracing::info!(
        "Processing DELETE request for metric sharing with ID: {}, user_id: {}",
        id,
        user.id
    );

    match delete_metric_sharing_handler(&id, &user.id, request.emails).await {
        Ok(_) => Ok(ApiResponse::Success("Sharing permissions deleted successfully".to_string())),
        Err(e) => {
            tracing::error!("Error deleting sharing permissions: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete sharing permissions: {}", e)))
        }
    }
}
```

**Business Logic:**
The delete_metric_sharing_handler will:
1. Validate the user has permission to delete sharing for the metric
2. Validate the metric exists
3. Resolve email addresses to user IDs
4. Soft delete AssetPermission entries for each user by setting deleted_at to current UTC timestamp
5. Return success

### Database Operations

For all endpoints, we'll be working with the AssetPermission table with the following fields:
- identity_id: The UUID of the user being granted access
- identity_type: Set to IdentityType::User
- asset_id: The UUID of the metric
- asset_type: Set to AssetType::MetricFile
- role: The AssetPermissionRole specified in the request
- created_at: Current UTC timestamp
- updated_at: Current UTC timestamp
- deleted_at: Null for active permissions, UTC timestamp for deleted permissions
- created_by: The UUID of the user making the request
- updated_by: The UUID of the user making the request

## Implementation Plan

### Phase 1: Create Sharing Endpoint
1. Create directory structure for sharing handlers and endpoints
2. Implement email to user ID resolution utility
3. Implement create_sharing_handler.rs
4. Implement create_sharing.rs REST endpoint
5. Update module exports
6. Test the endpoint

### Phase 2: Update Sharing Endpoint
1. Implement update_sharing_handler.rs
2. Implement update_sharing.rs REST endpoint
3. Update module exports
4. Test the endpoint

### Phase 3: Delete Sharing Endpoint
1. Implement delete_sharing_handler.rs
2. Implement delete_sharing.rs REST endpoint
3. Update module exports
4. Test the endpoint

## Testing Strategy

### Unit Tests
- Test email to user ID resolution
- Test permission validation logic
- Test database operations for creating, updating, and deleting permissions

### Integration Tests
- Test POST /metrics/:id/sharing with valid and invalid inputs
- Test PUT /metrics/:id/sharing with valid and invalid inputs
- Test DELETE /metrics/:id/sharing with valid and invalid inputs
- Test error handling for all endpoints

### Manual Testing
- Use Postman/curl to verify the endpoints work as expected
- Verify permissions are properly created, updated, and deleted in the database
- Verify access control works as expected after permissions are modified

## Dependencies

### Files
- `/libs/database/src/models.rs` - AssetPermission model
- `/libs/database/src/enums.rs` - AssetPermissionRole, IdentityType, and AssetType enums
- `/libs/database/src/schema.rs` - Database schema

## File References
- `/src/routes/rest/routes/metrics/mod.rs`
- `/libs/handlers/src/metrics/mod.rs`

## Security Considerations
- All endpoints require authentication
- Only users with appropriate permissions should be able to manage sharing
- Input validation must be thorough to prevent security issues
- Email addresses must be properly validated and resolved to user IDs

## Monitoring and Logging
- All endpoint calls should be logged with tracing
- Errors should be logged with appropriate context
- Metrics should be collected for endpoint performance

## Rollback Plan
If issues are discovered:
1. Revert the changes to the affected files
2. Deploy the previous version
3. Investigate and fix the issues in a new PR
