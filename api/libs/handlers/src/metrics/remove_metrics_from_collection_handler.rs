use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::metric_files::fetch_metric_file,
    pool::get_pg_pool,
    schema::{collections, collections_to_assets},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::check_asset_permission::has_permission;
use tracing::{error, info};
use uuid::Uuid;

/// Response for removing a metric from collections
#[derive(Debug)]
pub struct RemoveMetricsFromCollectionResponse {
    pub removed_count: usize,
    pub failed_count: usize,
    pub failed_ids: Vec<Uuid>,
}

/// Removes a metric from multiple collections
///
/// # Arguments
///
/// * `metric_id` - The unique identifier of the metric
/// * `collection_ids` - Vector of collection IDs to remove the metric from
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// RemoveMetricsFromCollectionResponse on success, or an error if the operation fails
pub async fn remove_metrics_from_collection_handler(
    metric_id: &Uuid,
    collection_ids: Vec<Uuid>,
    user_id: &Uuid,
) -> Result<RemoveMetricsFromCollectionResponse> {
    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        collection_count = collection_ids.len(),
        "Removing metric from collections"
    );

    if collection_ids.is_empty() {
        return Ok(RemoveMetricsFromCollectionResponse {
            removed_count: 0,
            failed_count: 0,
            failed_ids: vec![],
        });
    }

    // 1. Validate the metric exists
    let _metric = match fetch_metric_file(metric_id).await {
        Ok(Some(metric)) => metric,
        Ok(None) => {
            error!(
                metric_id = %metric_id,
                "Metric not found"
            );
            return Err(anyhow!("Metric not found"));
        }
        Err(e) => {
            error!("Error checking if metric exists: {}", e);
            return Err(anyhow!("Database error: {}", e));
        }
    };

    // 2. Check if user has permission to modify the metric
    let has_metric_permission = has_permission(
        *metric_id,
        AssetType::MetricFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::CanEdit, // This will pass for Owner and FullAccess too
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
            "User does not have permission to modify this metric"
        );
        return Err(anyhow!(
            "User does not have permission to modify this metric"
        ));
    }

    // 3. Get database connection
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

    // 4. Process each collection
    let mut failed_ids = Vec::new();
    let mut removed_count = 0;
    let now = chrono::Utc::now();

    for collection_id in &collection_ids {
        // Check if collection exists
        let collection_exists = collections::table
            .filter(collections::id.eq(collection_id))
            .filter(collections::deleted_at.is_null())
            .count()
            .get_result::<i64>(&mut conn)
            .await;

        if let Err(e) = collection_exists {
            error!(
                collection_id = %collection_id,
                "Error checking if collection exists: {}", e
            );
            failed_ids.push(*collection_id);
            continue;
        }

        if collection_exists.unwrap() == 0 {
            error!(
                collection_id = %collection_id,
                "Collection not found"
            );
            failed_ids.push(*collection_id);
            continue;
        }

        // Check if user has permission to modify the collection
        let has_collection_permission = has_permission(
            *collection_id,
            AssetType::Collection,
            *user_id,
            IdentityType::User,
            AssetPermissionRole::CanEdit,
        )
        .await;

        if let Err(e) = has_collection_permission {
            error!(
                collection_id = %collection_id,
                user_id = %user_id,
                "Error checking collection permission: {}", e
            );
            failed_ids.push(*collection_id);
            continue;
        }

        if !has_collection_permission.unwrap() {
            error!(
                collection_id = %collection_id,
                user_id = %user_id,
                "User does not have permission to modify this collection"
            );
            failed_ids.push(*collection_id);
            continue;
        }

        // Mark metric as deleted from this collection
        match diesel::update(collections_to_assets::table)
            .filter(collections_to_assets::collection_id.eq(collection_id))
            .filter(collections_to_assets::asset_id.eq(metric_id))
            .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
            .filter(collections_to_assets::deleted_at.is_null())
            .set((
                collections_to_assets::deleted_at.eq(now),
                collections_to_assets::updated_at.eq(now),
                collections_to_assets::updated_by.eq(user_id),
            ))
            .execute(&mut conn)
            .await
        {
            Ok(updated) => {
                if updated > 0 {
                    removed_count += 1;
                    info!(
                        metric_id = %metric_id,
                        collection_id = %collection_id,
                        "Successfully removed metric from collection"
                    );
                } else {
                    error!(
                        metric_id = %metric_id,
                        collection_id = %collection_id,
                        "Metric not found in collection"
                    );
                    failed_ids.push(*collection_id);
                }
            }
            Err(e) => {
                error!(
                    metric_id = %metric_id,
                    collection_id = %collection_id,
                    "Error removing metric from collection: {}", e
                );
                failed_ids.push(*collection_id);
            }
        }
    }

    let failed_count = failed_ids.len();

    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        collection_count = collection_ids.len(),
        removed_count = removed_count,
        failed_count = failed_count,
        "Finished removing metric from collections"
    );

    Ok(RemoveMetricsFromCollectionResponse {
        removed_count,
        failed_count,
        failed_ids,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_remove_metrics_from_collection_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database

        // For now, let's just check that the basic input validation works
        let metric_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let empty_collections: Vec<Uuid> = vec![];

        // Test with empty collections - should return success with 0 removed
        let result =
            remove_metrics_from_collection_handler(&metric_id, empty_collections, &user_id).await;

        assert!(result.is_ok());
        if let Ok(response) = result {
            assert_eq!(response.removed_count, 0);
            assert_eq!(response.failed_count, 0);
            assert!(response.failed_ids.is_empty());
        }

        // In a real test, we would mock:
        // 1. The metric_files database lookup
        // 2. The permission checks
        // 3. The collections database lookups
        // 4. The update operations
        // And then verify the behavior with various inputs
    }
}
