use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::dashboard_files,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::{
    check_asset_permission::check_access,
    list_asset_permissions::list_shares,
    types::AssetPermissionWithUser,
};
use tracing::{error, info};
use uuid::Uuid;

/// Lists all sharing permissions for a specific dashboard
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user_id` - The unique identifier of the user requesting the permissions
///
/// # Returns
///
/// A vector of asset permissions with user information
pub async fn list_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user_id: &Uuid,
) -> Result<Vec<AssetPermissionWithUser>> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        "Listing dashboard sharing permissions"
    );

    // 1. Validate the dashboard exists
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

    let dashboard_exists = dashboard_files::table
        .filter(dashboard_files::id.eq(dashboard_id))
        .filter(dashboard_files::deleted_at.is_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await
        .map_err(|e| {
            error!("Error checking if dashboard exists: {}", e);
            anyhow!("Database error: {}", e)
        })?;

    if dashboard_exists == 0 {
        error!(
            dashboard_id = %dashboard_id,
            "Dashboard not found"
        );
        return Err(anyhow!("Dashboard not found"));
    }

    // 2. Check if user has permission to view the dashboard
    let user_role = check_access(
        *dashboard_id,
        AssetType::DashboardFile,
        *user_id,
        IdentityType::User,
    )
    .await
    .map_err(|e| {
        error!(
            dashboard_id = %dashboard_id,
            user_id = %user_id,
            "Error checking dashboard access: {}", e
        );
        anyhow!("Error checking dashboard access: {}", e)
    })?;

    if user_role.is_none() {
        error!(
            dashboard_id = %dashboard_id,
            user_id = %user_id,
            "User does not have permission to view this dashboard"
        );
        return Err(anyhow!("User does not have permission to view this dashboard"));
    }

    // 3. Get all permissions for the dashboard
    let permissions = list_shares(
        *dashboard_id,
        AssetType::DashboardFile,
    )
    .await
    .map_err(|e| {
        error!(
            dashboard_id = %dashboard_id,
            "Error listing dashboard permissions: {}", e
        );
        anyhow!("Error listing sharing permissions: {}", e)
    })?;

    info!(
        dashboard_id = %dashboard_id,
        permission_count = permissions.len(),
        "Successfully retrieved dashboard sharing permissions"
    );

    Ok(permissions)
}

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_list_dashboard_sharing_handler() {
        // Placeholder test implementation
        assert!(true);
    }
}