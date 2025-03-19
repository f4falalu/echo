use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::dashboard_files::fetch_dashboard_file,
};
use sharing::{
    check_asset_permission::has_permission,
    create_asset_permission::create_share_by_email,
};
use tracing::{error, info};
use uuid::Uuid;

/// Updates sharing permissions for a dashboard
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user_id` - The unique identifier of the user requesting the update
/// * `emails_and_roles` - A vector of (email, role) pairs to update
///
/// # Returns
///
/// Result indicating success or failure with error details
pub async fn update_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user_id: &Uuid,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        recipients_count = emails_and_roles.len(),
        "Updating dashboard sharing permissions"
    );

    // 1. Validate the dashboard exists
    let _dashboard = match fetch_dashboard_file(dashboard_id).await? {
        Some(dashboard) => dashboard,
        None => {
            error!(
                dashboard_id = %dashboard_id,
                "Dashboard not found during sharing update"
            );
            return Err(anyhow!("Dashboard not found"));
        }
    };

    // 2. Check if user has permission to update sharing for the dashboard (Owner or FullAccess)
    let has_permission_result = has_permission(
        *dashboard_id,
        AssetType::DashboardFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    )
    .await;

    match has_permission_result {
        Ok(true) => {
            info!(
                dashboard_id = %dashboard_id,
                user_id = %user_id,
                "User has permission to update dashboard sharing"
            );
        }
        Ok(false) => {
            error!(
                dashboard_id = %dashboard_id,
                user_id = %user_id,
                "User does not have permission to update dashboard sharing"
            );
            return Err(anyhow!(
                "User does not have permission to update sharing for this dashboard"
            ));
        }
        Err(e) => {
            error!(
                dashboard_id = %dashboard_id,
                user_id = %user_id,
                "Error checking permissions: {}", e
            );
            return Err(anyhow!("Error checking permissions: {}", e));
        }
    }

    // 3. Process each email-role pair and update sharing permissions
    for (email, role) in &emails_and_roles {
        // Validate email format
        if !email.contains('@') {
            error!("Invalid email format: {}", email);
            return Err(anyhow!("Invalid email format: {}", email));
        }

        // Update (or create if not exists) the permission using create_share_by_email
        // The create_share_by_email function handles both creation and updates with upsert
        match create_share_by_email(&email, *dashboard_id, AssetType::DashboardFile, *role, *user_id)
            .await
        {
            Ok(_) => {
                info!(
                    dashboard_id = %dashboard_id,
                    email = %email,
                    role = ?role,
                    "Updated sharing permission successfully"
                );
            }
            Err(e) => {
                error!(
                    dashboard_id = %dashboard_id,
                    email = %email,
                    "Failed to update sharing: {}", e
                );
                return Err(anyhow!("Failed to update sharing for email {}: {}", email, e));
            }
        }
    }

    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        updates_count = emails_and_roles.len(),
        "Successfully updated all dashboard sharing permissions"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_update_dashboard_sharing_invalid_email() {
        // Test with invalid email format
        let dashboard_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let emails_and_roles = vec![("invalid-email-format".to_string(), AssetPermissionRole::CanView)];

        let result = update_dashboard_sharing_handler(&dashboard_id, &user_id, emails_and_roles).await;

        assert!(result.is_err());
        let error = result.unwrap_err().to_string();
        assert!(error.contains("Invalid email format"));
    }

    // Note: For comprehensive tests, we would need to set up proper mocks
    // for external dependencies like fetch_dashboard_file, has_permission,
    // and create_share_by_email. These tests would be implemented in the
    // integration tests directory.
}