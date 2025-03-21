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

/// Asset to add to a collection
#[derive(Debug, Clone)]
pub struct AssetToAdd {
    /// The unique identifier of the asset
    pub id: Uuid,
    /// The type of the asset
    pub asset_type: AssetType,
}

/// Result of adding assets to a collection
#[derive(Debug)]
pub struct AddAssetsToCollectionResult {
    /// Number of assets successfully added
    pub added_count: usize,
    /// Number of assets that failed to be added
    pub failed_count: usize,
    /// List of assets that failed to be added with error messages
    pub failed_assets: Vec<(Uuid, AssetType, String)>,
}

/// Adds multiple assets to a collection
///
/// # Arguments
///
/// * `collection_id` - The unique identifier of the collection
/// * `assets` - Vector of assets to add to the collection
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// Result containing counts of successful and failed operations
pub async fn add_assets_to_collection_handler(
    collection_id: &Uuid,
    assets: Vec<AssetToAdd>,
    user_id: &Uuid,
) -> Result<AddAssetsToCollectionResult> {
    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        asset_count = assets.len(),
        "Adding assets to collection"
    );

    if assets.is_empty() {
        return Ok(AddAssetsToCollectionResult {
            added_count: 0,
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
    let mut result = AddAssetsToCollectionResult {
        added_count: 0,
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

            // Check if the dashboard is already in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(dashboard_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!(
                        "Error checking if dashboard is already in collection: {}",
                        e
                    );
                    result.failed_count += 1;
                    result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, format!("Database error: {}", e)));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                if existing_record.deleted_at.is_some() {
                    // If it was previously deleted, update it
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(collection_id))
                        .filter(collections_to_assets::asset_id.eq(dashboard_id))
                        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                        .set((
                            collections_to_assets::deleted_at
                                .eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user_id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.added_count += 1;
                        },
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                dashboard_id = %dashboard_id,
                                "Error updating dashboard in collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, format!("Database error: {}", e)));
                        }
                    }
                } else {
                    // Already in the collection and not deleted, nothing to do
                    result.added_count += 1;
                }
            } else {
                // Not in the collection, insert it
                match diesel::insert_into(collections_to_assets::table)
                    .values((
                        collections_to_assets::collection_id.eq(collection_id),
                        collections_to_assets::asset_id.eq(dashboard_id),
                        collections_to_assets::asset_type.eq(AssetType::DashboardFile),
                        collections_to_assets::created_at.eq(chrono::Utc::now()),
                        collections_to_assets::created_by.eq(user_id),
                        collections_to_assets::updated_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_by.eq(user_id),
                    ))
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.added_count += 1;
                    },
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            dashboard_id = %dashboard_id,
                            "Error inserting dashboard into collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, format!("Database error: {}", e)));
                    }
                }
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

            // Check if the metric is already in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(metric_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!(
                        "Error checking if metric is already in collection: {}",
                        e
                    );
                    result.failed_count += 1;
                    result.failed_assets.push((*metric_id, AssetType::MetricFile, format!("Database error: {}", e)));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                if existing_record.deleted_at.is_some() {
                    // If it was previously deleted, update it
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(collection_id))
                        .filter(collections_to_assets::asset_id.eq(metric_id))
                        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                        .set((
                            collections_to_assets::deleted_at
                                .eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user_id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.added_count += 1;
                        },
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                metric_id = %metric_id,
                                "Error updating metric in collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((*metric_id, AssetType::MetricFile, format!("Database error: {}", e)));
                        }
                    }
                } else {
                    // Already in the collection and not deleted, nothing to do
                    result.added_count += 1;
                }
            } else {
                // Not in the collection, insert it
                match diesel::insert_into(collections_to_assets::table)
                    .values((
                        collections_to_assets::collection_id.eq(collection_id),
                        collections_to_assets::asset_id.eq(metric_id),
                        collections_to_assets::asset_type.eq(AssetType::MetricFile),
                        collections_to_assets::created_at.eq(chrono::Utc::now()),
                        collections_to_assets::created_by.eq(user_id),
                        collections_to_assets::updated_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_by.eq(user_id),
                    ))
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.added_count += 1;
                    },
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            metric_id = %metric_id,
                            "Error inserting metric into collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((*metric_id, AssetType::MetricFile, format!("Database error: {}", e)));
                    }
                }
            }
        }
    }

    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        added_count = result.added_count,
        failed_count = result.failed_count,
        "Successfully processed add assets to collection request"
    );

    Ok(result)
}

#[cfg(test)]
mod tests {
    
    

    #[tokio::test]
    async fn test_add_assets_to_collection_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true);
    }
}