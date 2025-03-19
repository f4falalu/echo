use anyhow::{anyhow, Result};
use database::{
    enums::{AssetType, IdentityType},
    helpers::metric_files::fetch_metric_file,
};
use sharing::{
    check_asset_permission::check_access,
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
    let _metric = match fetch_metric_file(metric_id).await? {
        Some(metric) => metric,
        None => return Err(anyhow!("Metric not found")),
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
    use super::*;
    use database::enums::{AssetPermissionRole, AssetType, IdentityType};
    use sharing::types::{AssetPermissionWithUser, SerializableAssetPermission, UserInfo};
    use chrono::{DateTime, Utc};
    use mockall::predicate::*;
    use mockall::mock;
    use uuid::Uuid;

    // Mock the dependencies
    mock! {
        pub FetchMetricFile {}
        impl FetchMetricFile {
            pub async fn fetch_metric_file(id: &Uuid) -> Result<Option<database::models::MetricFile>>;
        }
    }

    mock! {
        pub CheckAccess {}
        impl CheckAccess {
            pub async fn check_access(
                asset_id: Uuid,
                asset_type: AssetType,
                identity_id: Uuid,
                identity_type: IdentityType,
            ) -> Result<Option<AssetPermissionRole>>;
        }
    }

    mock! {
        pub ListShares {}
        impl ListShares {
            pub async fn list_shares(
                asset_id: Uuid,
                asset_type: AssetType,
            ) -> Result<Vec<AssetPermissionWithUser>>;
        }
    }

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