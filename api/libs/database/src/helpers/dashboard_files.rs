use anyhow::Result;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::models::DashboardFile;
use crate::pool::get_pg_pool;
use crate::schema::dashboard_files;

/// Fetches a single dashboard file by ID that hasn't been deleted
///
/// TODO: Add sharing access checks
///
/// # Arguments
/// * `id` - The UUID of the dashboard file to fetch
///
/// # Returns
/// * `Result<Option<DashboardYml>>` - The dashboard file if found and not deleted
pub async fn fetch_dashboard_file(id: &Uuid) -> Result<Option<DashboardFile>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match dashboard_files::table
        .filter(dashboard_files::id.eq(id))
        .filter(dashboard_files::deleted_at.is_null())
        .first::<DashboardFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}
