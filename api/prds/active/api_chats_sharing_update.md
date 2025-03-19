# API Chats Sharing - Update Endpoint PRD

## Problem Statement
Users need the ability to update sharing permissions for chats through a REST API endpoint.

## Technical Design

### Endpoint Specification
- **Method**: PUT
- **Path**: /chats/:id/sharing
- **Description**: Updates sharing permissions for a chat
- **Authentication**: Required
- **Authorization**: User must have Owner or FullAccess permission for the chat

### Request Structure
```rust
#[derive(Debug, Deserialize)]
pub struct SharingRequest {
    pub emails: Vec<String>,
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
1. `/src/routes/rest/routes/chats/sharing/update_sharing.rs` - REST handler for updating sharing permissions
2. `/libs/handlers/src/chats/sharing/update_sharing_handler.rs` - Business logic for updating sharing permissions

#### REST Handler Implementation
```rust
// update_sharing.rs
pub async fn update_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<SharingRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!("Processing PUT request for chat sharing with ID: {}, user_id: {}", id, user.id);

    match update_chat_sharing_handler(&id, &user.id, request.emails, request.role).await {
        Ok(_) => Ok(ApiResponse::Success("Sharing permissions updated successfully".to_string())),
        Err(e) => {
            tracing::error!("Error updating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            if e.to_string().contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Chat not found: {}", e)));
            } else if e.to_string().contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if e.to_string().contains("invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update sharing permissions: {}", e)))
        }
    }
}
```

#### Handler Implementation
```rust
// update_sharing_handler.rs
pub async fn update_chat_sharing_handler(
    chat_id: &Uuid,
    user_id: &Uuid,
    emails: Vec<String>,
    role: AssetPermissionRole,
) -> Result<()> {
    // 1. Validate the chat exists
    let chat = match get_chat_by_id(chat_id).await {
        Ok(Some(chat)) => chat,
        Ok(None) => return Err(anyhow!("Chat not found")),
        Err(e) => return Err(anyhow!("Error fetching chat: {}", e)),
    };

    // 2. Check if user has permission to update sharing for the chat (Owner or FullAccess)
    let has_permission = has_permission(
        *chat_id,
        AssetType::Chat,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission {
        return Err(anyhow!("User does not have permission to update sharing for this chat"));
    }

    // 3. Process each email and update sharing permissions
    for email in emails {
        // The create_share_by_email function handles both creation and updates
        // It performs an upsert operation in the database
        match create_share_by_email(
            &email,
            *chat_id,
            AssetType::Chat,
            role,
            *user_id,
        ).await {
            Ok(_) => {
                tracing::info!("Updated sharing permission for email: {} on chat: {}", email, chat_id);
            },
            Err(e) => {
                tracing::error!("Failed to update sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to update sharing for email {}: {}", email, e));
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
This function checks if a user has the required permission level for an asset. It's used to verify that the user has Owner or FullAccess permission to update sharing for the chat.

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
This function is used for both creating and updating permissions. It performs an upsert operation in the database.

### Key Differences from Create Endpoint
While the update endpoint uses the same `create_share_by_email` function as the create endpoint, there are some key differences in its usage:

1. **Semantic Difference**: The PUT method indicates an update operation, while POST indicates creation.
2. **Expected Behavior**: The update endpoint is expected to modify existing permissions, while the create endpoint is expected to add new ones.
3. **Error Handling**: The update endpoint might handle "permission not found" differently than the create endpoint.
4. **Documentation**: The API documentation will describe these endpoints differently to users.

### Error Handling
The handler will return appropriate error responses:
- 404 Not Found - If the chat doesn't exist
- 403 Forbidden - If the user doesn't have permission to update sharing for the chat
- 400 Bad Request - For invalid email addresses or roles
- 500 Internal Server Error - For database errors or other unexpected issues

### Input Validation
- Email addresses must be properly formatted (contains '@')
- Roles must be valid AssetPermissionRole values
- The chat ID must be a valid UUID

### Testing Strategy

#### Unit Tests
- Test permission validation logic
- Test error handling for non-existent chats
- Test error handling for unauthorized users
- Test error handling for invalid emails
- Test successful sharing updates

#### Integration Tests
- Test PUT /chats/:id/sharing with valid ID, authorized user, and valid emails
- Test PUT /chats/:id/sharing with valid ID, unauthorized user
- Test PUT /chats/:id/sharing with non-existent chat ID
- Test PUT /chats/:id/sharing with invalid email formats
- Test PUT /chats/:id/sharing with non-existent user emails
- Test PUT /chats/:id/sharing with invalid roles

#### Test Cases
1. Should update sharing permissions for valid emails and roles
2. Should return 403 when user doesn't have Owner or FullAccess permission
3. Should return 404 when chat doesn't exist
4. Should return 400 when email is invalid
5. Should return 400 when role is invalid

### Performance Considerations
- For bulk updates with many emails, consider implementing a background job for processing
- Monitor database performance for large batches of update operations

### Security Considerations
- Ensure that only users with Owner or FullAccess permission can update sharing
- Validate email addresses to prevent injection attacks
- Validate roles to prevent privilege escalation
- Implement rate limiting to prevent abuse

### Monitoring
- Log all requests with appropriate context
- Track performance metrics for the endpoint
- Monitor error rates and types
- Track sharing update operations by user for audit purposes
