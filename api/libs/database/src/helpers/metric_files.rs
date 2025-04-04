use anyhow::Result;
use diesel::{ExpressionMethods, QueryDsl, BoolExpressionMethods, Queryable};
use diesel_async::RunQueryDsl;
use diesel::{JoinOnDsl, NullableExpressionMethods};
use uuid::Uuid;
use tokio::try_join;
use crate::enums::{AssetPermissionRole, AssetType};

use crate::models::{AssetPermission, MetricFile};
use crate::pool::get_pg_pool;
use crate::schema::{asset_permissions, metric_files, collections_to_assets};

/// Fetches a single metric file by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the metric file to fetch
///
/// # Returns
/// * `Result<Option<MetricFile>>` - The metric file if found and not deleted
pub async fn fetch_metric_file(id: &Uuid) -> Result<Option<MetricFile>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match metric_files::table
        .filter(metric_files::id.eq(id))
        .filter(metric_files::deleted_at.is_null())
        .first::<MetricFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to fetch a metric file by ID
async fn fetch_metric(id: &Uuid) -> Result<Option<MetricFile>> {
    let mut conn = get_pg_pool().get().await?;
    
    let result = match metric_files::table
        .filter(metric_files::id.eq(id))
        .filter(metric_files::deleted_at.is_null())
        .first::<MetricFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };
    
    Ok(result)
}

/// Helper function to fetch permission for a metric file
async fn fetch_permission(id: &Uuid, user_id: &Uuid) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;
    
    let permission = match asset_permissions::table
        .filter(asset_permissions::asset_id.eq(id))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .first::<AssetPermission>(&mut conn)
        .await
    {
        Ok(result) => Some(result.role),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };
        
    Ok(permission)
}

/// Helper function to fetch collection-based permissions for a metric file
///
/// Checks if the user has access to the metric file through collections
/// by finding collections that contain this metric file and checking
/// if the user has permissions on those collections
async fn fetch_collection_permissions_for_metric(
    id: &Uuid,
    user_id: &Uuid
) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;
    
    // Find collections containing this metric file
    // then join with asset_permissions to find user's permissions on those collections
    let permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(
                asset_permissions::asset_id.eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq(id))
                .and(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                .and(collections_to_assets::deleted_at.is_null())
            )
        )
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select(asset_permissions::role)
        .load::<AssetPermissionRole>(&mut conn)
        .await?;
    
    // Return any collection-based permission (no need to determine highest)
    if permissions.is_empty() {
        Ok(None)
    } else {
        // Just take the first one since any collection permission is sufficient
        Ok(permissions.into_iter().next())
    }
}

#[derive(Queryable)]
pub struct MetricFileWithPermission {
    pub metric_file: MetricFile,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_metric_file_with_permissions(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<MetricFileWithPermission>> {
    // Run all queries concurrently
    let (metric_file, direct_permission, collection_permission) = try_join!(
        fetch_metric(id),
        fetch_permission(id, user_id),
        fetch_collection_permissions_for_metric(id, user_id)
    )?;

    // If the metric file doesn't exist, return None
    let metric_file = match metric_file {
        Some(file) => file,
        None => return Ok(None),
    };

    // If collection permission exists, use it; otherwise use direct permission
    let effective_permission = match collection_permission {
        Some(collection) => Some(collection),
        None => direct_permission
    };

    Ok(Some(MetricFileWithPermission {
        metric_file,
        permission: effective_permission,
    }))
}

/// Fetches multiple metric files with their permissions in a single operation
///
/// # Arguments
/// * `ids` - Vector of UUIDs of the metric files to fetch
/// * `user_id` - UUID of the user making the request
///
/// # Returns
/// * `Result<Vec<MetricFileWithPermission>>` - The metric files with their permissions
pub async fn fetch_metric_files_with_permissions(
    ids: &[Uuid],
    user_id: &Uuid,
) -> Result<Vec<MetricFileWithPermission>> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }

    let mut conn = get_pg_pool().get().await?;

    // 1. Fetch all metric files
    let metric_files = metric_files::table
        .filter(metric_files::id.eq_any(ids))
        .filter(metric_files::deleted_at.is_null())
        .load::<MetricFile>(&mut conn)
        .await?;

    if metric_files.is_empty() {
        return Ok(Vec::new());
    }

    // 2. Fetch direct permissions for these metric files
    let direct_permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq_any(ids))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select((asset_permissions::asset_id, asset_permissions::role))
        .load::<(Uuid, AssetPermissionRole)>(&mut conn)
        .await?;

    // 3. Fetch collection-based permissions for these metric files
    let collection_permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(
                asset_permissions::asset_id.eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq_any(ids))
                .and(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                .and(collections_to_assets::deleted_at.is_null())
            )
        )
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select((collections_to_assets::asset_id, asset_permissions::role))
        .load::<(Uuid, AssetPermissionRole)>(&mut conn)
        .await?;

    // Create maps for easier lookup
    let mut direct_permission_map = std::collections::HashMap::new();
    for (asset_id, role) in direct_permissions {
        direct_permission_map.insert(asset_id, role);
    }

    // Create map for collection permissions (just take first one for each asset)
    let mut collection_permission_map = std::collections::HashMap::new();
    for (asset_id, role) in collection_permissions {
        // Only insert if not already present (first one wins)
        collection_permission_map.entry(asset_id).or_insert(role);
    }

    // Create MetricFileWithPermission objects with effective permissions
    let result = metric_files
        .into_iter()
        .map(|metric_file| {
            let direct_permission = direct_permission_map.get(&metric_file.id).cloned();
            let collection_permission = collection_permission_map.get(&metric_file.id).cloned();
            
            // Use collection permission if it exists, otherwise use direct permission
            let effective_permission = match collection_permission {
                Some(collection) => Some(collection),
                None => direct_permission
            };

            MetricFileWithPermission {
                metric_file,
                permission: effective_permission,
            }
        })
        .collect();

    Ok(result)
}
