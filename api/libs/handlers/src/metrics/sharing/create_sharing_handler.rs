use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::metric_files::fetch_metric_file,
};
use sharing::{
    create_asset_permission::create_share_by_email,
};
use tracing::info;
use uuid::Uuid;

/// Handler to create sharing permissions for a metric
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to create sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `emails_and_roles` - List of tuples containing (email, role) pairs
///
/// # Returns
/// * `Result<()>` - Success if all sharing permissions were created
pub async fn create_metric_sharing_handler(
    metric_id: &Uuid,
    user_id: &Uuid,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        recipients_count = emails_and_roles.len(),
        "Creating sharing permissions for metric"
    );

    // 1. Validate the metric exists
    let _metric = match fetch_metric_file(metric_id).await? {
        Some(metric) => metric,
        None => return Err(anyhow!("Metric not found")),
    };

    // 2. Check if user has permission to share the metric (Owner or FullAccess)
    let has_permission = has_permission(
        *metric_id,
        AssetType::MetricFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission {
        return Err(anyhow!("User does not have permission to share this metric"));
    }

    // 3. Process each email-role pair and create sharing permissions
    for (email, role) in emails_and_roles {
        // Validate email format
        if !email.contains('@') {
            return Err(anyhow!("Invalid email format: {}", email));
        }

        // Create or update the permission using create_share_by_email
        match create_share_by_email(
            &email,
            *metric_id,
            AssetType::MetricFile,
            role,
            *user_id,
        ).await {
            Ok(_) => {
                info!("Created sharing permission for email: {} with role: {:?} on metric: {}", email, role, metric_id);
            },
            Err(e) => {
                return Err(anyhow!("Failed to create sharing for email {}: {}", email, e));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_create_metric_sharing_invalid_email() {
        let metric_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let emails_and_roles = vec![("invalid-email-format".to_string(), AssetPermissionRole::CanView)];

        let result = create_metric_sharing_handler(&metric_id, &user_id, emails_and_roles).await;

        assert!(result.is_err());
        let error = result.unwrap_err().to_string();
        assert!(error.contains("Invalid email format"));
    }

    // Note: For comprehensive tests, we would need to set up proper mocks
    // for external dependencies like fetch_metric_file, has_permission,
    // and create_share_by_email. This would typically involve using a
    // mocking framework that's compatible with async functions.
}