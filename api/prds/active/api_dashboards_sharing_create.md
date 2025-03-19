# API Dashboards Sharing - Create Endpoint PRD ✅

## Problem Statement
Users need the ability to share dashboards with other users via a REST API endpoint.

## Technical Design

### Endpoint Specification
- **Method**: POST
- **Path**: /dashboards/:id/sharing
- **Description**: Shares a dashboard with specified users
- **Authentication**: Required
- **Authorization**: User must have Owner or FullAccess permission for the dashboard

### Request Structure
```rust
#[derive(Debug, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}
```

### Response Structure
```rust
// Success response is a simple message
// Error responses include appropriate status codes and error messages
```

### Implementation Details

#### New Files
1. `/src/routes/rest/routes/dashboards/sharing/create_sharing.rs` - REST handler for creating sharing permissions
2. `/libs/handlers/src/dashboards/sharing/create_sharing_handler.rs` - Business logic for creating sharing permissions

#### REST Handler Implementation
```rust
// create_sharing.rs
pub async fn create_dashboard_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!("Processing POST request for dashboard sharing with ID: {}, user_id: {}", id, user.id);

    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    match create_dashboard_sharing_handler(&id, &user.id, emails_and_roles).await {
        Ok(_) => Ok(ApiResponse::JsonData("Sharing permissions created successfully".to_string())),
        Err(e) => {
            tracing::error!("Error creating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create sharing permissions: {}", e)))
        }
    }
}
```

#### Handler Implementation
```rust
// create_sharing_handler.rs
pub async fn create_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user_id: &Uuid,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    // 1. Validate the dashboard exists
    let dashboard = match get_dashboard_by_id(dashboard_id).await {
        Ok(Some(dashboard)) => dashboard,
        Ok(None) => return Err(anyhow!("Dashboard not found")),
        Err(e) => return Err(anyhow!("Error fetching dashboard: {}", e)),
    };

    // 2. Check if user has permission to share the dashboard (Owner or FullAccess)
    let has_permission = has_permission(
        *dashboard_id,
        AssetType::Dashboard,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission {
        return Err(anyhow!("User does not have permission to share this dashboard"));
    }

    // 3. Process each email and create sharing permissions
    for (email, role) in emails_and_roles {
        // Create or update the permission using create_share_by_email
        match create_share_by_email(
            &email,
            *dashboard_id,
            AssetType::Dashboard,
            role,
            *user_id,
        ).await {
            Ok(_) => {
                tracing::info!("Created sharing permission for email: {} on dashboard: {}", email, dashboard_id);
            },
            Err(e) => {
                tracing::error!("Failed to create sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to create sharing for email {}: {}", email, e));
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
This function checks if a user has the required permission level for an asset. It's used to verify that the user has Owner or FullAccess permission to share the dashboard.

2. `create_share_by_email` from `@[api/libs/sharing/src]/create_asset_permission.rs`:
```rust
pub async fn create_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<AssetPermission>
```
This function creates or updates an asset permission for a user identified by email. It handles:
- Email validation
- User lookup by email
- Permission creation or update
- Error handling for invalid emails or non-existent users

3. `find_user_by_email` from `@[api/libs/sharing/src]/user_lookup.rs` (used internally by `create_share_by_email`):
```rust
pub async fn find_user_by_email(email: &str) -> Result<Option<User>>
```
This function looks up a user by their email address, which is necessary for resolving email addresses to user IDs.

### Error Handling
The handler will return appropriate error responses:
- 404 Not Found - If the dashboard doesn't exist
- 403 Forbidden - If the user doesn't have permission to share the dashboard
- 400 Bad Request - For invalid email addresses or roles
- 500 Internal Server Error - For database errors or other unexpected issues

### Input Validation
- Email addresses must be properly formatted (contains '@')
- Roles must be valid AssetPermissionRole values
- The dashboard ID must be a valid UUID

### Testing Strategy

#### Unit Tests
- Test permission validation logic
- Test error handling for non-existent dashboards
- Test error handling for unauthorized users
- Test error handling for invalid emails
- Test successful sharing creation

#### Integration Tests
- Test POST /dashboards/:id/sharing with valid ID, authorized user, and valid emails
- Test POST /dashboards/:id/sharing with valid ID, unauthorized user
- Test POST /dashboards/:id/sharing with non-existent dashboard ID
- Test POST /dashboards/:id/sharing with invalid email formats
- Test POST /dashboards/:id/sharing with non-existent user emails
- Test POST /dashboards/:id/sharing with invalid roles

#### Test Cases
1. Should create sharing permissions for valid emails and roles
2. Should return 403 when user doesn't have Owner or FullAccess permission
3. Should return 404 when dashboard doesn't exist
4. Should return 400 when email is invalid
5. Should return 400 when role is invalid

### Performance Considerations
- For bulk sharing with many emails, consider implementing a background job for processing
- Monitor database performance for large batches of sharing operations

### Security Considerations
- Ensure that only users with Owner or FullAccess permission can share dashboards
- Validate email addresses to prevent injection attacks
- Validate roles to prevent privilege escalation
- Implement rate limiting to prevent abuse

### Monitoring
- Log all requests with appropriate context
- Track performance metrics for the endpoint
- Monitor error rates and types
- Track sharing operations by user for audit purposes
