use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::{collections, collections_to_assets},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::check_asset_permission::has_permission;
use tracing::{error, info};
use uuid::Uuid;

/// Removes metrics from a collection
///
/// # Arguments
///
/// * `collection_id` - The unique identifier of the collection
/// * `metric_ids` - Vector of metric IDs to remove from the collection
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// Ok(()) on success, or an error if the operation fails
pub async fn remove_metrics_from_collection_handler(
    collection_id: &Uuid,
    metric_ids: Vec<Uuid>,
    user_id: &Uuid,
) -> Result<()> {
    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        metric_count = metric_ids.len(),
        "Removing metrics from collection"
    );

    if metric_ids.is_empty() {
        return Ok(());
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
        return Err(anyhow!("User does not have permission to modify this collection"));
    }

    // 3. Mark metrics as deleted in the collection
    let now = chrono::Utc::now();
    let updated = diesel::update(collections_to_assets::table)
        .filter(collections_to_assets::collection_id.eq(collection_id))
        .filter(collections_to_assets::asset_id.eq_any(&metric_ids))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections_to_assets::deleted_at.is_null())
        .set((
            collections_to_assets::deleted_at.eq(now),
            collections_to_assets::updated_at.eq(now),
            collections_to_assets::updated_by.eq(user_id),
        ))
        .execute(&mut conn)
        .await
        .map_err(|e| {
            error!("Error removing metrics from collection: {}", e);
            anyhow!("Database error: {}", e)
        })?;

    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        metric_count = metric_ids.len(),
        updated_count = updated,
        "Successfully removed metrics from collection"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::{AssetPermissionRole, AssetType, IdentityType};
    use uuid::Uuid;

    #[tokio::test]
    async fn test_remove_metrics_from_collection_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true);
    }
}