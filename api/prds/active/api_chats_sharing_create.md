# API Chats Sharing - Create Endpoint PRD

## Problem Statement

Users need the ability to share chats with other users via a REST API endpoint.

## Status

✅ Completed

## Technical Design

### Endpoint Specification

- **Method**: POST
- **Path**: /chats/:id/sharing
- **Description**: Shares a chat with specified users
- **Authentication**: Required
- **Authorization**: User must have Owner or FullAccess permission for the chat

### Request Structure

```rust
// Array of recipients to share with
pub type ShareRequest = Vec<ShareRecipient>;

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

1. `/src/routes/rest/routes/chats/sharing/create_sharing.rs` - REST handler for creating sharing permissions
2. `/libs/handlers/src/chats/sharing/create_sharing_handler.rs` - Business logic for creating sharing permissions

#### REST Handler Implementation

```rust
// create_sharing.rs
pub async fn create_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!("Processing POST request for chat sharing with ID: {}, user_id: {}", id, user.id);

    // Convert request to a list of (email, role) pairs
    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    match create_chat_sharing_handler(&id, &user.id, emails_and_roles).await {
        Ok(_) => Ok(ApiResponse::JsonData("Sharing permissions created successfully".to_string())),
        Err(e) => {
            tracing::error!("Error creating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Chat not found: {}", e)));
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
pub async fn create_chat_sharing_handler(
    chat_id: &Uuid,
    user_id: &Uuid,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    // 1. Validate the chat exists
    let chat = match get_chat_by_id(chat_id).await {
        Ok(Some(chat)) => chat,
        Ok(None) => return Err(anyhow!("Chat not found")),
        Err(e) => return Err(anyhow!("Error fetching chat: {}", e)),
    };

    // 2. Check if user has permission to share the chat (Owner or FullAccess)
    let has_permission = has_permission(
        *chat_id,
        AssetType::Chat,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission {
        return Err(anyhow!("User does not have permission to share this chat"));
    }

    // 3. Process each email and create sharing permissions
    for (email, role) in emails_and_roles {
        match create_share_by_email(
            &email,
            *chat_id,
            AssetType::Chat,
            role,
            *user_id,
        ).await {
            Ok(_) => {
                tracing::info!("Created sharing permission for email: {} on chat: {} with role: {:?}", email, chat_id, role);
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

This function checks if a user has the required permission level for an asset. It's used to verify that the user has Owner or FullAccess permission to share the chat.

2. `create_share_by_email` from `@[api/libs/sharing/src]/create_asset_permission.rs`:

```rust
pub async fn create_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<()>
```

This function creates or updates sharing permissions for a user identified by email. It handles:

- Email validation
- User lookup by email
- Permission creation or update
- Error handling for invalid emails or non-existent users

3. `find_user_by_email` from `@[api/libs/sharing/src]/user_lookup.rs` (used internally by `create_share_by_email`):

```rust
pub async fn find_user_by_email(email: &str) -> Result<Option<User>>
```

This function looks up a user by email address and returns the user object if found.

### Error Handling

The handler will return appropriate error responses:

- 404 Not Found - If the chat doesn't exist
- 403 Forbidden - If the user doesn't have permission to share the chat
- 400 Bad Request - For invalid email addresses
- 500 Internal Server Error - For database errors or other unexpected issues

### Input Validation

- Email addresses must be properly formatted (contains '@')
- The chat ID must be a valid UUID
- The role must be a valid AssetPermissionRole (ReadOnly, ReadWrite, FullAccess)

### Testing Strategy

#### Unit Tests

- Test permission validation logic
- Test error handling for non-existent chats
- Test error handling for unauthorized users
- Test error handling for invalid emails
- Test successful sharing creation

#### Integration Tests

- Test POST /chats/:id/sharing with valid ID, authorized user, and valid emails
- Test POST /chats/:id/sharing with valid ID, unauthorized user
- Test POST /chats/:id/sharing with non-existent chat ID
- Test POST /chats/:id/sharing with invalid email formats
- Test POST /chats/:id/sharing with non-existent user emails

#### Test Cases

1. Should create sharing permissions for valid emails with specified roles
2. Should return 403 when user doesn't have Owner or FullAccess permission
3. Should return 404 when chat doesn't exist
4. Should return 400 when email is invalid
5. Should handle gracefully when trying to share with a user that already has access

### Performance Considerations

- For bulk sharing with many emails, consider implementing a background job for processing
- Monitor database performance for large batches of sharing operations

### Security Considerations

- Ensure that only users with Owner or FullAccess permission can share
- Validate email addresses to prevent injection attacks
- Implement rate limiting to prevent abuse
- Consider implementing notifications for users who receive new sharing permissions

### Monitoring

- Log all requests with appropriate context
- Track performance metrics for the endpoint
- Monitor error rates and types
- Track sharing creation operations by user for audit purposes
