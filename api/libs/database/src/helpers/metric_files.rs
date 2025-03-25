use anyhow::Result;
use diesel::{ExpressionMethods, QueryDsl, BoolExpressionMethods, Queryable};
use diesel_async::RunQueryDsl;
use diesel::{JoinOnDsl, NullableExpressionMethods};
use uuid::Uuid;
use tokio::try_join;
use crate::enums::{AssetPermissionRole, AssetType};

use crate::models::{AssetPermission, MetricFile};
use crate::pool::get_pg_pool;
use crate::schema::{asset_permissions, metric_files};

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

#[derive(Queryable)]
pub struct MetricFileWithPermission {
    pub metric_file: MetricFile,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_metric_file_with_permissions(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<MetricFileWithPermission>> {
    // Run both queries concurrently
    let (metric_file, permission) = try_join!(
        fetch_metric(id),
        fetch_permission(id, user_id)
    )?;

    // If the metric file doesn't exist, return None
    let metric_file = match metric_file {
        Some(file) => file,
        None => return Ok(None),
    };

    Ok(Some(MetricFileWithPermission {
        metric_file,
        permission,
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

    // Use a LEFT JOIN to fetch metric files and their permissions in a single query
    let results = metric_files::table
        .left_join(
            asset_permissions::table.on(asset_permissions::asset_id
                .eq(metric_files::id)
                .and(asset_permissions::asset_type.eq(AssetType::MetricFile))
                .and(asset_permissions::identity_id.eq(user_id))
                .and(asset_permissions::deleted_at.is_null()))
        )
        .filter(metric_files::id.eq_any(ids))
        .filter(metric_files::deleted_at.is_null())
        .select((metric_files::all_columns, asset_permissions::role.nullable()))
        .load::<(MetricFile, Option<AssetPermissionRole>)>(&mut conn)
        .await?;

    if results.is_empty() {
        return Ok(Vec::new());
    }

    // Create MetricFileWithPermission objects
    let result = results
        .into_iter()
        .map(|(metric_file, permission)| MetricFileWithPermission {
            metric_file,
            permission,
        })
        .collect();

    Ok(result)
}
