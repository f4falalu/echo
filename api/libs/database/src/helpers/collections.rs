use anyhow::Result;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::models::Collection;
use crate::pool::get_pg_pool;
use crate::schema::collections;

/// Fetches a single collection by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the collection to fetch
///
/// # Returns
/// * `Result<Option<Collection>>` - The collection if found and not deleted
pub async fn fetch_collection(id: &Uuid) -> Result<Option<Collection>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match collections::table
        .filter(collections::id.eq(id))
        .filter(collections::deleted_at.is_null())
        .first::<Collection>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}