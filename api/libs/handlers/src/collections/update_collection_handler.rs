use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType},
    models::CollectionToAsset,
    pool::get_pg_pool,
    schema::{collections, collections_to_assets},
};
use diesel::{dsl::not, update, AsChangeset, BoolExpressionMethods, ExpressionMethods};
use diesel_async::RunQueryDsl;
use std::sync::Arc;
use tokio;
use uuid::Uuid;

use crate::collections::types::{
    CollectionState, UpdateCollectionAssetsRequest, UpdateCollectionObject, UpdateCollectionRequest,
};

/// Handler for updating a collection
///
/// # Arguments
/// * `user_id` - The ID of the user updating the collection
/// * `req` - The request containing the collection updates
///
/// # Returns
/// * `Result<CollectionState>` - The updated collection state
pub async fn update_collection_handler(
    user_id: &Uuid,
    req: UpdateCollectionRequest,
) -> Result<CollectionState> {
    let user_id = Arc::new(*user_id);
    let collection_id = Arc::new(req.id);

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

    // Update collection assets if provided
    let update_collection_assets_handle = if let Some(assets) = req.assets {
        let user_id = Arc::clone(&user_id);
        let collection_id = Arc::clone(&collection_id);
        Some(tokio::spawn(async move {
            update_collection_assets(user_id, collection_id, assets).await
        }))
    } else {
        None
    };

    // Wait for all update operations to complete
    if let Some(update_collection_permissions_handle) = update_collection_permissions_handle {
        match update_collection_permissions_handle.await {
            Ok(Ok(_)) => (),
            Ok(Err(e)) => {
                tracing::error!("Error updating collection permissions: {}", e);
                return Err(anyhow!("Error updating collection permissions: {}", e));
            }
            Err(e) => {
                tracing::error!("Error updating collection permissions: {}", e);
                return Err(anyhow!("Error updating collection permissions: {}", e));
            }
        }
    }

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

    if let Some(update_collection_assets_handle) = update_collection_assets_handle {
        match update_collection_assets_handle.await {
            Ok(Ok(_)) => (),
            Ok(Err(e)) => {
                tracing::error!("Error updating collection assets: {}", e);
                return Err(anyhow!("Error updating collection assets: {}", e));
            }
            Err(e) => {
                tracing::error!("Error updating collection assets: {}", e);
                return Err(anyhow!("Error updating collection assets: {}", e));
            }
        }
    }

    // Get the updated collection
    let collection = database::utils::collections::get_collection_by_id(user_id.as_ref(), &req.id).await?;
    
    Ok(collection)
}

/// Update collection record in the database
///
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
                WHERE asset_id = $2 AND asset_type = 'collection'"
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

/// Update collection assets in the database
///
/// # Arguments
/// * `user_id` - The ID of the user updating the collection
/// * `collection_id` - The ID of the collection to update
/// * `assets` - The assets to add to the collection
///
/// # Returns
/// * `Result<()>` - Success or error
async fn update_collection_assets(
    user_id: Arc<Uuid>,
    collection_id: Arc<Uuid>,
    assets: Vec<UpdateCollectionAssetsRequest>,
) -> Result<()> {
    let assets = Arc::new(assets);

    let upsert_handle = {
        let assets = Arc::clone(&assets);
        let collection_id = Arc::clone(&collection_id);
        let user_id = Arc::clone(&user_id);
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting pg connection: {}", e);
                    return Err(anyhow!("Error getting pg connection: {}", e));
                }
            };

            let new_asset_records: Vec<CollectionToAsset> = assets
                .iter()
                .map(|asset| CollectionToAsset {
                    collection_id: *collection_id,
                    asset_id: asset.id,
                    asset_type: asset.type_,
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                    deleted_at: None,
                    created_by: *user_id,
                    updated_by: *user_id,
                })
                .collect();
            
            match diesel::insert_into(collections_to_assets::table)
                .values(&new_asset_records)
                .on_conflict((
                    collections_to_assets::collection_id,
                    collections_to_assets::asset_id,
                    collections_to_assets::asset_type,
                ))
                .do_update()
                .set((
                    collections_to_assets::updated_at.eq(Utc::now()),
                    collections_to_assets::deleted_at.eq(Option::<DateTime<Utc>>::None),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => Ok(()),
                Err(e) => {
                    tracing::error!("Error updating collection assets: {}", e);
                    Err(anyhow!("Unable to upsert assets to collection: {}", e))
                }
            }
        })
    };

    let remove_handle = {
        let assets = Arc::clone(&assets);
        let collection_id = Arc::clone(&collection_id);
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting pg connection: {}", e);
                    return Err(anyhow!("Error getting pg connection: {}", e));
                }
            };

            match update(collections_to_assets::table)
                .filter(collections_to_assets::collection_id.eq(*collection_id))
                .filter(not(collections_to_assets::asset_id
                    .eq_any(assets.iter().map(|a| a.id))
                    .and(
                        collections_to_assets::asset_type.eq_any(assets.iter().map(|a| a.type_)),
                    )))
                .set(collections_to_assets::deleted_at.eq(Some(Utc::now())))
                .execute(&mut conn)
                .await
            {
                Ok(_) => Ok(()),
                Err(e) => {
                    tracing::error!("Error removing assets from collection: {}", e);
                    Err(anyhow!("Error removing assets from collection: {}", e))
                }
            }
        })
    };

    match upsert_handle.await {
        Ok(Ok(_)) => (),
        Ok(Err(e)) => return Err(anyhow!("Error upserting assets to collection: {}", e)),
        Err(e) => return Err(anyhow!("Error upserting assets to collection: {}", e)),
    }

    match remove_handle.await {
        Ok(Ok(_)) => (),
        Ok(Err(e)) => return Err(anyhow!("Error removing assets from collection: {}", e)),
        Err(e) => return Err(anyhow!("Error removing assets from collection: {}", e)),
    }

    Ok(())
}
