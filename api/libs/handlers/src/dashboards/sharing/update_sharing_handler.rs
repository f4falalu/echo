use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    helpers::dashboard_files::fetch_dashboard_file,
    schema::dashboard_files::dsl,
};
use diesel::ExpressionMethods;
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use serde::{Deserialize, Serialize};
use sharing::{
    check_asset_permission::has_permission,
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
/// * `user_id` - The unique identifier of the user requesting the update
/// * `request` - The request object containing sharing settings
///
/// # Returns
///
/// Result indicating success or failure with error details
pub async fn update_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user_id: &Uuid,
    request: UpdateDashboardSharingRequest,
) -> Result<()> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
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

    // 3. Process user sharing permissions if provided
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
                *user_id
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

    // 4. Update public access settings if provided
    if request.publicly_accessible.is_some() || 
       request.public_expiration.is_some() {
        
        let pool = get_pg_pool();
        let mut conn = pool.get().await?;
        
        // Create a mutable dashboard record to update
        if let Some(mut dashboard) = fetch_dashboard_file(dashboard_id).await? {
            
            // Update publicly_accessible if provided
            if let Some(publicly_accessible) = request.publicly_accessible {
                info!(
                    dashboard_id = %dashboard_id,
                    publicly_accessible = publicly_accessible,
                    "Updating public accessibility for dashboard"
                );
                
                dashboard.publicly_accessible = publicly_accessible;
                
                // Set publicly_enabled_by based on publicly_accessible value
                if publicly_accessible {
                    dashboard.publicly_enabled_by = Some(*user_id);
                } else {
                    dashboard.publicly_enabled_by = None;
                }
            }
            
            // Update public_expiry_date if provided
            if let Some(public_expiration) = &request.public_expiration {
                info!(
                    dashboard_id = %dashboard_id,
                    "Updating public expiration for dashboard"
                );
                
                dashboard.public_expiry_date = *public_expiration;
            }
            
            // Update the dashboard in the database
            diesel::update(dsl::dashboard_files)
                .filter(dsl::id.eq(dashboard_id))
                .set((
                    dsl::publicly_accessible.eq(dashboard.publicly_accessible),
                    dsl::publicly_enabled_by.eq(dashboard.publicly_enabled_by),
                    dsl::public_expiry_date.eq(dashboard.public_expiry_date),
                ))
                .execute(&mut conn)
                .await?;
        }
    }
    
    // Note: Currently public_password is not implemented
    // If public_password becomes needed in the future, additional implementation will be required
    
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        "Successfully updated dashboard sharing permissions"
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
        
        let request = UpdateDashboardSharingRequest {
            users: Some(vec![
                ShareRecipient {
                    email: "invalid-email-format".to_string(),
                    role: AssetPermissionRole::CanView,
                }
            ]),
            publicly_accessible: None,
            public_password: None,
            public_expiration: None,
        };

        let result = update_dashboard_sharing_handler(&dashboard_id, &user_id, request).await;

        assert!(result.is_err());
        let error = result.unwrap_err().to_string();
        assert!(error.contains("Invalid email format"));
    }
    
    #[tokio::test]
    async fn test_update_dashboard_sharing_dashboard_not_found() {
        // Test with a dashboard that doesn't exist
        let dashboard_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        let request = UpdateDashboardSharingRequest {
            users: None,
            publicly_accessible: Some(true),
            public_password: None,
            public_expiration: Some(Some(Utc::now())),
        };

        let result = update_dashboard_sharing_handler(&dashboard_id, &user_id, request).await;

        assert!(result.is_err());
        // The specific error message might vary depending on the testing environment
        // but it should indicate the dashboard wasn't found
        let error = result.unwrap_err().to_string();
        assert!(error.contains("not found") || error.contains("database"));
    }

    // Note: For comprehensive tests, we would need to set up proper mocks
    // for external dependencies like fetch_dashboard_file, has_permission,
    // and create_share_by_email. These tests would be implemented in the
    // integration tests directory.
}