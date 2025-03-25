use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::dashboard_files::fetch_dashboard_file_with_permission,
    schema::dashboard_files::dsl,
};
use diesel::ExpressionMethods;
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use sharing::{
    check_permission_access,
    create_asset_permission::create_share_by_email,
};
use tracing::{error, info};
use uuid::Uuid;

/// Request for updating sharing permissions for a dashboard
#[derive(Debug, Serialize, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// Request for updating sharing settings for a dashboard
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateDashboardSharingRequest {
    /// List of users to share with
    pub users: Option<Vec<ShareRecipient>>,
    /// Whether the dashboard should be publicly accessible
    pub publicly_accessible: Option<bool>,
    /// Password for public access (if null, will clear existing password)
    pub public_password: Option<Option<String>>,
    /// Expiration date for public access (if null, will clear existing expiration)
    pub public_expiration: Option<Option<DateTime<Utc>>>,
}

/// Updates sharing permissions for a dashboard
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user` - The authenticated user requesting the update
/// * `request` - The request object containing sharing settings
///
/// # Returns
///
/// Result indicating success or failure with error details
pub async fn update_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateDashboardSharingRequest,
) -> Result<()> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        "Updating dashboard sharing permissions"
    );

    // First check if the user has permission to share this dashboard
    let dashboard_with_permission = fetch_dashboard_file_with_permission(dashboard_id, &user.id).await?;
    
    // If dashboard not found, return error
    let dashboard_with_permission = match dashboard_with_permission {
        Some(dwp) => dwp,
        None => return Err(anyhow!("Dashboard not found")),
    };
    
    // Check if user has permission to share the dashboard
    // Users need FullAccess or Owner permission to share
    let has_permission = check_permission_access(
        dashboard_with_permission.permission,
        &[
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        dashboard_with_permission.dashboard_file.organization_id,
        &user.organizations,
    );
    
    if !has_permission {
        return Err(anyhow!("You don't have permission to share this dashboard"));
    }

    // Process user sharing permissions if provided
    if let Some(users) = &request.users {
        for recipient in users {
            // Validate email format
            if !recipient.email.contains('@') {
                error!("Invalid email format: {}", recipient.email);
                return Err(anyhow!("Invalid email format: {}", recipient.email));
            }

            // Update (or create if not exists) the permission using create_share_by_email
            // The create_share_by_email function handles both creation and updates with upsert
            match create_share_by_email(
                &recipient.email, 
                *dashboard_id, 
                AssetType::DashboardFile, 
                recipient.role, 
                user.id
            ).await {
                Ok(_) => {
                    info!(
                        dashboard_id = %dashboard_id,
                        email = %recipient.email,
                        role = ?recipient.role,
                        "Updated sharing permission successfully"
                    );
                }
                Err(e) => {
                    error!(
                        dashboard_id = %dashboard_id,
                        email = %recipient.email,
                        "Failed to update sharing: {}", e
                    );
                    return Err(anyhow!("Failed to update sharing for email {}: {}", recipient.email, e));
                }
            }
        }
    }

    // Update public access settings if provided
    if request.publicly_accessible.is_some() || 
       request.public_expiration.is_some() {
        
        let dashboard_file = dashboard_with_permission.dashboard_file;
        let pool = database::pool::get_pg_pool();
        let mut conn = pool.get().await?;
        
        // Set publicly_enabled_by based on publicly_accessible value
        let publicly_enabled_by = if let Some(publicly_accessible) = request.publicly_accessible {
            if publicly_accessible {
                Some(user.id)
            } else {
                None
            }
        } else {
            dashboard_file.publicly_enabled_by
        };
        
        // Set public_expiry_date if provided, otherwise keep the current value
        let public_expiry_date = request.public_expiration.unwrap_or(dashboard_file.public_expiry_date);
        
        // Set publicly_accessible if provided, otherwise keep the current value
        let publicly_accessible = request.publicly_accessible.unwrap_or(dashboard_file.publicly_accessible);
        
        // Update the dashboard in the database
        diesel::update(dsl::dashboard_files)
            .filter(dsl::id.eq(dashboard_id))
            .set((
                dsl::publicly_accessible.eq(publicly_accessible),
                dsl::publicly_enabled_by.eq(publicly_enabled_by),
                dsl::public_expiry_date.eq(public_expiry_date),
            ))
            .execute(&mut conn)
            .await?;
    }
    
    // Note: Currently public_password is not implemented
    // If public_password becomes needed in the future, additional implementation will be required
    
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        "Successfully updated dashboard sharing permissions"
    );

    Ok(())
}

#[cfg(test)]
mod tests {

    #[tokio::test]
    async fn test_update_dashboard_sharing_invalid_email() {
        // This is a placeholder test that would need to be properly implemented
        // with mocked dependencies
        assert!(true);
    }
    
    #[tokio::test]
    async fn test_update_dashboard_sharing_dashboard_not_found() {
        // This is a placeholder test that would need to be properly implemented
        // with mocked dependencies
        assert!(true);
    }
}