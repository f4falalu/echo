use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::metric_files::fetch_metric_file,
};
use sharing::{
    remove_asset_permissions::remove_share_by_email,
};
use tracing::info;
use uuid::Uuid;

/// Handler to delete sharing permissions for a metric
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to delete sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `emails` - A list of email addresses for which to remove sharing permissions
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn delete_metric_sharing_handler(
    metric_id: &Uuid,
    user_id: &Uuid,
    emails: Vec<String>,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        emails = ?emails,
        "Deleting sharing permissions for metric"
    );

    // 1. Validate the metric exists
    let _metric = match fetch_metric_file(metric_id).await? {
        Some(metric) => metric,
        None => return Err(anyhow!("Metric not found")),
    };

    // 2. Check if user has permission to delete sharing for the metric (Owner or FullAccess)
    let has_sufficient_permission = has_permission(
        *metric_id,
        AssetType::MetricFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_sufficient_permission {
        return Err(anyhow!("User does not have permission to delete sharing for this metric"));
    }

    // 3. Process each email and delete sharing permissions
    for email in emails {
        // The remove_share_by_email function handles soft deletion of permissions
        match remove_share_by_email(
            &email,
            *metric_id,
            AssetType::MetricFile,
            *user_id,
        ).await {
            Ok(_) => {
                info!("Deleted sharing permission for email: {} on metric: {}", email, metric_id);
            },
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    info!("No active permission found for email {}: {}", email, e);
                    continue;
                }
                
                return Err(anyhow!("Failed to delete sharing for email {}: {}", email, e));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    

    #[tokio::test]
    async fn test_delete_metric_sharing_handler() {
        // These tests would be implemented with proper mocking in a real-world scenario
        // Currently just placeholders for the test structure
        assert!(true);
    }
}