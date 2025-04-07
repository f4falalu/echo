use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, User},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Represents a field that can be either kept unchanged, set to null, or updated with a value
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UpdateField<T> {
    /// Don't change the current value
    NoChange,
    /// Set the value to null/None
    SetNull,
    /// Update with a new value
    Update(T),
}

impl<T> Default for UpdateField<T> {
    fn default() -> Self {
        UpdateField::NoChange
    }
}

impl<T> UpdateField<T> {
    /// Converts the UpdateField into an Option<Option<T>> for diesel
    pub fn into_option(self) -> Option<Option<T>> {
        match self {
            UpdateField::NoChange => None,
            UpdateField::SetNull => Some(None),
            UpdateField::Update(value) => Some(Some(value)),
        }
    }

    /// Creates an UpdateField from an Option<Option<T>> (for backward compatibility)
    pub fn from_option(option: Option<Option<T>>) -> Self {
        match option {
            None => UpdateField::NoChange,
            Some(None) => UpdateField::SetNull,
            Some(Some(value)) => UpdateField::Update(value),
        }
    }
}

/// Represents the permission level required for an operation
/// This is used to check if a user has sufficient permission level
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AssetPermissionLevel {
    /// Full ownership, can delete
    Owner,
    /// Full access, can edit and share
    FullAccess,
    /// Can edit but not share
    CanEdit,
    /// Can filter and view
    CanFilter,
    /// Can view only
    CanView,
}

impl From<AssetPermissionRole> for AssetPermissionLevel {
    fn from(role: AssetPermissionRole) -> Self {
        match role {
            AssetPermissionRole::Owner => AssetPermissionLevel::Owner,
            AssetPermissionRole::FullAccess => AssetPermissionLevel::FullAccess,
            AssetPermissionRole::CanEdit => AssetPermissionLevel::CanEdit,
            AssetPermissionRole::CanFilter => AssetPermissionLevel::CanFilter,
            AssetPermissionRole::CanView => AssetPermissionLevel::CanView,
        }
    }
}

impl AssetPermissionLevel {
    /// Check if this permission level is sufficient for the required level
    pub fn is_sufficient_for(&self, required: &AssetPermissionLevel) -> bool {
        match (self, required) {
            // Owner can do anything
            (AssetPermissionLevel::Owner, _) => true,
            // FullAccess can do anything except Owner actions
            (AssetPermissionLevel::FullAccess, AssetPermissionLevel::Owner) => false,
            (AssetPermissionLevel::FullAccess, _) => true,
            // CanEdit can edit, filter, and view
            (AssetPermissionLevel::CanEdit, AssetPermissionLevel::Owner) => false,
            (AssetPermissionLevel::CanEdit, AssetPermissionLevel::FullAccess) => false,
            (AssetPermissionLevel::CanEdit, _) => true,
            // CanFilter can filter and view
            (AssetPermissionLevel::CanFilter, AssetPermissionLevel::Owner) => false,
            (AssetPermissionLevel::CanFilter, AssetPermissionLevel::FullAccess) => false,
            (AssetPermissionLevel::CanFilter, AssetPermissionLevel::CanEdit) => false,
            (AssetPermissionLevel::CanFilter, _) => true,
            // CanView can only view
            (AssetPermissionLevel::CanView, AssetPermissionLevel::CanView) => true,
            (AssetPermissionLevel::CanView, _) => false,
        }
    }
}

/// Represents identity information for permission checks
#[derive(Debug)]
pub struct IdentityInfo {
    pub id: Uuid,
    pub identity_type: IdentityType,
}

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