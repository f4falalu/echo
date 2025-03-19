use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::dashboard_files,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::{
    check_asset_permission::has_permission,
    remove_asset_permissions::remove_share_by_email,
};
use tracing::{error, info};
use uuid::Uuid;

/// Deletes sharing permissions for a specific dashboard
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user_id` - The unique identifier of the user requesting the deletion
/// * `emails` - Vector of email addresses to remove sharing for
///
/// # Returns
///
/// Result indicating success or failure
pub async fn delete_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user_id: &Uuid,
    emails: Vec<String>,
) -> Result<()> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        email_count = emails.len(),
        "Deleting dashboard sharing permissions"
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

    // 2. Check if user has permission to delete sharing for the dashboard (Owner or FullAccess)
    let has_permission = has_permission(
        *dashboard_id,
        AssetType::DashboardFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    )
    .await
    .map_err(|e| {
        error!(
            dashboard_id = %dashboard_id,
            user_id = %user_id,
            "Error checking dashboard permissions: {}", e
        );
        anyhow!("Error checking dashboard permissions: {}", e)
    })?;

    if !has_permission {
        error!(
            dashboard_id = %dashboard_id,
            user_id = %user_id,
            "User does not have permission to delete sharing for this dashboard"
        );
        return Err(anyhow!("User does not have permission to delete sharing for this dashboard"));
    }

    // 3. Process each email and delete sharing permissions
    for email in &emails {
        // The remove_share_by_email function handles soft deletion of permissions
        match remove_share_by_email(
            email,
            *dashboard_id,
            AssetType::DashboardFile,
            *user_id,
        )
        .await
        {
            Ok(_) => {
                info!(
                    dashboard_id = %dashboard_id,
                    email = %email,
                    "Deleted sharing permission"
                );
            },
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    info!(
                        dashboard_id = %dashboard_id,
                        email = %email,
                        "No active permission found to delete"
                    );
                    continue;
                }
                
                error!(
                    dashboard_id = %dashboard_id,
                    email = %email,
                    "Failed to delete sharing: {}", e
                );
                return Err(anyhow!("Failed to delete sharing for email {}: {}", email, e));
            }
        }
    }

    info!(
        dashboard_id = %dashboard_id,
        email_count = emails.len(),
        "Successfully deleted dashboard sharing permissions"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_delete_dashboard_sharing_handler() {
        // Placeholder test implementation
        assert!(true);
    }
}