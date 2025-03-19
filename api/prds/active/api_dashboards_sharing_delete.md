# API Dashboards Sharing - Delete Endpoint PRD ✅

## Problem Statement
Users need the ability to remove sharing permissions for dashboards through a REST API endpoint.

## Technical Design

### Endpoint Specification
- **Method**: DELETE
- **Path**: /dashboards/:id/sharing
- **Description**: Removes sharing permissions for a dashboard
- **Authentication**: Required
- **Authorization**: User must have Owner or FullAccess permission for the dashboard

### Request Structure
```rust
// Simple array of email strings
pub type DeleteSharingRequest = Vec<String>;
```

### Response Structure
```rust
// Success response is a simple message
// Error responses include appropriate status codes and error messages
```

### Implementation Details

#### New Files
1. `/src/routes/rest/routes/dashboards/sharing/delete_sharing.rs` - REST handler for deleting sharing permissions
2. `/libs/handlers/src/dashboards/sharing/delete_sharing_handler.rs` - Business logic for deleting sharing permissions

#### REST Handler Implementation
```rust
// delete_sharing.rs
pub async fn delete_dashboard_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<String>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!("Processing DELETE request for dashboard sharing with ID: {}, user_id: {}", id, user.id);

    match delete_dashboard_sharing_handler(&id, &user.id, request).await {
        Ok(_) => Ok(ApiResponse::JsonData("Sharing permissions deleted successfully".to_string())),
        Err(e) => {
            tracing::error!("Error deleting sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete sharing permissions: {}", e)))
        }
    }
}
```

#### Handler Implementation
```rust
// delete_sharing_handler.rs
pub async fn delete_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user_id: &Uuid,
    emails: Vec<String>,
) -> Result<()> {
    // 1. Validate the dashboard exists
    let dashboard = match get_dashboard_by_id(dashboard_id).await {
        Ok(Some(dashboard)) => dashboard,
        Ok(None) => return Err(anyhow!("Dashboard not found")),
        Err(e) => return Err(anyhow!("Error fetching dashboard: {}", e)),
    };

    // 2. Check if user has permission to delete sharing for the dashboard (Owner or FullAccess)
    let has_permission = has_permission(
        *dashboard_id,
        AssetType::Dashboard,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission {
        return Err(anyhow!("User does not have permission to delete sharing for this dashboard"));
    }

    // 3. Process each email and delete sharing permissions
    for email in emails {
        // The remove_share_by_email function handles soft deletion of permissions
        match remove_share_by_email(
            &email,
            *dashboard_id,
            AssetType::Dashboard,
            *user_id,
        ).await {
            Ok(_) => {
                tracing::info!("Deleted sharing permission for email: {} on dashboard: {}", email, dashboard_id);
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

### Sharing Library Integration
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
This function checks if a user has the required permission level for an asset. It's used to verify that the user has Owner or FullAccess permission to remove sharing for the dashboard.

2. `remove_share_by_email` from `@[api/libs/sharing/src]/remove_asset_permissions.rs`:
```rust
pub async fn remove_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    user_id: Uuid,
) -> Result<()>
```
This function removes sharing permissions for a user identified by email. It handles:
- Email validation
- User lookup by email
- Permission removal
- Error handling for invalid emails or non-existent users

### Error Handling
The handler will return appropriate error responses:
- 404 Not Found - If the dashboard doesn't exist
- 403 Forbidden - If the user doesn't have permission to remove sharing for the dashboard
- 400 Bad Request - For invalid email addresses
- 500 Internal Server Error - For database errors or other unexpected issues

### Input Validation
- Email addresses must be properly formatted (contains '@')
- The dashboard ID must be a valid UUID

### Testing Strategy

#### Unit Tests
- Test permission validation logic
- Test error handling for non-existent dashboards
- Test error handling for unauthorized users
- Test error handling for invalid emails
- Test successful sharing removal

#### Integration Tests
- Test DELETE /dashboards/:id/sharing with valid ID, authorized user, and valid emails
- Test DELETE /dashboards/:id/sharing with valid ID, unauthorized user
- Test DELETE /dashboards/:id/sharing with non-existent dashboard ID
- Test DELETE /dashboards/:id/sharing with invalid email formats
- Test DELETE /dashboards/:id/sharing with non-existent user emails

#### Test Cases
1. Should remove sharing permissions for valid emails
2. Should return 403 when user doesn't have Owner or FullAccess permission
3. Should return 404 when dashboard doesn't exist
4. Should return 400 when email is invalid
5. Should handle gracefully when trying to remove sharing for a user that doesn't have access

### Performance Considerations
- For bulk removal with many emails, consider implementing a background job for processing
- Monitor database performance for large batches of removal operations

### Security Considerations
- Ensure that only users with Owner or FullAccess permission can remove sharing
- Validate email addresses to prevent injection attacks
- Implement rate limiting to prevent abuse
- Prevent removal of the owner's own access

### Monitoring
- Log all requests with appropriate context
- Track performance metrics for the endpoint
- Monitor error rates and types
- Track sharing removal operations by user for audit purposes
