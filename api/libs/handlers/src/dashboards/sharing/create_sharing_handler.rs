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
    create_asset_permission::create_share_by_email,
};
use tracing::{error, info};
use uuid::Uuid;

/// Creates sharing permissions for a dashboard with specified users
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user_id` - The unique identifier of the user creating the permissions
/// * `emails_and_roles` - Vector of email addresses and roles to assign
///
/// # Returns
///
/// Ok(()) on success, or an error if the operation fails
pub async fn create_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user_id: &Uuid,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        recipient_count = emails_and_roles.len(),
        "Creating dashboard sharing permissions"
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

    // 2. Check if user has permission to share the dashboard (Owner or FullAccess)
    let has_share_permission = has_permission(
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
            "Error checking dashboard permission: {}", e
        );
        anyhow!("Error checking permissions: {}", e)
    })?;

    if !has_share_permission {
        error!(
            dashboard_id = %dashboard_id,
            user_id = %user_id,
            "User does not have permission to share this dashboard"
        );
        return Err(anyhow!("User does not have permission to share this dashboard"));
    }

    // 3. Process each email and create sharing permissions
    let recipient_count = emails_and_roles.len();
    for (email, role) in emails_and_roles {
        if !email.contains('@') {
            error!("Invalid email format: {}", email);
            return Err(anyhow!("Invalid email format: {}", email));
        }

        // Create or update the permission using create_share_by_email
        match create_share_by_email(
            &email,
            *dashboard_id,
            AssetType::DashboardFile,
            role,
            *user_id,
        )
        .await
        {
            Ok(_) => {
                info!("Created sharing permission for email: {} on dashboard: {}", email, dashboard_id);
            },
            Err(e) => {
                error!("Failed to create sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to create sharing for email {}: {}", email, e));
            }
        }
    }

    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        recipient_count = recipient_count,
        "Successfully created dashboard sharing permissions"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    
    
    

    #[tokio::test]
    async fn test_create_dashboard_sharing_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true); 
    }
}