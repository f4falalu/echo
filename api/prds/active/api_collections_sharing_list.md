# API Collections Sharing - List Endpoint PRD

## Problem Statement
Users need the ability to view all sharing permissions for a collection via a REST API endpoint.

## Technical Design

### Endpoint Specification
- **Method**: GET
- **Path**: /collections/:id/sharing
- **Description**: Lists all sharing permissions for a specific collection
- **Authentication**: Required
- **Authorization**: User must have at least ReadOnly access to the collection

### Response Structure
```rust
#[derive(Debug, Serialize)]
pub struct SharingResponse {
    pub permissions: Vec<SharingPermission>,
}

#[derive(Debug, Serialize)]
pub struct SharingPermission {
    pub user_id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub role: AssetPermissionRole,
}
```

### Implementation Details

#### New Files
1. `/src/routes/rest/routes/collections/sharing/list_sharing.rs` - REST handler for listing sharing permissions
2. `/libs/handlers/src/collections/sharing/list_sharing_handler.rs` - Business logic for listing sharing permissions

#### REST Handler Implementation
```rust
// list_sharing.rs
pub async fn list_collection_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<SharingResponse>, (StatusCode, String)> {
    tracing::info!("Processing GET request for collection sharing with ID: {}, user_id: {}", id, user.id);

    match list_collection_sharing_handler(&id, &user.id).await {
        Ok(permissions) => {
            let response = SharingResponse {
                permissions: permissions.into_iter().map(|p| SharingPermission {
                    user_id: p.user.as_ref().map(|u| u.id).unwrap_or_default(),
                    email: p.user.as_ref().map(|u| u.email.clone()).unwrap_or_default(),
                    name: p.user.as_ref().and_then(|u| u.name.clone()),
                    avatar_url: p.user.as_ref().and_then(|u| u.avatar_url.clone()),
                    role: p.permission.role,
                }).collect(),
            };
            Ok(ApiResponse::Success(response))
        },
        Err(e) => {
            tracing::error!("Error listing sharing permissions: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to list sharing permissions: {}", e)))
        }
    }
}
```

#### Handler Implementation
```rust
// list_sharing_handler.rs
pub async fn list_collection_sharing_handler(
    collection_id: &Uuid,
    user_id: &Uuid,
) -> Result<Vec<AssetPermissionWithUser>> {
    // 1. Validate the collection exists
    let collection = match get_collection_by_id(collection_id).await {
        Ok(Some(collection)) => collection,
        Ok(None) => return Err(anyhow!("Collection not found")),
        Err(e) => return Err(anyhow!("Error fetching collection: {}", e)),
    };

    // 2. Check if user has permission to view the collection
    let user_role = check_access(
        *collection_id,
        AssetType::Collection,
        *user_id,
        IdentityType::User,
    ).await?;

    if user_role.is_none() {
        return Err(anyhow!("User does not have permission to view this collection"));
    }

    // 3. Get all permissions for the collection
    let permissions = list_shares(
        *collection_id,
        AssetType::Collection,
    ).await?;

    Ok(permissions)
}
```

### Sharing Library Integration
This endpoint leverages the following functions from the sharing library:

1. `check_access` from `@[api/libs/sharing/src]/check_asset_permission.rs`:
```rust
pub async fn check_access(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_id: Uuid,
    identity_type: IdentityType,
) -> Result<Option<AssetPermissionRole>>
```
This function is used to verify that the user has permission to view the collection. It returns the user's role for the asset, or None if they don't have access.

2. `list_shares` from `@[api/libs/sharing/src]/list_asset_permissions.rs`:
```rust
pub async fn list_shares(
    asset_id: Uuid,
    asset_type: AssetType,
) -> Result<Vec<AssetPermissionWithUser>>
```
This function retrieves all permissions for a specified asset, including user information. It filters out soft-deleted permissions and returns a structured response.

3. The `AssetPermissionWithUser` type from `@[api/libs/sharing/src]/types.rs`:
```rust
pub struct AssetPermissionWithUser {
    pub permission: SerializableAssetPermission,
    pub user: Option<UserInfo>,
}
```
This type combines permission data with user information for a comprehensive response.

### Error Handling
The handler will return appropriate error responses:
- 404 Not Found - If the collection doesn't exist
- 403 Forbidden - If the user doesn't have permission to view the collection
- 500 Internal Server Error - For database errors or other unexpected issues

### Testing Strategy

#### Unit Tests
- Test permission validation logic
- Test error handling for non-existent collections
- Test error handling for unauthorized users
- Test mapping from `AssetPermissionWithUser` to `SharingPermission`

#### Integration Tests
- Test GET /collections/:id/sharing with valid ID and authorized user
- Test GET /collections/:id/sharing with valid ID and unauthorized user
- Test GET /collections/:id/sharing with non-existent collection ID
- Test GET /collections/:id/sharing with collection that has no sharing permissions

#### Test Cases
1. Should return all sharing permissions for a collection when user has access
2. Should return 403 when user doesn't have access to the collection
3. Should return 404 when collection doesn't exist
4. Should return empty array when no sharing permissions exist

### Performance Considerations
- The `list_shares` function performs a database join between asset_permissions and users tables
- For collections with many sharing permissions, consider pagination in a future enhancement

### Security Considerations
- Ensure that only users with at least ReadOnly access can view sharing permissions
- Validate the collection ID to prevent injection attacks
- Do not expose sensitive user information beyond what's needed

### Monitoring
- Log all requests with appropriate context
- Track performance metrics for the endpoint
- Monitor error rates and types
