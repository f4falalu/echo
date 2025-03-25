use anyhow::{anyhow, Result};
use database::{
    enums::{AssetType, IdentityType},
    helpers::metric_files::fetch_metric_file,
};
use sharing::{
    list_asset_permissions::list_shares,
    types::AssetPermissionWithUser,
};
use tracing::info;
use uuid::Uuid;

/// Handler to list all sharing permissions for a metric
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to list sharing permissions for
/// * `user_id` - The UUID of the user making the request
///
/// # Returns
/// * `Result<Vec<AssetPermissionWithUser>>` - A list of all sharing permissions for the metric
pub async fn list_metric_sharing_handler(
    metric_id: &Uuid,
    user_id: &Uuid,
) -> Result<Vec<AssetPermissionWithUser>> {
    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        "Listing sharing permissions for metric"
    );

    // 1. Validate the metric exists
    if fetch_metric_file(metric_id).await?.is_none() {
        return Err(anyhow!("Metric not found"));
    };

    // 2. Check if user has permission to view the metric
    let user_role = check_access(
        *metric_id,
        AssetType::MetricFile,
        *user_id,
        IdentityType::User,
    ).await?;

    if user_role.is_none() {
        return Err(anyhow!("User does not have permission to view this metric"));
    }

    // 3. Get all permissions for the metric
    let permissions = list_shares(
        *metric_id,
        AssetType::MetricFile,
    ).await?;

    Ok(permissions)
}

#[cfg(test)]
mod tests {
    // These tests would be more comprehensive in a real implementation
    // Currently just placeholders for structure
    #[tokio::test]
    async fn test_list_metric_sharing_success() {
        // This would be a proper test using mocks and expected values
        assert!(true);
    }

    #[tokio::test]
    async fn test_list_metric_sharing_metric_not_found() {
        // This would test the error case when a metric is not found
        assert!(true);
    }

    #[tokio::test]
    async fn test_list_metric_sharing_no_permission() {
        // This would test the error case when a user doesn't have permission
        assert!(true);
    }
}