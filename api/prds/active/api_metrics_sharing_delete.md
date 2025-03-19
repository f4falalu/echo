# API Metrics Sharing - Delete Endpoint PRD

## Problem Statement
Users need the ability to remove sharing permissions for metrics through a REST API endpoint.

## Technical Design

### Endpoint Specification
- **Method**: DELETE
- **Path**: /metrics/:id/sharing
- **Description**: Removes sharing permissions for a metric
- **Authentication**: Required
- **Authorization**: User must have Owner or FullAccess permission for the metric

### Request Structure
```rust
#[derive(Debug, Deserialize)]
pub struct DeleteSharingRequest {
    pub emails: Vec<String>,
}
```

### Response Structure
```rust
// Success response is a simple message
// Error responses include appropriate status codes and error messages
```

### Implementation Details

#### New Files ✅
1. `/src/routes/rest/routes/metrics/sharing/delete_sharing.rs` - REST handler for deleting sharing permissions ✅
2. `/libs/handlers/src/metrics/sharing/delete_sharing_handler.rs` - Business logic for deleting sharing permissions ✅

#### REST Handler Implementation ✅
```rust
// delete_sharing.rs
pub async fn delete_metric_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<DeleteSharingRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!("Processing DELETE request for metric sharing with ID: {}, user_id: {}", id, user.id);

    match delete_metric_sharing_handler(&id, &user.id, request.emails).await {
        Ok(_) => Ok(ApiResponse::Success("Sharing permissions deleted successfully".to_string())),
        Err(e) => {
            tracing::error!("Error deleting sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            if e.to_string().contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Metric not found: {}", e)));
            } else if e.to_string().contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if e.to_string().contains("invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete sharing permissions: {}", e)))
        }
    }
}
```

#### Handler Implementation ✅
```rust
// delete_sharing_handler.rs
pub async fn delete_metric_sharing_handler(
    metric_id: &Uuid,
    user_id: &Uuid,
    emails: Vec<String>,
) -> Result<()> {
    // 1. Validate the metric exists
    let metric = match get_metric_by_id(metric_id).await {
        Ok(Some(metric)) => metric,
        Ok(None) => return Err(anyhow!("Metric not found")),
        Err(e) => return Err(anyhow!("Error fetching metric: {}", e)),
    };

    // 2. Check if user has permission to delete sharing for the metric (Owner or FullAccess)
    let has_permission = has_permission(
        *metric_id,
        AssetType::MetricFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission {
        return Err(anyhow!("User does not have permission to delete sharing for this metric"));
    }

    // 3. Process each email and delete sharing permissions
    for email in emails {
        // The remove_share_by_email function handles soft deletion of permissions
        match remove_share_by_email(
            &email,
            *metric_id,
            AssetType::MetricFile,
            *user_id,
        ).await {
            Ok(_) => {
                tracing::info!("Deleted sharing permission for email: {} on metric: {}", email, metric_id);
            },
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    tracing::warn!("No active permission found for email {}: {}", email, e);
                    continue;
                }
                
                tracing::error!("Failed to delete sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to delete sharing for email {}: {}", email, e));
            }
        }
    }

    Ok(())
}
```

### Sharing Library Integration ✅
This endpoint leverages the following functions from the sharing library:

1. `has_permission` from `@[api/libs/sharing/src]/check_asset_permission.rs`:
```rust
pub async fn has_permission(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_id: Uuid,
    identity_type: IdentityType,
    required_role: AssetPermissionRole,
) -> Result<bool>
```
This function checks if a user has the required permission level for an asset. It's used to verify that the user has Owner or FullAccess permission to delete sharing for the metric.

2. `remove_share_by_email` from `@[api/libs/sharing/src]/remove_asset_permissions.rs`:
```rust
pub async fn remove_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    updated_by: Uuid,
) -> Result<()>
```
This function handles the soft deletion of permissions by email. Here's how it works internally:

```rust
// From the implementation of remove_share_by_email
pub async fn remove_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    updated_by: Uuid,
) -> Result<()> {
    // Validate email format
    if !email.contains('@') {
        return Err(SharingError::InvalidEmail(email.to_string()).into());
    }

    // Find the user by email
    let user = match find_user_by_email(email).await? {
        Some(user) => user,
        None => return Err(SharingError::UserNotFound(email.to_string()).into()),
    };

    // Remove the permission
    remove_share(
        user.id,
        IdentityType::User,
        asset_id,
        asset_type,
        updated_by,
    )
    .await
}
```

3. `find_user_by_email` from `@[api/libs/sharing/src]/user_lookup.rs` (used internally by `remove_share_by_email`):
```rust
pub async fn find_user_by_email(email: &str) -> Result<Option<User>>
```
This function looks up a user by their email address, which is necessary for resolving email addresses to user IDs.

### Soft Deletion Mechanism ✅
The `remove_share_by_email` function performs a soft deletion by updating the `deleted_at` field in the database:

```rust
// From the implementation of remove_share
// Soft delete - update the deleted_at field
let rows = diesel::update(asset_permissions::table)
    .filter(asset_permissions::identity_id.eq(identity_id))
    .filter(asset_permissions::identity_type.eq(identity_type))
    .filter(asset_permissions::asset_id.eq(asset_id))
    .filter(asset_permissions::asset_type.eq(asset_type))
    .filter(asset_permissions::deleted_at.is_null())
    .set((
        asset_permissions::deleted_at.eq(now),
        asset_permissions::updated_at.eq(now),
        asset_permissions::updated_by.eq(updated_by),
    ))
    .execute(&mut conn)
    .await
    .context("Failed to remove asset permission")?;
```

This approach ensures that:
1. The permission record is preserved for audit purposes
2. The permission can be restored if needed
3. The permission won't be included in queries that filter for active permissions

### Error Handling ✅
The handler will return appropriate error responses:
- 404 Not Found - If the metric doesn't exist
- 403 Forbidden - If the user doesn't have permission to delete sharing for the metric
- 400 Bad Request - For invalid email addresses
- 500 Internal Server Error - For database errors or other unexpected issues

### Input Validation ✅
- Email addresses must be properly formatted (contains '@')
- The metric ID must be a valid UUID

### Testing Strategy ✅

#### Unit Tests ✅
- Test permission validation logic
- Test error handling for non-existent metrics
- Test error handling for unauthorized users
- Test error handling for invalid emails
- Test successful sharing deletions

#### Integration Tests ✅
- Test DELETE /metrics/:id/sharing with valid ID, authorized user, and valid emails
- Test DELETE /metrics/:id/sharing with valid ID, unauthorized user
- Test DELETE /metrics/:id/sharing with non-existent metric ID
- Test DELETE /metrics/:id/sharing with invalid email formats
- Test DELETE /metrics/:id/sharing with non-existent user emails

#### Test Cases ✅
1. Should delete sharing permissions for valid emails
2. Should return 403 when user doesn't have Owner or FullAccess permission
3. Should return 404 when metric doesn't exist
4. Should return 400 when email is invalid
5. Should not error when trying to delete a non-existent permission

### Performance Considerations
- For bulk deletions with many emails, consider implementing a background job for processing
- Monitor database performance for large batches of delete operations

### Security Considerations
- Ensure that only users with Owner or FullAccess permission can delete sharing
- Validate email addresses to prevent injection attacks
- Implement rate limiting to prevent abuse
- Consider adding additional checks to prevent users from removing their own Owner access

### Monitoring
- Log all requests with appropriate context
- Track performance metrics for the endpoint
- Monitor error rates and types
- Track sharing deletion operations by user for audit purposes