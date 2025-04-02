use anyhow::Result;
use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use diesel::{JoinOnDsl, NullableExpressionMethods};
use uuid::Uuid;
use tokio::try_join;
use crate::enums::{AssetPermissionRole, AssetType};

use crate::models::{AssetPermission, DashboardFile};
use crate::pool::get_pg_pool;
use crate::schema::{asset_permissions, dashboard_files};

/// Fetches a single dashboard file by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the dashboard file to fetch
///
/// # Returns
/// * `Result<Option<DashboardFile>>` - The dashboard file if found and not deleted
pub async fn fetch_dashboard_file(id: &Uuid) -> Result<Option<DashboardFile>> {
    let mut conn = get_pg_pool().get().await?;

    let mut result = match dashboard_files::table
        .filter(dashboard_files::id.eq(id))
        .filter(dashboard_files::deleted_at.is_null())
        .first::<DashboardFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    // Ensure all rows have IDs (for backwards compatibility)
    if let Some(ref mut dashboard_file) = result {
        for (index, row) in dashboard_file.content.rows.iter_mut().enumerate() {
            if row.id == 0 {
                row.id = (index as u32) + 1;
            }
        }
    }

    Ok(result)
}

/// Helper function to fetch a dashboard file by ID
async fn fetch_dashboard(id: &Uuid) -> Result<Option<DashboardFile>> {
    let mut conn = get_pg_pool().get().await?;
    
    let mut result = match dashboard_files::table
        .filter(dashboard_files::id.eq(id))
        .filter(dashboard_files::deleted_at.is_null())
        .first::<DashboardFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };
    
    // Ensure all rows have IDs (for backwards compatibility)
    if let Some(ref mut dashboard_file) = result {
        for (index, row) in dashboard_file.content.rows.iter_mut().enumerate() {
            if row.id == 0 {
                row.id = (index as u32) + 1;
            }
        }
    }
    
    Ok(result)
}

/// Helper function to fetch permission for a dashboard file
async fn fetch_dashboard_permission(id: &Uuid, user_id: &Uuid) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;
    
    let permission = match asset_permissions::table
        .filter(asset_permissions::asset_id.eq(id))
        .filter(asset_permissions::asset_type.eq(AssetType::DashboardFile))
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
pub struct DashboardFileWithPermission {
    pub dashboard_file: DashboardFile,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_dashboard_file_with_permission(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<DashboardFileWithPermission>> {
    // Run both queries concurrently
    let (dashboard_file, permission) = try_join!(
        fetch_dashboard(id),
        fetch_dashboard_permission(id, user_id)
    )?;

    // If the dashboard file doesn't exist, return None
    let dashboard_file = match dashboard_file {
        Some(file) => file,
        None => return Ok(None),
    };

    Ok(Some(DashboardFileWithPermission {
        dashboard_file,
        permission,
    }))
}

/// Fetches multiple dashboard files with their permissions in a single operation
///
/// # Arguments
/// * `ids` - Vector of UUIDs of the dashboard files to fetch
/// * `user_id` - UUID of the user making the request
///
/// # Returns
/// * `Result<Vec<DashboardFileWithPermission>>` - The dashboard files with their permissions
pub async fn fetch_dashboard_files_with_permissions(
    ids: &[Uuid],
    user_id: &Uuid,
) -> Result<Vec<DashboardFileWithPermission>> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }

    let mut conn = get_pg_pool().get().await?;

    // Use a LEFT JOIN to fetch dashboard files and their permissions in a single query
    let mut results = dashboard_files::table
        .left_join(
            asset_permissions::table.on(asset_permissions::asset_id
                .eq(dashboard_files::id)
                .and(asset_permissions::asset_type.eq(AssetType::Dashboard))
                .and(asset_permissions::identity_id.eq(user_id))
                .and(asset_permissions::deleted_at.is_null()))
        )
        .filter(dashboard_files::id.eq_any(ids))
        .filter(dashboard_files::deleted_at.is_null())
        .select((dashboard_files::all_columns, asset_permissions::role.nullable()))
        .load::<(DashboardFile, Option<AssetPermissionRole>)>(&mut conn)
        .await?;

    if results.is_empty() {
        return Ok(Vec::new());
    }

    // Ensure all rows have IDs (for backwards compatibility)
    for (dashboard_file, _) in &mut results {
        for (index, row) in dashboard_file.content.rows.iter_mut().enumerate() {
            if row.id == 0 {
                row.id = (index as u32) + 1;
            }
        }
    }

    // Create DashboardFileWithPermission objects
    let result = results
        .into_iter()
        .map(|(dashboard_file, permission)| DashboardFileWithPermission {
            dashboard_file,
            permission,
        })
        .collect();

    Ok(result)
}
