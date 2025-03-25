use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::collections::fetch_collection_with_permission,
    helpers::dashboard_files::fetch_dashboard_file_with_permission,
    pool::get_pg_pool,
    schema::collections_to_assets,
};
use diesel::{ExpressionMethods};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use sharing::check_permission_access;
use tracing::{error, info};
use uuid::Uuid;

/// Response for removing a dashboard from collections
#[derive(Debug)]
pub struct RemoveDashboardFromCollectionsResponse {
    pub removed_count: usize,
    pub failed_count: usize,
    pub failed_ids: Vec<Uuid>,
}

/// Removes a dashboard from multiple collections
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `collection_ids` - Vector of collection IDs to remove the dashboard from
/// * `user` - The authenticated user performing the action
///
/// # Returns
///
/// RemoveDashboardFromCollectionsResponse on success, or an error if the operation fails
pub async fn remove_dashboard_from_collections_handler(
    dashboard_id: &Uuid,
    collection_ids: Vec<Uuid>,
    user: &AuthenticatedUser,
) -> Result<RemoveDashboardFromCollectionsResponse> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        collection_count = collection_ids.len(),
        "Removing dashboard from collections"
    );

    if collection_ids.is_empty() {
        return Ok(RemoveDashboardFromCollectionsResponse {
            removed_count: 0,
            failed_count: 0,
            failed_ids: vec![],
        });
    }

    // First check if the user has permission to modify this dashboard
    let dashboard_with_permission =
        fetch_dashboard_file_with_permission(dashboard_id, &user.id).await?;

    // If dashboard not found, return error
    let dashboard_with_permission = match dashboard_with_permission {
        Some(dwp) => dwp,
        None => return Err(anyhow!("Dashboard not found")),
    };

    // Check if user has permission to modify the dashboard
    // Users need CanEdit, FullAccess, or Owner permission
    let has_permission = check_permission_access(
        dashboard_with_permission.permission,
        &[
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        dashboard_with_permission.dashboard_file.organization_id,
        &user.organizations,
    );

    if !has_permission {
        return Err(anyhow!(
            "You don't have permission to modify this dashboard"
        ));
    }

    // Get database connection
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

    // Process each collection
    let mut failed_ids = Vec::new();
    let mut removed_count = 0;
    let now = chrono::Utc::now();

    for collection_id in &collection_ids {
        // Fetch collection with permission to check if user has access
        let collection_with_permission =
            match fetch_collection_with_permission(collection_id, &user.id).await {
                Ok(Some(cwp)) => cwp,
                Ok(None) => {
                    error!(
                        collection_id = %collection_id,
                        "Collection not found"
                    );
                    failed_ids.push(*collection_id);
                    continue;
                }
                Err(e) => {
                    error!(
                        collection_id = %collection_id,
                        "Error fetching collection: {}", e
                    );
                    failed_ids.push(*collection_id);
                    continue;
                }
            };

        // Check if user has permission to modify the collection
        // Users need CanEdit, FullAccess, or Owner permission
        let has_collection_permission = check_permission_access(
            collection_with_permission.permission,
            &[
                AssetPermissionRole::CanEdit,
                AssetPermissionRole::FullAccess,
                AssetPermissionRole::Owner,
            ],
            collection_with_permission.collection.organization_id,
            &user.organizations,
        );

        if !has_collection_permission {
            error!(
                collection_id = %collection_id,
                user_id = %user.id,
                "User does not have permission to modify this collection"
            );
            failed_ids.push(*collection_id);
            continue;
        }

        // Mark dashboard as deleted from this collection
        match diesel::update(collections_to_assets::table)
            .filter(collections_to_assets::collection_id.eq(collection_id))
            .filter(collections_to_assets::asset_id.eq(dashboard_id))
            .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
            .filter(collections_to_assets::deleted_at.is_null())
            .set((
                collections_to_assets::deleted_at.eq(now),
                collections_to_assets::updated_at.eq(now),
                collections_to_assets::updated_by.eq(user.id),
            ))
            .execute(&mut conn)
            .await
        {
            Ok(updated) => {
                if updated > 0 {
                    removed_count += 1;
                    info!(
                        dashboard_id = %dashboard_id,
                        collection_id = %collection_id,
                        "Successfully removed dashboard from collection"
                    );
                } else {
                    error!(
                        dashboard_id = %dashboard_id,
                        collection_id = %collection_id,
                        "Dashboard not found in collection"
                    );
                    failed_ids.push(*collection_id);
                }
            }
            Err(e) => {
                error!(
                    dashboard_id = %dashboard_id,
                    collection_id = %collection_id,
                    "Error removing dashboard from collection: {}", e
                );
                failed_ids.push(*collection_id);
            }
        }
    }

    let failed_count = failed_ids.len();

    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        collection_count = collection_ids.len(),
        removed_count = removed_count,
        failed_count = failed_count,
        "Finished removing dashboard from collections"
    );

    Ok(RemoveDashboardFromCollectionsResponse {
        removed_count,
        failed_count,
        failed_ids,
    })
}

#[cfg(test)]
mod tests {
    use uuid::Uuid;

    #[tokio::test]
    async fn test_remove_dashboard_from_collections_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database

        // Mock test would check:
        // 1. The dashboard_files database lookup
        // 2. The permission checks
        // 3. The collections database lookups
        // 4. The update operations
        assert!(true);
    }
}
