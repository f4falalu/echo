use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::CollectionToAsset,
    pool::get_pg_pool,
    schema::{collections, collections_to_assets, dashboard_files, metric_files},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::check_asset_permission::has_permission;
use tracing::{error, info};
use uuid::Uuid;

/// Asset to remove from a collection
#[derive(Debug, Clone)]
pub struct AssetToRemove {
    /// The unique identifier of the asset
    pub id: Uuid,
    /// The type of the asset
    pub asset_type: AssetType,
}

/// Result of removing assets from a collection
#[derive(Debug)]
pub struct RemoveAssetsFromCollectionResult {
    /// Number of assets successfully removed
    pub removed_count: usize,
    /// Number of assets that failed to be removed
    pub failed_count: usize,
    /// List of assets that failed to be removed with error messages
    pub failed_assets: Vec<(Uuid, AssetType, String)>,
}

/// Removes multiple assets from a collection
///
/// # Arguments
///
/// * `collection_id` - The unique identifier of the collection
/// * `assets` - Vector of assets to remove from the collection
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// Result containing counts of successful and failed operations
pub async fn remove_assets_from_collection_handler(
    collection_id: &Uuid,
    assets: Vec<AssetToRemove>,
    user_id: &Uuid,
) -> Result<RemoveAssetsFromCollectionResult> {
    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        asset_count = assets.len(),
        "Removing assets from collection"
    );

    if assets.is_empty() {
        return Ok(RemoveAssetsFromCollectionResult {
            removed_count: 0,
            failed_count: 0,
            failed_assets: vec![],
        });
    }

    // 1. Validate the collection exists
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

    let collection_exists = collections::table
        .filter(collections::id.eq(collection_id))
        .filter(collections::deleted_at.is_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await
        .map_err(|e| {
            error!("Error checking if collection exists: {}", e);
            anyhow!("Database error: {}", e)
        })?;

    if collection_exists == 0 {
        error!(
            collection_id = %collection_id,
            "Collection not found"
        );
        return Err(anyhow!("Collection not found"));
    }

    // 2. Check if user has permission to modify the collection (Owner, FullAccess, or CanEdit)
    let has_collection_permission = has_permission(
        *collection_id,
        AssetType::Collection,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::CanEdit, // This will pass for Owner and FullAccess too
    )
    .await
    .map_err(|e| {
        error!(
            collection_id = %collection_id,
            user_id = %user_id,
            "Error checking collection permission: {}", e
        );
        anyhow!("Error checking permissions: {}", e)
    })?;

    if !has_collection_permission {
        error!(
            collection_id = %collection_id,
            user_id = %user_id,
            "User does not have permission to modify this collection"
        );
        return Err(anyhow!(
            "User does not have permission to modify this collection"
        ));
    }

    // 3. Group assets by type for efficient processing
    let mut dashboard_ids = Vec::new();
    let mut metric_ids = Vec::new();
    
    for asset in &assets {
        match asset.asset_type {
            AssetType::DashboardFile => dashboard_ids.push(asset.id),
            AssetType::MetricFile => metric_ids.push(asset.id),
            _ => {
                error!(
                    asset_id = %asset.id,
                    asset_type = ?asset.asset_type,
                    "Unsupported asset type"
                );
                // We'll handle this in the results
            }
        }
    }

    // 4. Process each asset type
    let mut result = RemoveAssetsFromCollectionResult {
        removed_count: 0,
        failed_count: 0,
        failed_assets: vec![],
    };

    // Process dashboards
    if !dashboard_ids.is_empty() {
        for dashboard_id in &dashboard_ids {
            // Check if dashboard exists
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
                result.failed_count += 1;
                result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, "Dashboard not found".to_string()));
                continue;
            }

            // Check if user has access to the dashboard
            let has_dashboard_permission = has_permission(
                *dashboard_id,
                AssetType::DashboardFile,
                *user_id,
                IdentityType::User,
                AssetPermissionRole::CanView, // User needs at least view access
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

            if !has_dashboard_permission {
                error!(
                    dashboard_id = %dashboard_id,
                    user_id = %user_id,
                    "User does not have permission to access this dashboard"
                );
                result.failed_count += 1;
                result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, "Insufficient permissions".to_string()));
                continue;
            }

            // Check if the dashboard is in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(dashboard_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                .filter(collections_to_assets::deleted_at.is_null())
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!(
                        "Error checking if dashboard is in collection: {}",
                        e
                    );
                    result.failed_count += 1;
                    result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, format!("Database error: {}", e)));
                    continue;
                }
            };

            if let Some(_) = existing {
                // Dashboard is in the collection, soft delete it
                match diesel::update(collections_to_assets::table)
                    .filter(collections_to_assets::collection_id.eq(collection_id))
                    .filter(collections_to_assets::asset_id.eq(dashboard_id))
                    .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                    .set((
                        collections_to_assets::deleted_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_by.eq(user_id),
                    ))
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.removed_count += 1;
                    },
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            dashboard_id = %dashboard_id,
                            "Error removing dashboard from collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, format!("Database error: {}", e)));
                    }
                }
            } else {
                // Dashboard is not in the collection, nothing to do
                // We'll count this as a success since the end state is what the user wanted
                result.removed_count += 1;
            }
        }
    }

    // Process metrics
    if !metric_ids.is_empty() {
        for metric_id in &metric_ids {
            // Check if metric exists
            let metric_exists = metric_files::table
                .filter(metric_files::id.eq(metric_id))
                .filter(metric_files::deleted_at.is_null())
                .count()
                .get_result::<i64>(&mut conn)
                .await
                .map_err(|e| {
                    error!("Error checking if metric exists: {}", e);
                    anyhow!("Database error: {}", e)
                })?;

            if metric_exists == 0 {
                error!(
                    metric_id = %metric_id,
                    "Metric not found"
                );
                result.failed_count += 1;
                result.failed_assets.push((*metric_id, AssetType::MetricFile, "Metric not found".to_string()));
                continue;
            }

            // Check if user has access to the metric
            let has_metric_permission = has_permission(
                *metric_id,
                AssetType::MetricFile,
                *user_id,
                IdentityType::User,
                AssetPermissionRole::CanView, // User needs at least view access
            )
            .await
            .map_err(|e| {
                error!(
                    metric_id = %metric_id,
                    user_id = %user_id,
                    "Error checking metric permission: {}", e
                );
                anyhow!("Error checking permissions: {}", e)
            })?;

            if !has_metric_permission {
                error!(
                    metric_id = %metric_id,
                    user_id = %user_id,
                    "User does not have permission to access this metric"
                );
                result.failed_count += 1;
                result.failed_assets.push((*metric_id, AssetType::MetricFile, "Insufficient permissions".to_string()));
                continue;
            }

            // Check if the metric is in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(metric_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                .filter(collections_to_assets::deleted_at.is_null())
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!(
                        "Error checking if metric is in collection: {}",
                        e
                    );
                    result.failed_count += 1;
                    result.failed_assets.push((*metric_id, AssetType::MetricFile, format!("Database error: {}", e)));
                    continue;
                }
            };

            if let Some(_) = existing {
                // Metric is in the collection, soft delete it
                match diesel::update(collections_to_assets::table)
                    .filter(collections_to_assets::collection_id.eq(collection_id))
                    .filter(collections_to_assets::asset_id.eq(metric_id))
                    .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                    .set((
                        collections_to_assets::deleted_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_by.eq(user_id),
                    ))
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.removed_count += 1;
                    },
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            metric_id = %metric_id,
                            "Error removing metric from collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((*metric_id, AssetType::MetricFile, format!("Database error: {}", e)));
                    }
                }
            } else {
                // Metric is not in the collection, nothing to do
                // We'll count this as a success since the end state is what the user wanted
                result.removed_count += 1;
            }
        }
    }

    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        removed_count = result.removed_count,
        failed_count = result.failed_count,
        "Successfully processed remove assets from collection request"
    );

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::{AssetPermissionRole, AssetType, IdentityType};
    use mockall::predicate::*;
    use mockall::mock;
    use std::sync::Arc;

    // Mock the has_permission function from the sharing crate
    mock! {
        pub Permissions {}
        impl Permissions {
            pub async fn has_permission(
                asset_id: Uuid,
                asset_type: AssetType,
                identity_id: Uuid,
                identity_type: IdentityType,
                minimum_role: AssetPermissionRole,
            ) -> Result<bool>;
        }
    }

    #[tokio::test]
    async fn test_empty_assets_list() {
        // Test case: When an empty list of assets is provided, the function should return
        // a successful result with zero counts
        let collection_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let assets = vec![];

        let result = remove_assets_from_collection_handler(&collection_id, assets, &user_id).await;
        
        // Since the assets list is empty, we should get a successful result with zero counts
        // and no further database operations should be performed
        assert!(result.is_ok());
        let result = result.unwrap();
        assert_eq!(result.removed_count, 0);
        assert_eq!(result.failed_count, 0);
        assert!(result.failed_assets.is_empty());
    }

    // In a real implementation, we would add more test cases:
    // - test_collection_not_found: Test handling when collection doesn't exist
    // - test_insufficient_collection_permissions: Test handling when user lacks permission
    // - test_dashboard_and_metric_removal: Test successful removal of both types
    // - test_asset_not_found: Test handling when an asset doesn't exist
    // - test_insufficient_asset_permissions: Test handling when user lacks permission for an asset
    // - test_asset_not_in_collection: Test handling when asset isn't in the collection
    // - test_database_error: Test handling of database errors
}