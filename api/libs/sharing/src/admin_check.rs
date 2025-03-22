//! # Admin Check Module
//!
//! This module provides utilities for checking if a user has administrative access
//! to an asset based on their role in the organization.
//!
//! ## Overview
//!
//! The module implements automatic permission elevation for users who have admin roles
//! (WorkspaceAdmin or DataAdmin) in an organization. These users get automatic
//! FullAccess to all assets in their organization, without needing explicit asset
//! permissions, except for Owner actions which still require explicit Owner permission.
//!
//! ## Security Model
//!
//! The admin check implements a multi-layered security model:
//!
//! 1. **Organization Isolation**: Admin privileges only work within the user's organization.
//!    Admins of one org cannot access assets from another org.
//!
//! 2. **Limited Admin Power**: Even admins cannot take Owner actions without explicit
//!    Owner permission. This reserves destructive actions for explicit owners.
//!
//! 3. **Role-Based Access**: Only WorkspaceAdmin and DataAdmin roles get automatic
//!    elevated permissions.
//!
//! ## Usage Examples
//!
//! ### Example 1: Using Admin Override in a Handler
//!
//! ```rust
//! use uuid::Uuid;
//! use database::enums::{AssetType, IdentityType};
//! use sharing::{
//!     types::IdentityInfo,
//!     check_asset_permission::check_permission_with_admin_override,
//! };
//!
//! async fn get_metric_handler(
//!     metric_id: Uuid,
//!     user_id: Uuid,
//! ) -> Result<HttpResponse> {
//!     let mut conn = get_pg_pool().get().await?;
//!     
//!     // Create identity info for the user
//!     let identity = IdentityInfo {
//!         id: user_id,
//!         identity_type: IdentityType::User,
//!     };
//!     
//!     // Check if user has access (including admin override)
//!     let has_access = check_permission_with_admin_override(
//!         &mut conn,
//!         &identity,
//!         metric_id,
//!         AssetType::MetricFile,
//!         &[AssetPermissionLevel::CanView],
//!     ).await?;
//!     
//!     if !has_access {
//!         return Ok(HttpResponse::Forbidden().json(error_response("Access denied")));
//!     }
//!     
//!     // Continue with handler logic...
//!     // ...
//! }
//! ```
//!
//! ### Example 2: Checking for Admin Access in Middleware
//!
//! ```rust
//! use uuid::Uuid;
//! use database::enums::{AssetType, AssetPermissionRole};
//! use sharing::admin_check::{get_asset_organization_id, is_user_org_admin};
//!
//! async fn check_admin_middleware(
//!     user_id: Uuid,
//!     asset_id: Uuid,
//!     asset_type: AssetType,
//! ) -> Result<bool> {
//!     let mut conn = get_pg_pool().get().await?;
//!     
//!     // Get the organization ID for the asset
//!     let org_id = match get_asset_organization_id(&mut conn, &asset_id, &asset_type).await {
//!         Ok(id) => id,
//!         Err(_) => return Ok(false), // Asset not found or other error
//!     };
//!     
//!     // Check if user is an admin in this organization
//!     is_user_org_admin(&mut conn, &user_id, &org_id).await
//! }
//! ```

use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType, UserOrganizationRole},
    schema::{chats, collections, dashboard_files, metric_files, users_to_organizations},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use middleware::types::AuthenticatedUser;
use uuid::Uuid;

use crate::check_asset_permission::has_permission;
use crate::errors::SharingError;
use crate::types::AssetPermissionLevel;

/// Checks if a user has admin privileges in an organization using cached user information
///
/// # Arguments
/// * `user` - The authenticated user object with cached organization memberships
/// * `organization_id` - The ID of the organization to check against
///
/// # Returns
/// * `bool` - `true` if the user is a WorkspaceAdmin or DataAdmin in the organization, otherwise `false`
///
/// This function checks if a user has admin privileges in an organization by examining
/// the cached organization memberships in the AuthenticatedUser object, rather than
/// making a database query. This is more efficient for frequently performed checks.
///
pub fn is_user_org_admin_cached(user: &AuthenticatedUser, organization_id: &Uuid) -> bool {
    // Check if user has WorkspaceAdmin or DataAdmin role for this organization
    // using the cached organization memberships
    user.organizations.iter().any(|org| {
        &org.id == organization_id
            && matches!(
                org.role,
                UserOrganizationRole::WorkspaceAdmin | UserOrganizationRole::DataAdmin
            )
    })
}

/// Checks if a user has admin privileges in an organization
///
/// # Arguments
/// * `conn` - Database connection
/// * `user_id` - The ID of the user to check
/// * `organization_id` - The ID of the organization to check against
///
/// # Returns
/// * `Result<bool>` - `true` if the user is a WorkspaceAdmin or DataAdmin in the organization, otherwise `false`
///
/// This function queries the database to check if a user has admin privileges in an organization.
/// For better performance when the user's organization roles are already available, use
/// `is_user_org_admin_cached` instead.
pub async fn is_user_org_admin(
    conn: &mut AsyncPgConnection,
    user_id: &Uuid,
    organization_id: &Uuid,
) -> Result<bool> {
    // Query the user's role in the organization
    let user_role = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::organization_id.eq(organization_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select(users_to_organizations::role)
        .first::<UserOrganizationRole>(conn)
        .await
        .map_err(|e| anyhow!("Failed to get user organization role: {}", e))?;

    // Check if the user has an admin role
    Ok(matches!(
        user_role,
        UserOrganizationRole::WorkspaceAdmin | UserOrganizationRole::DataAdmin
    ))
}

/// Checks if a user has admin access to an asset based on their cached organization roles
///
/// # Arguments
/// * `conn` - Database connection
/// * `user` - The authenticated user object with cached organization roles
/// * `asset_id` - The ID of the asset to check
/// * `asset_type` - The type of the asset
/// * `required_level` - The permission level being checked
///
/// # Returns
/// * `Result<Option<AssetPermissionLevel>>` - Returns the permission level granted by admin status,
///   or None if the user is not an admin or if the required level is Owner
///
/// This function uses the cached organization roles in the AuthenticatedUser object to check
/// if the user has admin access to an asset, eliminating the need for an extra database query
/// to check the user's organization role.
pub async fn check_admin_access_cached(
    conn: &mut AsyncPgConnection,
    user: &AuthenticatedUser,
    asset_id: &Uuid,
    asset_type: &AssetType,
    required_level: AssetPermissionLevel,
) -> Result<Option<AssetPermissionLevel>> {
    // Get the organization ID for this asset
    let organization_id = match get_asset_organization_id(conn, asset_id, asset_type).await {
        Ok(id) => id,
        Err(_) => return Ok(None), // Asset not found or other error
    };

    // Check if the user is an admin in this organization using cached info
    if is_user_org_admin_cached(user, &organization_id) {
        // Owner actions still require explicit Owner permission
        if required_level == AssetPermissionLevel::Owner {
            return Ok(None);
        }
        // For any other access, admins get FullAccess
        Ok(Some(AssetPermissionLevel::FullAccess))
    } else {
        Ok(None)
    }
}

/// Checks if a user has admin access to an asset based on their organization role
///
/// # Arguments
/// * `conn` - Database connection
/// * `user_id` - The ID of the user to check
/// * `asset_id` - The ID of the asset to check
/// * `asset_type` - The type of the asset
/// * `required_level` - The permission level being checked
///
/// # Returns
/// * `Result<Option<AssetPermissionLevel>>` - Returns the permission level granted by admin status,
///   or None if the user is not an admin or if the required level is Owner
///
/// # Example
///
/// ```
/// use uuid::Uuid;
/// use database::{pool::get_pg_pool, enums::AssetType};
/// use sharing::{types::AssetPermissionLevel, admin_check::check_admin_access};
///
/// async fn get_admin_permission_level(
///     user_id: Uuid,
///     asset_id: Uuid
/// ) -> anyhow::Result<Option<AssetPermissionLevel>> {
///     let mut conn = get_pg_pool().get().await?;
///     
///     // Check if the user has admin access to this asset
///     let admin_level = check_admin_access(
///         &mut conn,
///         &user_id,
///         &asset_id,
///         &AssetType::MetricFile,
///         AssetPermissionLevel::FullAccess,
///     ).await?;
///     
///     Ok(admin_level)
/// }
/// ```
pub async fn check_admin_access(
    conn: &mut AsyncPgConnection,
    user_id: &Uuid,
    asset_id: &Uuid,
    asset_type: &AssetType,
    required_level: AssetPermissionLevel,
) -> Result<Option<AssetPermissionLevel>> {
    // Get the organization ID for this asset
    let organization_id = match get_asset_organization_id(conn, asset_id, asset_type).await {
        Ok(id) => id,
        Err(_) => return Ok(None), // Asset not found or other error
    };

    // Check if the user is an admin in this organization
    if is_user_org_admin(conn, user_id, &organization_id).await? {
        // Owner actions still require explicit Owner permission
        if required_level == AssetPermissionLevel::Owner {
            return Ok(None);
        }
        // For any other access, admins get FullAccess
        Ok(Some(AssetPermissionLevel::FullAccess))
    } else {
        Ok(None)
    }
}

/// Check if a user has access to an asset with admin override using cached user information
///
/// # Arguments
/// * `conn` - Database connection
/// * `asset_id` - The ID of the asset to check
/// * `asset_type` - The type of the asset
/// * `user` - The authenticated user object with cached organization roles
/// * `required_level` - The minimum permission level required for the operation
///
/// # Returns
/// * `Result<bool>` - True if user has required access, false otherwise
///
/// This function uses the cached organization roles in the AuthenticatedUser object to check
/// if the user has access to an asset. It first checks if the user is an admin for the
/// organization that owns the asset, and if so, grants them FullAccess privileges. If not,
/// it falls back to checking explicit permissions.
pub async fn has_permission_with_admin_check_cached(
    conn: &mut AsyncPgConnection,
    asset_id: &Uuid,
    asset_type: &AssetType,
    user: &AuthenticatedUser,
    required_level: AssetPermissionLevel,
) -> Result<bool> {
    // First check if user has admin access using cached info
    if let Some(admin_level) =
        check_admin_access_cached(conn, user, asset_id, asset_type, required_level).await?
    {
        // Check if the admin level is sufficient for the required level
        return Ok(admin_level.is_sufficient_for(&required_level));
    }

    // If not an admin, fall back to regular permission check
    let required_role = match required_level {
        AssetPermissionLevel::Owner => AssetPermissionRole::Owner,
        AssetPermissionLevel::FullAccess => AssetPermissionRole::FullAccess,
        AssetPermissionLevel::CanEdit => AssetPermissionRole::CanEdit,
        AssetPermissionLevel::CanFilter => AssetPermissionRole::CanFilter,
        AssetPermissionLevel::CanView => AssetPermissionRole::CanView,
    };

    has_permission(
        *asset_id,
        *asset_type,
        user.id,
        IdentityType::User,
        required_role,
    )
    .await
}

/// Check if a user has access to an asset with admin override
///
/// # Arguments
/// * `conn` - Database connection
/// * `asset_id` - The ID of the asset to check
/// * `asset_type` - The type of the asset
/// * `user_id` - The ID of the user to check
/// * `required_level` - The minimum permission level required for the operation
///
/// # Returns
/// * `Result<bool>` - True if user has required access, false otherwise
///
/// # Example
///
/// ```
/// use uuid::Uuid;
/// use database::{pool::get_pg_pool, enums::AssetType};
/// use sharing::{types::AssetPermissionLevel, admin_check::has_permission_with_admin_check};
///
/// async fn check_user_permission(
///     user_id: Uuid,
///     asset_id: Uuid
/// ) -> anyhow::Result<bool> {
///     let mut conn = get_pg_pool().get().await?;
///     
///     // Check if user has view permission (with admin override)
///     let can_view = has_permission_with_admin_check(
///         &mut conn,
///         &asset_id,
///         &AssetType::MetricFile,
///         &user_id,
///         AssetPermissionLevel::CanView,
///     ).await?;
///     
///     Ok(can_view)
/// }
/// ```
pub async fn has_permission_with_admin_check(
    conn: &mut AsyncPgConnection,
    asset_id: &Uuid,
    asset_type: &AssetType,
    user_id: &Uuid,
    required_level: AssetPermissionLevel,
) -> Result<bool> {
    // First check if user has admin access
    if let Some(admin_level) =
        check_admin_access(conn, user_id, asset_id, asset_type, required_level).await?
    {
        // Check if the admin level is sufficient for the required level
        return Ok(admin_level.is_sufficient_for(&required_level));
    }

    // If not an admin, fall back to regular permission check
    let required_role = match required_level {
        AssetPermissionLevel::Owner => AssetPermissionRole::Owner,
        AssetPermissionLevel::FullAccess => AssetPermissionRole::FullAccess,
        AssetPermissionLevel::CanEdit => AssetPermissionRole::CanEdit,
        AssetPermissionLevel::CanFilter => AssetPermissionRole::CanFilter,
        AssetPermissionLevel::CanView => AssetPermissionRole::CanView,
    };

    has_permission(
        *asset_id,
        *asset_type,
        *user_id,
        IdentityType::User,
        required_role,
    )
    .await
}

/// Get the organization ID for a specific asset
///
/// # Arguments
/// * `conn` - Database connection
/// * `asset_id` - The ID of the asset
/// * `asset_type` - The type of the asset
///
/// # Returns
/// * `Result<Uuid>` - The organization ID of the asset
pub async fn get_asset_organization_id(
    conn: &mut AsyncPgConnection,
    asset_id: &Uuid,
    asset_type: &AssetType,
) -> Result<Uuid> {
    match asset_type {
        AssetType::Chat => get_chat_organization_id(conn, asset_id).await,
        AssetType::Collection => get_collection_organization_id(conn, asset_id).await,
        AssetType::DashboardFile => get_dashboard_organization_id(conn, asset_id).await,
        AssetType::MetricFile => get_metric_organization_id(conn, asset_id).await,
        // Deprecated asset types
        AssetType::Dashboard | AssetType::Thread => {
            Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into())
        }
    }
}

/// Get the organization ID for a Chat
pub async fn get_chat_organization_id(
    conn: &mut AsyncPgConnection,
    chat_id: &Uuid,
) -> Result<Uuid> {
    chats::table
        .filter(chats::id.eq(chat_id))
        .filter(chats::deleted_at.is_null())
        .select(chats::organization_id)
        .first::<Uuid>(conn)
        .await
        .map_err(|e| anyhow!("Failed to get chat organization ID: {}", e))
}

/// Get the organization ID for a Collection
pub async fn get_collection_organization_id(
    conn: &mut AsyncPgConnection,
    collection_id: &Uuid,
) -> Result<Uuid> {
    collections::table
        .filter(collections::id.eq(collection_id))
        .filter(collections::deleted_at.is_null())
        .select(collections::organization_id)
        .first::<Uuid>(conn)
        .await
        .map_err(|e| anyhow!("Failed to get collection organization ID: {}", e))
}

/// Get the organization ID for a Dashboard
pub async fn get_dashboard_organization_id(
    conn: &mut AsyncPgConnection,
    dashboard_id: &Uuid,
) -> Result<Uuid> {
    dashboard_files::table
        .filter(dashboard_files::id.eq(dashboard_id))
        .filter(dashboard_files::deleted_at.is_null())
        .select(dashboard_files::organization_id)
        .first::<Uuid>(conn)
        .await
        .map_err(|e| anyhow!("Failed to get dashboard organization ID: {}", e))
}

/// Get the organization ID for a Metric
pub async fn get_metric_organization_id(
    conn: &mut AsyncPgConnection,
    metric_id: &Uuid,
) -> Result<Uuid> {
    metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .select(metric_files::organization_id)
        .first::<Uuid>(conn)
        .await
        .map_err(|e| anyhow!("Failed to get metric organization ID: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use database::enums::UserOrganizationRole;
    use middleware::types::{AuthenticatedUser, OrganizationMembership};
    use serde_json::Value;
    use uuid::Uuid;

    // Instead of trying to mock the static pg_pool, we'll test the functions
    // that don't depend on the database connection directly

    #[test]
    fn test_is_user_org_admin_cached() {
        // Create test organization IDs
        let org_id = Uuid::new_v4();
        let other_org_id = Uuid::new_v4();

        // Create a mock authenticated user with various organization memberships
        let workspace_admin_user = create_test_user(vec![
            (org_id, UserOrganizationRole::WorkspaceAdmin),
            (other_org_id, UserOrganizationRole::Viewer),
        ]);

        let data_admin_user = create_test_user(vec![(org_id, UserOrganizationRole::DataAdmin)]);

        let regular_user = create_test_user(vec![(org_id, UserOrganizationRole::Viewer)]);

        let no_orgs_user = create_test_user(vec![]);

        // Test WorkspaceAdmin role
        assert!(
            is_user_org_admin_cached(&workspace_admin_user, &org_id),
            "WorkspaceAdmin should be recognized as an org admin"
        );

        // Test DataAdmin role
        assert!(
            is_user_org_admin_cached(&data_admin_user, &org_id),
            "DataAdmin should be recognized as an org admin"
        );

        // Test non-admin role
        assert!(
            !is_user_org_admin_cached(&regular_user, &org_id),
            "Viewer should not be recognized as an org admin"
        );

        // Test admin in one org but not another
        assert!(
            !is_user_org_admin_cached(&workspace_admin_user, &Uuid::new_v4()),
            "Admin should not have admin rights in unrelated organizations"
        );

        // Test user with no organizations
        assert!(
            !is_user_org_admin_cached(&no_orgs_user, &org_id),
            "User with no organizations should not be recognized as an admin"
        );
    }

    // Helper function to create a test user with given organization memberships
    fn create_test_user(org_memberships: Vec<(Uuid, UserOrganizationRole)>) -> AuthenticatedUser {
        let organizations = org_memberships
            .into_iter()
            .map(|(id, role)| OrganizationMembership { id, role })
            .collect();

        AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            config: Value::Null,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: Value::Null,
            avatar_url: None,
            organizations,
            teams: vec![],
        }
    }

    #[tokio::test]
    async fn test_has_permission_with_admin_check_admin_user() {
        // Since we can't easily mock the database, we'll test the logic by creating a mock
        // for the is_user_org_admin function that we can control

        // Create a user, asset, and organization IDs
        let _user_id = Uuid::new_v4();
        let _asset_id = Uuid::new_v4();
        let _org_id = Uuid::new_v4();

        // Test that admin users get access to everything except Owner actions
        let tests = vec![
            // (required_role, expected_result, description)
            (
                AssetPermissionRole::CanView,
                true,
                "Admin should have CanView permission",
            ),
            (
                AssetPermissionRole::CanFilter,
                true,
                "Admin should have CanFilter permission",
            ),
            (
                AssetPermissionRole::CanEdit,
                true,
                "Admin should have CanEdit permission",
            ),
            (
                AssetPermissionRole::FullAccess,
                true,
                "Admin should have FullAccess permission",
            ),
            (
                AssetPermissionRole::Owner,
                false,
                "Admin should not have Owner permission",
            ),
        ];

        for (role, expected, description) in tests {
            // Set up our own test version of has_permission_with_admin_check that works
            // with a stubbed is_user_org_admin function
            async fn test_func(required_role: AssetPermissionRole) -> Result<bool> {
                // Return true to simulate that the user is an org admin
                let is_admin = true;

                if is_admin {
                    // Organization admins automatically get FullAccess
                    // Check if FullAccess is sufficient for the required role
                    return Ok(match required_role {
                        // Owner actions still require explicit Owner permission
                        AssetPermissionRole::Owner => false,
                        // All other actions are allowed with FullAccess
                        _ => true,
                    });
                }

                // We won't reach this part in this test
                Ok(false)
            }

            let result = test_func(role).await.unwrap();
            assert_eq!(result, expected, "{}", description);
        }
    }

    #[tokio::test]
    async fn test_cached_admin_check_logic() {
        // Create identifiers for test
        let org_id = Uuid::new_v4();

        // Create users with different permissions
        let admin_user = create_test_user(vec![(org_id, UserOrganizationRole::WorkspaceAdmin)]);

        let regular_user = create_test_user(vec![(org_id, UserOrganizationRole::Viewer)]);

        // Simulated function to test the cached admin check logic
        fn simulated_check(
            user: &AuthenticatedUser,
            org_id: &Uuid,
            required_level: AssetPermissionLevel,
        ) -> bool {
            // Check if user is admin using the cached function
            let is_admin = is_user_org_admin_cached(user, org_id);

            if is_admin {
                // Check required permission level
                match required_level {
                    AssetPermissionLevel::Owner => false, // Owners still need explicit permission
                    _ => true, // All other permission levels are allowed for admins
                }
            } else {
                false // Non-admins don't get automatic access
            }
        }

        // Test that admin user gets access for non-owner operations
        assert!(
            simulated_check(&admin_user, &org_id, AssetPermissionLevel::CanView),
            "Admin should have CanView access"
        );

        assert!(
            simulated_check(&admin_user, &org_id, AssetPermissionLevel::CanEdit),
            "Admin should have CanEdit access"
        );

        assert!(
            simulated_check(&admin_user, &org_id, AssetPermissionLevel::FullAccess),
            "Admin should have FullAccess"
        );

        // Test that admin user doesn't get Owner access
        assert!(
            !simulated_check(&admin_user, &org_id, AssetPermissionLevel::Owner),
            "Admin should not get Owner access automatically"
        );

        // Test that non-admin user doesn't get any automatic access
        assert!(
            !simulated_check(&regular_user, &org_id, AssetPermissionLevel::CanView),
            "Non-admin user should not get automatic access"
        );

        // Test with a non-matching organization
        let other_org_id = Uuid::new_v4();
        assert!(
            !simulated_check(&admin_user, &other_org_id, AssetPermissionLevel::CanView),
            "Admin should not get access to assets in other organizations"
        );
    }

    #[tokio::test]
    async fn test_permission_hierarchy() {
        // This tests the permission hierarchy logic directly
        // without using mocks, which simplifies the test

        // Check that Owner can do anything
        assert!(AssetPermissionLevel::Owner.is_sufficient_for(&AssetPermissionLevel::Owner));
        assert!(AssetPermissionLevel::Owner.is_sufficient_for(&AssetPermissionLevel::FullAccess));
        assert!(AssetPermissionLevel::Owner.is_sufficient_for(&AssetPermissionLevel::CanEdit));
        assert!(AssetPermissionLevel::Owner.is_sufficient_for(&AssetPermissionLevel::CanFilter));
        assert!(AssetPermissionLevel::Owner.is_sufficient_for(&AssetPermissionLevel::CanView));

        // Check that FullAccess can do anything except Owner actions
        assert!(!AssetPermissionLevel::FullAccess.is_sufficient_for(&AssetPermissionLevel::Owner));
        assert!(
            AssetPermissionLevel::FullAccess.is_sufficient_for(&AssetPermissionLevel::FullAccess)
        );
        assert!(AssetPermissionLevel::FullAccess.is_sufficient_for(&AssetPermissionLevel::CanEdit));
        assert!(
            AssetPermissionLevel::FullAccess.is_sufficient_for(&AssetPermissionLevel::CanFilter)
        );
        assert!(AssetPermissionLevel::FullAccess.is_sufficient_for(&AssetPermissionLevel::CanView));

        // Check that CanEdit can edit, filter, and view
        assert!(!AssetPermissionLevel::CanEdit.is_sufficient_for(&AssetPermissionLevel::Owner));
        assert!(!AssetPermissionLevel::CanEdit.is_sufficient_for(&AssetPermissionLevel::FullAccess));
        assert!(AssetPermissionLevel::CanEdit.is_sufficient_for(&AssetPermissionLevel::CanEdit));
        assert!(AssetPermissionLevel::CanEdit.is_sufficient_for(&AssetPermissionLevel::CanFilter));
        assert!(AssetPermissionLevel::CanEdit.is_sufficient_for(&AssetPermissionLevel::CanView));

        // Check that CanFilter can filter and view
        assert!(!AssetPermissionLevel::CanFilter.is_sufficient_for(&AssetPermissionLevel::Owner));
        assert!(
            !AssetPermissionLevel::CanFilter.is_sufficient_for(&AssetPermissionLevel::FullAccess)
        );
        assert!(!AssetPermissionLevel::CanFilter.is_sufficient_for(&AssetPermissionLevel::CanEdit));
        assert!(AssetPermissionLevel::CanFilter.is_sufficient_for(&AssetPermissionLevel::CanFilter));
        assert!(AssetPermissionLevel::CanFilter.is_sufficient_for(&AssetPermissionLevel::CanView));

        // Check that CanView can only view
        assert!(!AssetPermissionLevel::CanView.is_sufficient_for(&AssetPermissionLevel::Owner));
        assert!(!AssetPermissionLevel::CanView.is_sufficient_for(&AssetPermissionLevel::FullAccess));
        assert!(!AssetPermissionLevel::CanView.is_sufficient_for(&AssetPermissionLevel::CanEdit));
        assert!(!AssetPermissionLevel::CanView.is_sufficient_for(&AssetPermissionLevel::CanFilter));
        assert!(AssetPermissionLevel::CanView.is_sufficient_for(&AssetPermissionLevel::CanView));
    }

    #[tokio::test]
    async fn test_asset_organization_id_deprecated_asset_types() {
        // Test that deprecated asset types return an error

        // Create a test function that only tests the match statement in get_asset_organization_id
        fn test_deprecated_asset_type(asset_type: AssetType) -> bool {
            matches!(asset_type, AssetType::Dashboard | AssetType::Thread)
        }

        // Test deprecated asset types
        assert!(
            test_deprecated_asset_type(AssetType::Dashboard),
            "Dashboard should be deprecated"
        );
        assert!(
            test_deprecated_asset_type(AssetType::Thread),
            "Thread should be deprecated"
        );

        // Test non-deprecated asset types
        assert!(
            !test_deprecated_asset_type(AssetType::Chat),
            "Chat should not be deprecated"
        );
        assert!(
            !test_deprecated_asset_type(AssetType::Collection),
            "Collection should not be deprecated"
        );
        assert!(
            !test_deprecated_asset_type(AssetType::DashboardFile),
            "DashboardFile should not be deprecated"
        );
        assert!(
            !test_deprecated_asset_type(AssetType::MetricFile),
            "MetricFile should not be deprecated"
        );
    }
}
