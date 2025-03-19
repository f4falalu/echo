use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, User},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A simplified version of the User model containing only the necessary information for sharing
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}

impl From<User> for UserInfo {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
        }
    }
}

/// A serializable version of AssetPermission
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SerializableAssetPermission {
    pub identity_id: Uuid,
    pub identity_type: IdentityType,
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub role: AssetPermissionRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
}

impl From<AssetPermission> for SerializableAssetPermission {
    fn from(permission: AssetPermission) -> Self {
        Self {
            identity_id: permission.identity_id,
            identity_type: permission.identity_type,
            asset_id: permission.asset_id,
            asset_type: permission.asset_type,
            role: permission.role,
            created_at: permission.created_at,
            updated_at: permission.updated_at,
            deleted_at: permission.deleted_at,
            created_by: permission.created_by,
            updated_by: permission.updated_by,
        }
    }
}

/// Represents an asset permission with the associated user information
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssetPermissionWithUser {
    pub permission: SerializableAssetPermission,
    pub user: Option<UserInfo>,
}

/// Request to list permissions for an asset
#[derive(Debug, Deserialize)]
pub struct ListPermissionsRequest {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
}

/// Response for the list permissions endpoint
#[derive(Debug, Serialize)]
pub struct ListPermissionsResponse {
    pub permissions: Vec<AssetPermissionWithUser>,
}