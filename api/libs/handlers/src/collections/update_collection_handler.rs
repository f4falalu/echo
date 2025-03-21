use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    collections::fetch_collection, enums::AssetPermissionRole, pool::get_pg_pool,
    schema::collections,
};
use diesel::{update, ExpressionMethods};
use diesel_async::RunQueryDsl;
use std::sync::Arc;
use tokio;
use uuid::Uuid;

use crate::collections::types::{CollectionState, UpdateCollectionObject, UpdateCollectionRequest};

/// Handler for updating a collection
///
/// # Arguments
/// * `user_id` - The ID of the user updating the collection
/// * `collection_id` - The ID of the collection to update
/// * `req` - The request containing the collection updates (only name and description)
///
/// # Returns
/// * `Result<CollectionState>` - The updated collection state
pub async fn update_collection_handler(
    user_id: &Uuid,
    collection_id: Uuid,
    req: UpdateCollectionRequest,
) -> Result<CollectionState> {
    let user_id = Arc::new(*user_id);
    let collection_id = Arc::new(collection_id);

    // Update collection record if provided
    let update_collection_record_handle = if let Some(collection) = req.collection {
        if collection.name.is_some() || collection.description.is_some() {
            let user_id = Arc::clone(&user_id);
            let collection_id = Arc::clone(&collection_id);
            Some(tokio::spawn(async move {
                update_collection_record(user_id, collection_id, collection).await
            }))
        } else {
            None
        }
    } else {
        None
    };

    // Wait for update operation to complete
    if let Some(update_collection_record_handle) = update_collection_record_handle {
        match update_collection_record_handle.await {
            Ok(Ok(_)) => (),
            Ok(Err(e)) => {
                tracing::error!("Error updating collection record: {}", e);
                return Err(anyhow!("Error updating collection record: {}", e));
            }
            Err(e) => {
                tracing::error!("Error updating collection record: {}", e);
                return Err(anyhow!("Error updating collection record: {}", e));
            }
        }
    }

    // Get the updated collection
    let collection = match fetch_collection(&collection_id).await? {
        Some(collection) => collection,
        None => return Err(anyhow!("Collection not found")),
    };

    Ok(CollectionState {
        collection,
        assets: None,
        permission: AssetPermissionRole::Owner,
        organization_permissions: false,
        individual_permissions: None,
        publicly_accessible: false,
        public_expiry_date: None,
        public_enabled_by: None,
        public_password: None,
    })
}

/// Update collection record in the database
///
/// # Arguments
/// # Arguments
/// * `user_id` - The ID of the user updating the collection
/// * `collection_id` - The ID of the collection to update
/// * `collection` - The collection update object
///
/// # Returns
/// * `Result<()>` - Success or error
async fn update_collection_record(
    user_id: Arc<Uuid>,
    collection_id: Arc<Uuid>,
    collection: UpdateCollectionObject,
) -> Result<()> {
    let collection_update = {
        let collection_id = collection_id.clone();
        let user_id = user_id.clone();
        let collection = collection.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting pg connection: {}", e);
                    return Err(anyhow!("Error getting pg connection: {}", e));
                }
            };

            match update(collections::table)
                .filter(collections::id.eq(collection_id.as_ref()))
                .set((
                    collection,
                    collections::updated_at.eq(Utc::now()),
                    collections::updated_by.eq(*user_id),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(updated_rows) => {
                    if updated_rows == 0 {
                        let err = anyhow!(
                            "User does not have write access to this collection or collection not found"
                        );
                        tracing::error!("{}", err);
                        return Err(err);
                    }
                    Ok(())
                }
                Err(e) => {
                    tracing::error!("Error updating collection: {}", e);
                    Err(anyhow!("Error updating collection: {}", e))
                }
            }
        })
    };

    let collection_search_handle = {
        let collection_id = collection_id.clone();
        let collection_name = collection.name.unwrap_or_default();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Unable to get connection from pool: {:?}", e);
                    return Err(anyhow!("Unable to get connection from pool: {:?}", e));
                }
            };

            let query = diesel::sql_query(
                "UPDATE asset_search 
                SET content = $1, updated_at = NOW()
                WHERE asset_id = $2 AND asset_type = 'collection'",
            )
            .bind::<diesel::sql_types::Text, _>(collection_name)
            .bind::<diesel::sql_types::Uuid, _>(*collection_id);

            match query.execute(&mut conn).await {
                Ok(_) => Ok(()),
                Err(e) => {
                    tracing::error!("Failed to update asset search: {:?}", e);
                    Err(anyhow!("Failed to update asset search: {:?}", e))
                }
            }
        })
    };

    match collection_update.await {
        Ok(Ok(_)) => (),
        Ok(Err(e)) => return Err(anyhow!("Error in collection update: {:?}", e)),
        Err(e) => return Err(anyhow!("Error in collection update: {:?}", e)),
    }

    match collection_search_handle.await {
        Ok(Ok(_)) => (),
        Ok(Err(e)) => return Err(anyhow!("Error in collection search update: {:?}", e)),
        Err(e) => return Err(anyhow!("Error in collection search update: {:?}", e)),
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // Notice: This is a basic smoke test to check that our changes compile and work
    // It doesn't actually hit the database, but verifies that the handler's structure is correct
    #[tokio::test]
    async fn test_update_collection_handler_smoke_test() {
        // Create a mock request with only name and description
        let req = UpdateCollectionRequest {
            collection: Some(UpdateCollectionObject {
                name: Some("New Name".to_string()),
                description: Some("New Description".to_string()),
            }),
        };

        // Create a mock user ID
        let user_id = Uuid::new_v4();
        let collection_id = Uuid::new_v4();

        // Check that our handler function accepts the request with the correct types
        // This is mostly a compilation test to verify our refactoring didn't break the interface
        let result = update_collection_handler(&user_id, collection_id, req).await;

        // We expect an error since we're not actually hitting the database
        assert!(result.is_err());

        // Check that the error contains the expected message
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Collection not found"));
    }
}
