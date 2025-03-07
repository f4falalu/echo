use anyhow::Result;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::models::MetricFile;
use crate::pool::get_pg_pool;
use crate::schema::metric_files;

/// Fetches a single metric file by ID that hasn't been deleted
///
/// TODO: Add sharing access checks
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
