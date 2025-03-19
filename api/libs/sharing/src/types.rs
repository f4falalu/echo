use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, User},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A representation of a permission along with user information
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssetPermissionWithUser {
    pub identity_id: Uuid,
    pub identity_type: IdentityType,
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub role: AssetPermissionRole,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub created_by: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<UserInfo>,
}

/// A simple representation of a user for permission responses
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

impl From<(AssetPermission, Option<UserInfo>)> for AssetPermissionWithUser {
    fn from((permission, user): (AssetPermission, Option<UserInfo>)) -> Self {
        Self {
            identity_id: permission.identity_id,
            identity_type: permission.identity_type,
            asset_id: permission.asset_id,
            asset_type: permission.asset_type,
            role: permission.role,
            created_at: permission.created_at,
            created_by: permission.created_by,
            user,
        }
    }
}