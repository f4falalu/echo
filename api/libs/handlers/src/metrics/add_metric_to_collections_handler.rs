use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::CollectionToAsset,
    pool::get_pg_pool,
    schema::{collections, collections_to_assets, metric_files},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use tracing::{error, info};
use uuid::Uuid;

/// Adds a metric to multiple collections
///
/// # Arguments
///
/// * `metric_id` - The unique identifier of the metric
/// * `collection_ids` - Vector of collection IDs to add the metric to
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// Ok(()) on success, or an error if the operation fails
pub async fn add_metric_to_collections_handler(
    metric_id: &Uuid,
    collection_ids: Vec<Uuid>,
    user_id: &Uuid,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        collection_count = collection_ids.len(),
        "Adding metric to collections"
    );

    if collection_ids.is_empty() {
        return Ok(());
    }

    // 1. Validate the metric exists
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

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
        return Err(anyhow!("Metric not found"));
    }

    // 2. Check if user has permission to modify the metric (Owner, FullAccess, or CanEdit)
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

    // 3. Validate collections exist and user has access to them
    for collection_id in &collection_ids {
        // Check if collection exists
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
            return Err(anyhow!("Collection not found: {}", collection_id));
        }

        // Check if user has access to the collection
        let has_collection_permission = has_permission(
            *collection_id,
            AssetType::Collection,
            *user_id,
            IdentityType::User,
            AssetPermissionRole::CanView, // User needs at least view access
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
                "User does not have permission to access this collection"
            );
            return Err(anyhow!(
                "User does not have permission to access collection: {}",
                collection_id
            ));
        }
    }

    // 4. Add metric to collections (upsert if previously deleted)
    for collection_id in &collection_ids {
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
                return Err(anyhow!("Database error: {}", e));
            }
        };

        if let Some(existing_record) = existing {
            if existing_record.deleted_at.is_some() {
                // If it was previously deleted, update it
                diesel::update(collections_to_assets::table)
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
                    .map_err(|e| {
                        error!("Error updating collection to asset record: {}", e);
                        anyhow!("Database error: {}", e)
                    })?;
            }
            // If it's already active, do nothing
        } else {
            // If it doesn't exist, create a new record
            diesel::insert_into(collections_to_assets::table)
                .values((
                    collections_to_assets::collection_id.eq(collection_id),
                    collections_to_assets::asset_id.eq(metric_id),
                    collections_to_assets::asset_type.eq(AssetType::MetricFile),
                    collections_to_assets::created_at.eq(chrono::Utc::now()),
                    collections_to_assets::updated_at.eq(chrono::Utc::now()),
                    collections_to_assets::created_by.eq(user_id),
                    collections_to_assets::updated_by.eq(user_id),
                ))
                .execute(&mut conn)
                .await
                .map_err(|e| {
                    error!("Error creating collection to asset record: {}", e);
                    anyhow!("Database error: {}", e)
                })?;
        }
    }

    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        collection_count = collection_ids.len(),
        "Successfully added metric to collections"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    
    
    

    #[tokio::test]
    async fn test_add_metric_to_collections_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true); 
    }
}