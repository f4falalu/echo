use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::metric_files::fetch_metric_file,
};
use sharing::{
    check_asset_permission::has_permission,
    create_asset_permission::create_share_by_email,
};
use tracing::info;
use uuid::Uuid;

/// Handler to update sharing permissions for a metric
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to update sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `emails_and_roles` - List of tuples containing (email, role) pairs to update
///
/// # Returns
/// * `Result<()>` - Success if all sharing permissions were updated
pub async fn update_metric_sharing_handler(
    metric_id: &Uuid,
    user_id: &Uuid,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        recipients_count = emails_and_roles.len(),
        "Updating sharing permissions for metric"
    );

    // 1. Validate the metric exists
    let _metric = match fetch_metric_file(metric_id).await? {
        Some(metric) => metric,
        None => return Err(anyhow!("Metric not found")),
    };

    // 2. Check if user has permission to update sharing for the metric (Owner or FullAccess)
    let has_permission = has_permission(
        *metric_id,
        AssetType::MetricFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission {
        return Err(anyhow!("User does not have permission to update sharing for this metric"));
    }

    // 3. Process each email-role pair and update sharing permissions
    for (email, role) in emails_and_roles {
        // Validate email format
        if !email.contains('@') {
            return Err(anyhow!("Invalid email format: {}", email));
        }

        // Update (or create if not exists) the permission using create_share_by_email
        // The create_share_by_email function handles both creation and updates with upsert
        match create_share_by_email(
            &email,
            *metric_id,
            AssetType::MetricFile,
            role,
            *user_id,
        ).await {
            Ok(_) => {
                info!("Updated sharing permission for email: {} with role: {:?} on metric: {}", email, role, metric_id);
            },
            Err(e) => {
                return Err(anyhow!("Failed to update sharing for email {}: {}", email, e));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_update_metric_sharing_invalid_email() {
        let metric_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let emails_and_roles = vec![("invalid-email-format".to_string(), AssetPermissionRole::CanView)];

        let result = update_metric_sharing_handler(&metric_id, &user_id, emails_and_roles).await;

        assert!(result.is_err());
        let error = result.unwrap_err().to_string();
        assert!(error.contains("Invalid email format"));
    }

    // Note: For comprehensive tests, we would need to set up proper mocks
    // for external dependencies like fetch_metric_file, has_permission,
    // and create_share_by_email. This would typically involve using a
    // mocking framework that's compatible with async functions.
}