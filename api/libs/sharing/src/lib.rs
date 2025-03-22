pub mod admin_check;
pub mod check_asset_permission;
pub mod create_asset_permission;
pub mod errors;
pub mod list_asset_permissions;
pub mod remove_asset_permissions;
pub mod types;
pub mod user_lookup;

#[cfg(test)]
pub mod tests;

// Export the primary functions
pub use admin_check::{check_admin_access, get_asset_organization_id, has_permission_with_admin_check, is_user_org_admin};
pub use check_asset_permission::{check_access, check_access_bulk, check_permission_with_admin_override, check_permissions, has_permission};
pub use create_asset_permission::{create_share, create_share_by_email, create_shares_bulk};
pub use errors::SharingError;
pub use list_asset_permissions::{list_shares, list_shares_by_identity_type};
pub use remove_asset_permissions::{remove_share, remove_share_by_email};
pub use types::{
    AssetPermissionWithUser, ListPermissionsRequest, ListPermissionsResponse, 
    SerializableAssetPermission, UserInfo
};
pub use user_lookup::find_user_by_email;
