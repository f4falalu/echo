use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, UserOrganizationRole},
    pool::get_pg_pool,
    schema::users_to_organizations,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

/// Checks if a user has admin privileges in an organization
///
/// # Arguments
/// * `user_id` - The ID of the user to check
/// * `organization_id` - The ID of the organization to check against
///
/// # Returns
/// * `Result<bool>` - `true` if the user is a WorkspaceAdmin or DataAdmin in the organization, otherwise `false`
pub async fn is_user_org_admin(user_id: &Uuid, organization_id: &Uuid) -> Result<bool> {
    let mut conn = get_pg_pool().get().await?;

    // Query the user's role in the organization
    let user_role = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::organization_id.eq(organization_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select(users_to_organizations::role)
        .first::<UserOrganizationRole>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to get user organization role: {}", e))?;

    // Check if the user has an admin role
    Ok(matches!(
        user_role,
        UserOrganizationRole::WorkspaceAdmin | UserOrganizationRole::DataAdmin
    ))
}

/// Checks if a user has admin access to an asset based on their organization role
///
/// # Arguments
/// * `user_id` - The ID of the user to check
/// * `organization_id` - The ID of the organization that owns the asset
///
/// # Returns
/// * `Result<Option<AssetPermissionRole>>` - Returns `Some(AssetPermissionRole::FullAccess)` if the user
///   is a WorkspaceAdmin or DataAdmin in the organization, otherwise `None`
pub async fn check_admin_access(
    user_id: &Uuid,
    organization_id: &Uuid,
) -> Result<Option<AssetPermissionRole>> {
    if is_user_org_admin(user_id, organization_id).await? {
        Ok(Some(AssetPermissionRole::FullAccess))
    } else {
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::UserOrganizationRole;
    use diesel::{ExpressionMethods, QueryDsl};
    use diesel_async::RunQueryDsl;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_is_user_org_admin() {
        // This test would require a test database with fixture data
        // For now, we'll just outline the test structure
        
        // Setup: Create organization and user
        // let organization_id = Uuid::new_v4();
        // let admin_user_id = Uuid::new_v4();
        // let non_admin_user_id = Uuid::new_v4();
        
        // Add admin user to organization with WorkspaceAdmin role
        // Add non-admin user to organization with Viewer role
        
        // Test admin user
        // let is_admin = is_user_org_admin(&admin_user_id, &organization_id).await.unwrap();
        // assert!(is_admin);
        
        // Test non-admin user
        // let is_admin = is_user_org_admin(&non_admin_user_id, &organization_id).await.unwrap();
        // assert!(!is_admin);
    }

    #[tokio::test]
    async fn test_check_admin_access() {
        // Similar to the above test, but checking AssetPermissionRole output
        
        // Test admin user
        // let admin_access = check_admin_access(&admin_user_id, &organization_id).await.unwrap();
        // assert_eq!(admin_access, Some(AssetPermissionRole::FullAccess));
        
        // Test non-admin user
        // let admin_access = check_admin_access(&non_admin_user_id, &organization_id).await.unwrap();
        // assert_eq!(admin_access, None);
    }
}