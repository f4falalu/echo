use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{dsl::not, query_builder::AsChangeset, update, ExpressionMethods};
use diesel_async::RunQueryDsl;
use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use serde::{Deserialize, Serialize};

use crate::{
    routes::ws::{
        dashboards::dashboards_router::{DashboardEvent, DashboardRoute},
        ws::{SubscriptionRwLock, WsErrorCode, WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::{send_error_message, send_ws_message, subscribe_to_stream},
    },
    utils::{
        clients::sentry_utils::send_sentry_error,
        sharing::asset_sharing::{
            create_asset_collection_association, delete_asset_collection_association,
            update_asset_permissions, ShareWithTeamsReqObject, ShareWithUsersReqObject,
        },
    },
};
use database::{
    enums::{AssetPermissionRole, AssetType},
    models::ThreadToDashboard,
    pool::get_pg_pool,
    schema::{dashboards, threads_to_dashboards, metric_files_to_dashboard_files},
    types::DashboardYml,
    vault::create_secret,
};

use super::dashboard_utils::{get_dashboard_state_by_id, get_user_dashboard_permission};
use crate::utils::serde_helpers::deserialization_helpers::deserialize_double_option;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateDashboardRequest {
    pub id: Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
    pub config: Option<Value>,
    /// YAML content of the dashboard
    pub file_content: Option<String>,
    /// Whether to create a new version in the version history (defaults to true)
    pub update_version: Option<bool>,
    pub threads: Option<Vec<Uuid>>,
    pub publicly_accessible: Option<bool>,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_double_option")]
    pub public_password: Option<Option<String>>,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_double_option")]
    pub public_expiry_date: Option<Option<chrono::NaiveDateTime>>,
    pub team_permissions: Option<Vec<ShareWithTeamsReqObject>>,
    pub user_permissions: Option<Vec<ShareWithUsersReqObject>>,
    pub remove_teams: Option<Vec<Uuid>>,
    pub remove_users: Option<Vec<Uuid>>,
    pub add_to_collections: Option<Vec<Uuid>>,
    pub remove_from_collections: Option<Vec<Uuid>>,
}

pub async fn update_dashboard(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &AuthenticatedUser,
    req: UpdateDashboardRequest,
) -> Result<()> {
    println!("Request received in update_dashboard: {:?}", req);
    let dashboard_id = req.id;

    let dashboard_permission = match get_user_dashboard_permission(&user.id, &dashboard_id).await {
        Ok(dashboard_permission) => match dashboard_permission {
            Some(dashboard_permission) => dashboard_permission,
            None => return Err(anyhow!("No dashboard permission found")),
        },
        Err(e) => {
            tracing::error!("Error getting dashboard permission: {}", e);
            return Err(anyhow!("Error getting dashboard permission: {}", e));
        }
    };

    if dashboard_permission == AssetPermissionRole::Viewer {
        tracing::error!("User does not have permission to update dashboard");
        return Err(anyhow!("User does not have permission to update dashboard"));
    }

    let dashboard_subscription = format!("dashboard:{}", dashboard_id);

    match subscribe_to_stream(subscriptions, &dashboard_subscription, user_group, &user.id).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error subscribing to user list subscription: {}", e);
            return Err(anyhow!(
                "Error subscribing to user list subscription: {}",
                e
            ));
        }
    };

    let user_id = Arc::new(user.id.clone());
    let dashboard_id = Arc::new(dashboard_id.clone());

    let update_dashboard_record_handle = {
        let user_id = Arc::clone(&user_id);
        let dashboard_id = Arc::clone(&dashboard_id);
        let req = req.clone();
        Some(tokio::spawn(async move {
            match update_dashboard_record(
                user_id,
                dashboard_id,
                req.name,
                req.description,
                req.config,
                req.publicly_accessible,
                req.public_password,
                req.public_expiry_date,
                req.file_content,
                req.update_version,
            )
            .await
            {
                Ok(_) => Ok(()),
                Err(e) => {
                    return Err(e);
                }
            }
        }))
    };

    let update_dashboard_threads_handle = if let Some(threads) = req.threads {
        let dashboard_id = Arc::clone(&dashboard_id);
        let user_id = Arc::clone(&user_id);
        Some(tokio::spawn(async move {
            update_dashboard_threads(dashboard_id, user_id, threads).await
        }))
    } else {
        None
    };

    let update_dashboard_collections_handle =
        if req.add_to_collections.is_some() || req.remove_from_collections.is_some() {
            let dashboard_id = Arc::clone(&dashboard_id);
            let user_id = Arc::clone(&user_id);
            Some(tokio::spawn(async move {
                match update_dashboard_collections(
                    dashboard_id,
                    user_id,
                    req.add_to_collections,
                    req.remove_from_collections,
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

    let update_dashboard_permissions_handle = if req.team_permissions.is_some()
        || req.user_permissions.is_some()
        || req.remove_teams.is_some()
        || req.remove_users.is_some()
    {
        let dashboard_id = Arc::clone(&dashboard_id);
        let user = Arc::new(user.clone());
        Some(tokio::spawn(async move {
            match update_asset_permissions(
                user,
                dashboard_id,
                AssetType::Dashboard,
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

    if let Some(update_dashboard_permissions_handle) = update_dashboard_permissions_handle {
        match update_dashboard_permissions_handle.await {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error updating dashboard permissions: {}", e);
                send_sentry_error(&e.to_string(), None);
                return Err(anyhow!("Error updating dashboard permissions: {}", e));
            }
        }
    }

    if let Some(update_dashboard_record_handle) = update_dashboard_record_handle {
        match update_dashboard_record_handle.await {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error updating dashboard record: {}", e);
                send_sentry_error(&e.to_string(), None);
                return Err(anyhow!("Error updating dashboard record: {}", e));
            }
        }
    }

    if let Some(update_dashboard_collections_handle) = update_dashboard_collections_handle {
        match update_dashboard_collections_handle.await {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error updating dashboard collections: {}", e);
                send_sentry_error(&e.to_string(), None);
                return Err(anyhow!("Error updating dashboard collections: {}", e));
            }
        }
    }

    if let Some(update_dashboard_threads_handle) = update_dashboard_threads_handle {
        match update_dashboard_threads_handle.await {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error updating dashboard threads: {}", e);
                send_sentry_error(&e.to_string(), None);
                return Err(anyhow!("Error updating dashboard threads: {}", e));
            }
        }
    }

    let dashboard = match get_dashboard_state_by_id(&user.id, &req.id).await {
        Ok(dashboard) => dashboard,
        Err(e) => {
            tracing::error!("Error getting dashboard: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            send_error_message(
                &user.id.to_string(),
                WsRoutes::Dashboards(DashboardRoute::Update),
                WsEvent::Dashboards(DashboardEvent::GetDashboardState),
                WsErrorCode::InternalServerError,
                e.to_string(),
                user,
            )
            .await?;
            return Err(e);
        }
    };

    let dashboard_message_ws_message = WsResponseMessage::new(
        WsRoutes::Dashboards(DashboardRoute::Update),
        WsEvent::Dashboards(DashboardEvent::UpdateDashboard),
        dashboard,
        None,
        user,
        WsSendMethod::All,
    );

    match send_ws_message(&dashboard_subscription, &dashboard_message_ws_message).await {
        Ok(_) => {}
        Err(e) => {
            tracing::error!("Error sending message to pubsub: {}", e);
            return Err(anyhow!("Error sending message to pubsub: {}", e));
        }
    }

    Ok(())
}

#[derive(AsChangeset)]
#[diesel(table_name = dashboards)]
pub struct DashboardChangeset {
    pub updated_at: DateTime<Utc>,
    pub updated_by: Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
    pub config: Option<Value>,
    pub publicly_accessible: Option<bool>,
    pub publicly_enabled_by: Option<Uuid>,
    pub password_secret_id: Option<Option<Uuid>>,
    pub public_expiry_date: Option<Option<chrono::NaiveDateTime>>,
}

async fn update_dashboard_record(
    user_id: Arc<Uuid>,
    dashboard_id: Arc<Uuid>,
    name: Option<String>,
    description: Option<String>,
    config: Option<Value>,
    publicly_accessible: Option<bool>,
    public_password: Option<Option<String>>,
    public_expiry_date: Option<Option<chrono::NaiveDateTime>>,
    file_content: Option<String>,
    _update_version: Option<bool>,
) -> Result<()> {
    let _password_secret_id = match public_password {
        Some(Some(password)) => match create_secret(&dashboard_id, &password).await {
            Ok(secret_id) => Some(Some(secret_id)),
            Err(e) => {
                tracing::error!("Error creating secret: {}", e);
                return Err(anyhow!("Error creating secret: {}", e));
            }
        },
        Some(None) => Some(None),
        None => None,
    };

    let public_expiry_date = match public_expiry_date {
        Some(Some(date)) => Some(Some(date)),
        Some(None) => Some(None),
        None => None,
    };

    let publicly_enabled_by = if let Some(publicly_accessible) = publicly_accessible {
        if publicly_accessible {
            Some(*user_id)
        } else {
            None
        }
    } else {
        None
    };

    // Fetch the current dashboard to check if we need to update it
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Unable to get connection from pool: {:?}", e);
            return Err(anyhow!("Unable to get connection from pool: {}", e));
        }
    };

    // Handle file_content if provided (YAML validation)
    let dashboard_yml_result = if let Some(content) = file_content.clone() {
        // Validate YAML and convert to DashboardYml
        match DashboardYml::new(content) {
            Ok(yml) => {
                // Validate metric references
                let metric_ids: Vec<Uuid> = yml
                    .rows
                    .iter()
                    .flat_map(|row| row.items.iter())
                    .map(|item| item.id)
                    .collect();

                if !metric_ids.is_empty() {
                    // Validate that referenced metrics exist
                    match validate_dashboard_metric_ids(&metric_ids).await {
                        Ok(missing_ids) if !missing_ids.is_empty() => {
                            let error_msg = format!("Dashboard references non-existent metrics: {:?}", missing_ids);
                            tracing::error!("{}", error_msg);
                            return Err(anyhow!(error_msg));
                        }
                        Err(e) => {
                            return Err(e);
                        }
                        Ok(_) => {
                            // Update metric associations - delete previous ones and create new ones
                            match update(metric_files_to_dashboard_files::table)
                                .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(*dashboard_id))
                                .set(metric_files_to_dashboard_files::deleted_at.eq(Some(chrono::Utc::now())))
                                .execute(&mut conn)
                                .await
                            {
                                Ok(_) => {
                                    // Insert new metric associations
                                    let metric_dashboard_values: Vec<_> = metric_ids
                                        .iter()
                                        .map(|metric_id| {
                                            diesel::insert_into(metric_files_to_dashboard_files::table)
                                                .values((
                                                    metric_files_to_dashboard_files::metric_file_id.eq(*metric_id),
                                                    metric_files_to_dashboard_files::dashboard_file_id.eq(*dashboard_id),
                                                    metric_files_to_dashboard_files::created_at.eq(chrono::Utc::now()),
                                                    metric_files_to_dashboard_files::updated_at.eq(chrono::Utc::now()),
                                                    metric_files_to_dashboard_files::created_by.eq(*user_id),
                                                ))
                                                .on_conflict_do_nothing()
                                        })
                                        .collect();

                                    for insertion in metric_dashboard_values {
                                        if let Err(e) = insertion.execute(&mut conn).await {
                                            tracing::warn!(
                                                "Failed to create metric-to-dashboard association: {}",
                                                e
                                            );
                                        }
                                    }
                                }
                                Err(e) => {
                                    tracing::warn!(
                                        "Failed to clear existing metric associations: {}",
                                        e
                                    );
                                }
                            }
                        }
                    }
                }

                // Update config with the serialized YAML
                Some(Ok(yml))
            }
            Err(e) => {
                let error_msg = format!("Invalid dashboard YAML: {}", e);
                tracing::error!("{}", error_msg);
                Some(Err(anyhow!(error_msg)))
            }
        }
    } else {
        None
    };

    // Process config if file_content is not provided but config is
    let config_yml_result = if file_content.is_none() && config.is_some() {
        let config_value = config.as_ref().unwrap();
        
        // Try to convert the config to a DashboardYml
        match serde_json::from_value::<DashboardYml>(config_value.clone()) {
            Ok(yml) => {
                // Validate the yml structure
                if let Err(e) = yml.validate() {
                    let error_msg = format!("Invalid dashboard configuration: {}", e);
                    tracing::error!("{}", error_msg);
                    return Err(anyhow!(error_msg));
                }
                
                // Validate metric references
                let metric_ids: Vec<Uuid> = yml
                    .rows
                    .iter()
                    .flat_map(|row| row.items.iter())
                    .map(|item| item.id)
                    .collect();

                if !metric_ids.is_empty() {
                    // Validate that referenced metrics exist
                    match validate_dashboard_metric_ids(&metric_ids).await {
                        Ok(missing_ids) if !missing_ids.is_empty() => {
                            let error_msg = format!("Dashboard references non-existent metrics: {:?}", missing_ids);
                            tracing::error!("{}", error_msg);
                            return Err(anyhow!(error_msg));
                        }
                        Err(e) => {
                            return Err(e);
                        }
                        Ok(_) => {
                            // Update metric associations - delete previous ones and create new ones
                            match update(metric_files_to_dashboard_files::table)
                                .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(*dashboard_id))
                                .set(metric_files_to_dashboard_files::deleted_at.eq(Some(chrono::Utc::now())))
                                .execute(&mut conn)
                                .await
                            {
                                Ok(_) => {
                                    // Insert new metric associations
                                    let metric_dashboard_values: Vec<_> = metric_ids
                                        .iter()
                                        .map(|metric_id| {
                                            diesel::insert_into(metric_files_to_dashboard_files::table)
                                                .values((
                                                    metric_files_to_dashboard_files::metric_file_id.eq(*metric_id),
                                                    metric_files_to_dashboard_files::dashboard_file_id.eq(*dashboard_id),
                                                    metric_files_to_dashboard_files::created_at.eq(chrono::Utc::now()),
                                                    metric_files_to_dashboard_files::updated_at.eq(chrono::Utc::now()),
                                                    metric_files_to_dashboard_files::created_by.eq(*user_id),
                                                ))
                                                .on_conflict_do_nothing()
                                        })
                                        .collect();

                                    for insertion in metric_dashboard_values {
                                        if let Err(e) = insertion.execute(&mut conn).await {
                                            tracing::warn!(
                                                "Failed to create metric-to-dashboard association: {}",
                                                e
                                            );
                                        }
                                    }
                                }
                                Err(e) => {
                                    tracing::warn!(
                                        "Failed to clear existing metric associations: {}",
                                        e
                                    );
                                }
                            }
                        }
                    }
                }
                
                Some(yml)
            }
            Err(e) => {
                let error_msg = format!("Invalid dashboard configuration format: {}", e);
                tracing::error!("{}", error_msg);
                return Err(anyhow!(error_msg));
            }
        }
    } else {
        None
    };
    
    // If YAML validation failed, return the error
    if let Some(Err(e)) = dashboard_yml_result {
        return Err(e);
    }
    
    // Update dashboard record
    let changeset = DashboardChangeset {
        updated_at: Utc::now(),
        updated_by: *user_id,
        name: name.clone(),
        description,
        config: if let Some(Ok(ref yml)) = dashboard_yml_result {
            Some(yml.to_value()?)
        } else if let Some(ref yml) = config_yml_result {
            Some(yml.to_value()?)
        } else {
            config
        },
        publicly_accessible,
        publicly_enabled_by,
        password_secret_id: None,
        public_expiry_date,
    };

    let dashboard_update = {
        let dashboard_id = dashboard_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Unable to get connection from pool: {:?}", e);
                    return Err(anyhow!("Unable to get connection from pool: {}", e));
                }
            };

            match update(dashboards::table)
                .filter(dashboards::id.eq(*dashboard_id))
                .set(&changeset)
                .execute(&mut conn)
                .await
            {
                Ok(_) => Ok(()),
                Err(e) => {
                    tracing::error!("Unable to update dashboard in database: {:?}", e);
                    let err = anyhow!("Unable to update dashboard in database: {}", e);
                    send_sentry_error(&e.to_string(), None);
                    Err(err)
                }
            }
        })
    };

    let dashboard_search_handle = {
        let dashboard_id = dashboard_id.clone();
        let dashboard_name = if let Some(Ok(ref yml)) = dashboard_yml_result {
            yml.name.clone()
        } else if let Some(ref yml) = config_yml_result {
            yml.name.clone()
        } else {
            name.unwrap_or_default()
        };
        
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
                WHERE asset_id = $2 AND asset_type = 'dashboard'",
            )
            .bind::<diesel::sql_types::Text, _>(dashboard_name)
            .bind::<diesel::sql_types::Uuid, _>(*dashboard_id);

            if let Err(e) = query.execute(&mut conn).await {
                tracing::error!("Failed to update asset search: {:?}", e);
                send_sentry_error(&e.to_string(), None);
            }
        })
    };

    if let Err(e) = dashboard_update.await {
        return Err(anyhow!("Error in dashboard update: {:?}", e));
    }

    if let Err(e) = dashboard_search_handle.await {
        return Err(anyhow!("Error in dashboard search update: {:?}", e));
    }

    Ok(())
}

async fn update_dashboard_collections(
    dashboard_id: Arc<Uuid>,
    user_id: Arc<Uuid>,
    add_to_collections: Option<Vec<Uuid>>,
    remove_from_collections: Option<Vec<Uuid>>,
) -> Result<()> {
    let add_to_collection_handle = if let Some(add_to_collections) = add_to_collections {
        let dashboard_id = Arc::clone(&dashboard_id);
        let user_id = Arc::clone(&user_id);
        Some(tokio::spawn(async move {
            create_asset_collection_association(
                add_to_collections,
                dashboard_id.clone(),
                AssetType::Dashboard,
                user_id,
            )
            .await
        }))
    } else {
        None
    };

    let remove_from_collection_handle =
        if let Some(remove_from_collections) = remove_from_collections {
            let dashboard_id = Arc::clone(&dashboard_id);
            let user_id = Arc::clone(&user_id);
            Some(tokio::spawn(async move {
                delete_asset_collection_association(
                    remove_from_collections,
                    dashboard_id.clone(),
                    AssetType::Dashboard,
                    user_id,
                )
                .await
            }))
        } else {
            None
        };

    if let Some(add_to_collection_handle) = add_to_collection_handle {
        match add_to_collection_handle.await.unwrap() {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error adding to collection: {}", e);
                return Err(anyhow!("Error adding to collection: {}", e));
            }
        }
    }

    if let Some(remove_from_collection_handle) = remove_from_collection_handle {
        match remove_from_collection_handle.await.unwrap() {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error removing from collection: {}", e);
                return Err(anyhow!("Error removing from collection: {}", e));
            }
        }
    }

    Ok(())
}

async fn update_dashboard_threads(
    dashboard_id: Arc<Uuid>,
    user_id: Arc<Uuid>,
    threads: Vec<Uuid>,
) -> Result<()> {
    let threads = Arc::new(threads);

    let upsert_handle = {
        let threads = Arc::clone(&threads);
        let dashboard_id = Arc::clone(&dashboard_id);
        let user_id = Arc::clone(&user_id);
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Error getting pg pool: {:?}", e)),
            };

            let new_thread_records: Vec<ThreadToDashboard> = threads
                .iter()
                .map(|thread_id| ThreadToDashboard {
                    thread_id: *thread_id,
                    dashboard_id: *dashboard_id,
                    created_at: chrono::Utc::now(),
                    updated_at: Utc::now(),
                    deleted_at: None,
                    added_by: *user_id,
                })
                .collect();
            match diesel::insert_into(threads_to_dashboards::table)
                .values(&new_thread_records)
                .on_conflict((
                    threads_to_dashboards::thread_id,
                    threads_to_dashboards::dashboard_id,
                ))
                .do_update()
                .set((
                    threads_to_dashboards::updated_at.eq(chrono::Utc::now()),
                    threads_to_dashboards::deleted_at.eq(Option::<DateTime<Utc>>::None),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => Ok(()),
                Err(e) => {
                    tracing::error!("Error updating dashboard threads: {}", e);
                    Err(anyhow!("Unable to upsert threads to dashboard: {}", e))
                }
            }
        })
    };

    let remove_handle = {
        let threads = Arc::clone(&threads);
        let dashboard_id = Arc::clone(&dashboard_id);
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Error getting pg pool: {:?}", e)),
            };

            match update(threads_to_dashboards::table)
                .filter(threads_to_dashboards::dashboard_id.eq(*dashboard_id))
                .filter(not(
                    threads_to_dashboards::thread_id.eq_any(threads.as_ref())
                ))
                .set(threads_to_dashboards::deleted_at.eq(Some(chrono::Utc::now())))
                .execute(&mut conn)
                .await
            {
                Ok(_) => Ok(()),
                Err(e) => {
                    tracing::error!("Error removing threads from dashboard: {}", e);
                    Err(anyhow!("Error removing threads from dashboard: {}", e))
                }
            }
        })
    };

    match upsert_handle.await {
        Ok(Ok(_)) => (),
        Ok(Err(e)) => {
            tracing::error!("Error upserting threads to dashboard: {}", e);
            return Err(anyhow!("Error upserting threads to dashboard: {}", e));
        }
        Err(e) => {
            tracing::error!("Error upserting threads to dashboard: {}", e);
            return Err(anyhow!("Error upserting threads to dashboard: {}", e));
        }
    }

    match remove_handle.await {
        Ok(Ok(_)) => (),
        Ok(Err(e)) => {
            tracing::error!("Error removing threads from dashboard: {}", e);
            return Err(anyhow!("Error removing threads from dashboard: {}", e));
        }
        Err(e) => {
            tracing::error!("Error removing threads from dashboard: {}", e);
            return Err(anyhow!("Error removing threads from dashboard: {}", e));
        }
    }

    Ok(())
}

/// Validate that the metric IDs referenced in the dashboard exist
async fn validate_dashboard_metric_ids(metric_ids: &[Uuid]) -> Result<Vec<Uuid>> {
    if metric_ids.is_empty() {
        return Ok(Vec::new());
    }

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Unable to get connection from pool: {:?}", e);
            return Err(anyhow!("Unable to get connection from pool: {}", e));
        }
    };

    #[derive(Debug, diesel::QueryableByName)]
    #[diesel(table_name = metric_files)]
    struct MetricIdResult {
        #[diesel(sql_type = diesel::sql_types::Uuid)]
        id: Uuid,
    }

    // Query to find which metric IDs exist
    let query = diesel::sql_query(
        "SELECT id FROM metric_files WHERE id = ANY($1) AND deleted_at IS NULL"
    )
    .bind::<diesel::sql_types::Array<diesel::sql_types::Uuid>, _>(metric_ids);

    let existing_metrics: Vec<Uuid> = match query.load::<MetricIdResult>(&mut conn).await {
        Ok(results) => results.into_iter().map(|r| r.id).collect(),
        Err(e) => {
            tracing::error!("Error validating metric IDs: {:?}", e);
            return Err(anyhow!("Error validating metric IDs: {}", e));
        }
    };

    // Find missing metrics
    let missing_ids: Vec<Uuid> = metric_ids
        .iter()
        .filter(|id| !existing_metrics.contains(id))
        .cloned()
        .collect();

    Ok(missing_ids)
}
