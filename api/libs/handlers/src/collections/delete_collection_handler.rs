use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    pool::get_pg_pool,
    schema::collections,
};
use diesel::{update, ExpressionMethods};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::collections::types::DeleteCollectionResponse;

/// Handler for deleting collections
///
/// # Arguments
/// * `user_id` - The ID of the user deleting the collections
/// * `ids` - The IDs of the collections to delete
///
/// # Returns
/// * `Result<DeleteCollectionResponse>` - The IDs of the collections that were successfully deleted
pub async fn delete_collection_handler(
    _user_id: &Uuid,
    _organization_id: &Uuid,
    ids: Vec<Uuid>,
) -> Result<DeleteCollectionResponse> {

    // Get database connection
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(anyhow!("Error getting database connection: {}", e));
        }
    };

    // Soft delete the collections
    match update(collections::table)
        .filter(collections::id.eq_any(&ids))
        .set(collections::deleted_at.eq(Some(Utc::now())))
        .execute(&mut conn)
        .await
    {
        Ok(_) => {}
        Err(e) => {
            return Err(anyhow!("Error deleting collections: {}", e));
        }
    };

    // Return the IDs of the deleted collections
    Ok(DeleteCollectionResponse {
        ids,
    })
}
