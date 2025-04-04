use anyhow::{anyhow, Result};
use diesel::{update, AsChangeset, ExpressionMethods};
use diesel_async::RunQueryDsl;
use std::sync::Arc;
use middleware::AuthenticatedUser;

use serde::Deserialize;

use uuid::Uuid;

use database::{enums::{AssetPermissionRole, AssetType},
        pool::get_pg_pool,
        schema::collections};
use crate::{
    routes::ws::{
        ws::{SubscriptionRwLock, WsErrorCode, WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::{send_error_message, send_ws_message, subscribe_to_stream},
    },
    utils::{
        clients::sentry_utils::send_sentry_error,
        sharing::asset_sharing::{
            update_asset_permissions, ShareWithTeamsReqObject, ShareWithUsersReqObject,
        },
    },
};

use super::{
    collection_utils::{get_collection_by_id, get_user_collection_permission},
    collections_router::{CollectionEvent, CollectionRoute},
};

// UpdateCollectionAssetsRequest removed as per refactoring requirement

#[derive(Debug, Clone, Deserialize, AsChangeset)]
#[diesel(table_name = collections)]
pub struct UpdateCollectionObject {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateCollectionRequest {
    pub id: Uuid,
    #[serde(flatten)]
    pub collection: Option<UpdateCollectionObject>,
    pub team_permissions: Option<Vec<ShareWithTeamsReqObject>>,
    pub user_permissions: Option<Vec<ShareWithUsersReqObject>>,
    pub remove_teams: Option<Vec<Uuid>>,
    pub remove_users: Option<Vec<Uuid>>,
}

pub async fn update_collection(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &AuthenticatedUser,
    req: UpdateCollectionRequest,
) -> Result<()> {
    let collection_id = req.id;

    let user_permission = match get_user_collection_permission(&user.id, &collection_id).await {
        Ok(permission) => permission,
        Err(e) => {
            tracing::error!("Error getting user collection permission: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(e);
        }
    };

    if user_permission == AssetPermissionRole::CanView{
        send_error_message(
            &user.id.to_string(),
            WsRoutes::Collections(CollectionRoute::Update),
            WsEvent::Collections(CollectionEvent::CollectionState),
            WsErrorCode::InternalServerError,
            "User does not have permission to update collection".to_string(),
            user,
        )
        .await?;
        return Err(anyhow!(
            "User does not have permission to update collection"
        ));
    }

    let collection_subscription = format!("collection:{}", collection_id);

    // Subscribe the user to the stream.
    match subscribe_to_stream(
        subscriptions,
        &collection_subscription,
        user_group,
        &user.id,
    )
    .await
    {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error subscribing to stream: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(e);
        }
    };

    let user_id = Arc::new(user.id.clone());
    let collection_id = Arc::new(collection_id);

    let update_collection_record_handle = if let Some(collection) = req.collection {
        if collection.name.is_some() || collection.description.is_some() {
            let user_id = Arc::clone(&user_id);
            let collection_id = Arc::clone(&collection_id);
            Some(tokio::spawn(async move {
                match update_collection_record(user_id, collection_id, collection).await {
                    Ok(_) => Ok(()),
                    Err(e) => {
                        return Err(e);
                    }
                }
            }))
        } else {
            None
        }
    } else {
        None
    };

    // Assets handling has been removed as per refactoring requirement

    let update_collection_permissions_handle = if req.team_permissions.is_some()
        || req.user_permissions.is_some()
        || req.remove_teams.is_some()
        || req.remove_users.is_some()
    {
        let collection_id = Arc::clone(&collection_id);
        let user = Arc::new(user.clone());
        Some(tokio::spawn(async move {
            match update_asset_permissions(
                user,
                collection_id,
                AssetType::Collection,
                req.team_permissions,
                req.user_permissions,
                req.remove_teams,
                req.remove_users,
            )
            .await
            {
                Ok(_) => Ok(()),
                Err(e) => {
                    return Err(e);
                }
            }
        }))
    } else {
        None
    };

    if let Some(update_collection_permissions_handle) = update_collection_permissions_handle {
        match update_collection_permissions_handle.await {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error updating collection permissions: {}", e);
                send_sentry_error(&e.to_string(), None);
                return Err(anyhow!("Error updating collection permissions: {}", e));
            }
        }
    }

    if let Some(update_collection_record_handle) = update_collection_record_handle {
        match update_collection_record_handle.await {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error updating collection record: {}", e);
                send_sentry_error(&e.to_string(), None);
                return Err(anyhow!("Error updating collection record: {}", e));
            }
        }
    }

    // Assets update handling removed as per refactoring requirement

    let collection = match get_collection_by_id(&user.id, &req.id).await {
        Ok(collection) => collection,
        Err(e) => {
            tracing::error!("Error getting collection: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            send_error_message(
                &user.id.to_string(),
                WsRoutes::Collections(CollectionRoute::Update),
                WsEvent::Collections(CollectionEvent::CollectionState),
                WsErrorCode::InternalServerError,
                e.to_string(),
                user,
            )
            .await?;
            return Err(e);
        }
    };

    let post_collection_message = WsResponseMessage::new(
        WsRoutes::Collections(CollectionRoute::Update),
        WsEvent::Collections(CollectionEvent::CollectionState),
        collection,
        None,
        user,
        WsSendMethod::All,
    );

    match send_ws_message(&user.id.to_string(), &post_collection_message).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error sending ws message: {}", e);
            let err = anyhow!("Error sending ws message: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(err);
        }
    }

    Ok(())
}

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
                .set(collection)
                .execute(&mut conn)
                .await
            {
                Ok(updated_rows) => {
                    if updated_rows == 0 {
                        let err = anyhow!(
                            "User does not have write access to this collection or collection not found"
                        );
                        tracing::error!("{}", err);
                        send_sentry_error(&err.to_string(), Some(&user_id));
                        return Err(err);
                    }
                    Ok(())
                }
                Err(e) => {
                    tracing::error!("Error updating collection: {}", e);
                    send_sentry_error(&e.to_string(), Some(&user_id));
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
                    send_sentry_error(&e.to_string(), None);
                    return;
                }
            };

            let query = diesel::sql_query(
                "UPDATE asset_search 
                SET content = $1, updated_at = NOW()
                WHERE asset_id = $2 AND asset_type = 'collection'"
            )
            .bind::<diesel::sql_types::Text, _>(collection_name)
            .bind::<diesel::sql_types::Uuid, _>(*collection_id);

            if let Err(e) = query.execute(&mut conn).await {
                tracing::error!("Failed to update asset search: {:?}", e);
                send_sentry_error(&e.to_string(), None);
            }
        })
    };

    if let Err(e) = collection_update.await {
        return Err(anyhow!("Error in collection update: {:?}", e));
    }

    if let Err(e) = collection_search_handle.await {
        return Err(anyhow!("Error in collection search update: {:?}", e));
    }

    Ok(())
}

// update_collection_assets function removed as per refactoring requirement
