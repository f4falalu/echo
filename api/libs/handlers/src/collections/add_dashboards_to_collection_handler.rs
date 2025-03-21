use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::CollectionToAsset,
    pool::get_pg_pool,
    schema::{collections, collections_to_assets, dashboard_files},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::check_asset_permission::has_permission;
use tracing::{error, info};
use uuid::Uuid;

/// Adds dashboards to a collection
///
/// # Arguments
///
/// * `collection_id` - The unique identifier of the collection
/// * `dashboard_ids` - Vector of dashboard IDs to add to the collection
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// Ok(()) on success, or an error if the operation fails
pub async fn add_dashboards_to_collection_handler(
    collection_id: &Uuid,
    dashboard_ids: Vec<Uuid>,
    user_id: &Uuid,
) -> Result<()> {
    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        dashboard_count = dashboard_ids.len(),
        "Adding dashboards to collection"
    );

    if dashboard_ids.is_empty() {
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
        return Err(anyhow!(
            "User does not have permission to modify this collection"
        ));
    }

    // 3. Validate dashboards exist and user has access to them
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
            return Err(anyhow!("Dashboard not found: {}", dashboard_id));
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
            return Err(anyhow!(
                "User does not have permission to access dashboard: {}",
                dashboard_id
            ));
        }
    }

    // 4. Add dashboards to collection (upsert if previously deleted)
    for dashboard_id in &dashboard_ids {
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
                return Err(anyhow!("Database error: {}", e));
            }
        };

        if let Some(existing_record) = existing {
            if existing_record.deleted_at.is_some() {
                // If it was previously deleted, update it
                diesel::update(collections_to_assets::table)
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
                    collections_to_assets::asset_id.eq(dashboard_id),
                    collections_to_assets::asset_type.eq(AssetType::DashboardFile),
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
        collection_id = %collection_id,
        user_id = %user_id,
        dashboard_count = dashboard_ids.len(),
        "Successfully added dashboards to collection"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    
    
    

    #[tokio::test]
    async fn test_add_dashboards_to_collection_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true);
    }
}
