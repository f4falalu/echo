use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;

use anyhow::{anyhow, Result};
use diesel::{
    dsl::count, BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods,
    QueryDsl,
};
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::{
    routes::ws::threads_and_messages::messages_utils::MessageDraftState,
    utils::{
        clients::sentry_utils::send_sentry_error,
        sharing::asset_sharing::{
            get_asset_collections, get_asset_sharing_info, CollectionNameAndId,
            IndividualPermission, TeamPermissions,
        },
    },
};
use database::{
    enums::{AssetPermissionRole, AssetType, UserOrganizationRole},
    models::{MessageDeprecated, ThreadDeprecated},
    pool::get_pg_pool,
    schema::{
        asset_permissions, collections_to_assets, dashboards, data_sources, datasets,
        messages_deprecated, sql_evaluations, teams_to_users, threads_deprecated,
        threads_to_dashboards, users, users_to_organizations,
    },
    vault::read_secret,
};

#[derive(Serialize, Clone, Debug)]
pub struct MessageWithUserInfo {
    #[serde(flatten)]
    pub message: MessageDeprecated,
    pub thoughts: Option<Value>,
    pub response: Option<String>,
    pub evaluation_summary: Option<String>,
    pub evaluation_score: Option<String>,
    pub error: Option<String>,
    pub dataset_name: Option<String>,
    pub sent_by_name: String,
    pub sent_by_id: Uuid,
    pub sent_by_avatar: Option<String>,
}

#[derive(Serialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct DashboardNameAndId {
    pub id: Uuid,
    pub name: String,
}

#[derive(Serialize, Clone)]
pub struct ThreadState {
    #[serde(flatten)]
    pub thread: ThreadDeprecated,
    pub title: String,
    pub messages: Vec<MessageWithUserInfo>,
    pub dashboards: Vec<DashboardNameAndId>,
    pub collections: Vec<CollectionNameAndId>,
    pub dataset_id: Option<Uuid>,
    pub dataset_name: Option<String>,
    pub permission: Option<AssetPermissionRole>,
    pub individual_permissions: Option<Vec<IndividualPermission>>,
    pub team_permissions: Option<Vec<TeamPermissions>>,
    pub organization_permissions: bool,
    pub public_password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub draft_session_id: Option<Uuid>,
}

pub async fn get_thread_state_by_id(
    user_id: &Uuid,
    thread_id: &Uuid,
    draft_session_id: &Option<Uuid>,
) -> Result<ThreadState> {
    let thread_id = Arc::new(thread_id.clone());
    let user_id = Arc::new(user_id.clone());

    let thread_and_permission = {
        let thread_id = Arc::clone(&thread_id);
        let user_id = Arc::clone(&user_id);
        tokio::spawn(async move { get_thread_and_check_permissions(user_id, thread_id).await })
    };

    let thread_sharing_info = {
        let thread_id = Arc::clone(&thread_id);
        tokio::spawn(async move { get_asset_sharing_info(thread_id, AssetType::Thread).await })
    };

    let thread_messages = {
        let thread_id = Arc::clone(&thread_id);
        let draft_session_id = draft_session_id.clone();
        tokio::spawn(async move { get_thread_messages(thread_id, &draft_session_id).await })
    };

    let thread_dashboards = {
        let thread_id = Arc::clone(&thread_id);
        tokio::spawn(async move { get_thread_dashboards(thread_id).await })
    };

    let thread_collections = {
        let thread_id = Arc::clone(&thread_id);
        tokio::spawn(async move { get_asset_collections(thread_id, AssetType::Thread).await })
    };

    let (
        thread_and_permission_result,
        thread_sharing_info_result,
        thread_messages_result,
        thread_dashboards_result,
        thread_collections_result,
    ) = match tokio::try_join!(
        thread_and_permission,
        thread_sharing_info,
        thread_messages,
        thread_dashboards,
        thread_collections,
    ) {
        Ok((
            thread_and_permission,
            thread_sharing_info,
            thread_messages,
            thread_dashboards,
            thread_collections,
        )) => (
            thread_and_permission,
            thread_sharing_info,
            thread_messages,
            thread_dashboards,
            thread_collections,
        ),
        Err(e) => {
            tracing::error!("Error getting thread by ID: {}", e);
            send_sentry_error(&format!("Error getting thread by ID: {}", e), None);
            return Err(anyhow!("Error getting thread by ID: {}", e));
        }
    };

    let (thread, permission) = match thread_and_permission_result {
        Ok((thread, permission)) => (thread, permission),
        Err(e) => {
            tracing::error!("Error getting thread and permission: {}", e);
            send_sentry_error(&format!("Error getting thread and permission: {}", e), None);
            return Err(anyhow!("Error getting thread and permission: {}", e));
        }
    };

    let public_password = if let Some(_password_secret_id) = thread.password_secret_id {
        let public_password = match read_secret(&thread.id).await {
            Ok(public_password) => public_password,
            Err(e) => {
                tracing::error!("Error getting public password: {}", e);
                send_sentry_error(&format!("Error getting public password: {}", e), None);
                return Err(anyhow!("Error getting public password: {}", e));
            }
        };

        Some(public_password)
    } else {
        None
    };

    let thread_sharing_info = match thread_sharing_info_result {
        Ok(mut thread_sharing_info) => {
            // Filter out the current user from individual permissions
            if let Some(ref mut individual_permissions) = thread_sharing_info.individual_permissions
            {
                individual_permissions.retain(|permission| permission.id != *user_id);
                if individual_permissions.is_empty() {
                    thread_sharing_info.individual_permissions = None;
                }
            }

            // Filter out the current user from team permissions
            if let Some(ref mut team_permissions) = thread_sharing_info.team_permissions {
                for team_permission in team_permissions.iter_mut() {
                    team_permission
                        .user_permissions
                        .retain(|user_permission| user_permission.id != *user_id);
                }
                // Remove teams with no remaining user permissions
                // team_permissions
                //     .retain(|team_permission| !team_permission.user_permissions.is_empty());
                // if team_permissions.is_empty() {
                //     thread_sharing_info.team_permissions = None;
                // }
            }

            // Create a map of team permissions for quick lookup
            let team_permissions_map: HashMap<Uuid, AssetPermissionRole> = thread_sharing_info
                .team_permissions
                .as_ref()
                .map(|perms| {
                    perms
                        .iter()
                        .flat_map(|p| p.user_permissions.iter().map(|up| (p.id, up.role.clone())))
                        .collect()
                })
                .unwrap_or_default();

            // Update individual permissions
            if let Some(ref mut individual_permissions) = thread_sharing_info.individual_permissions
            {
                for permission in individual_permissions.iter_mut() {
                    if let Some(team_role) = team_permissions_map.get(&permission.id) {
                        permission.role =
                            AssetPermissionRole::max(permission.role.clone(), team_role.clone());
                    }
                }
            }

            // Update team permissions
            if let Some(ref mut team_permissions) = thread_sharing_info.team_permissions {
                for team_permission in team_permissions.iter_mut() {
                    if let Some(individual_permissions) =
                        &thread_sharing_info.individual_permissions
                    {
                        if let Some(individual_role) = individual_permissions
                            .iter()
                            .find(|p| p.id == team_permission.id)
                            .map(|p| &p.role)
                        {
                            for user_permission in &mut team_permission.user_permissions {
                                user_permission.role = AssetPermissionRole::max(
                                    user_permission.role.clone(),
                                    individual_role.clone(),
                                );
                            }
                        }
                    }
                }
            }

            thread_sharing_info
        }
        Err(e) => {
            tracing::error!("Error getting thread sharing info: {}", e);
            send_sentry_error(&format!("Error getting thread sharing info: {}", e), None);
            return Err(anyhow!("Error getting thread sharing info: {}", e));
        }
    };

    let thread_messages = match thread_messages_result {
        Ok(thread_messages) => thread_messages,
        Err(e) => {
            tracing::error!("Error getting thread metrics: {}", e);
            send_sentry_error(&format!("Error getting thread metrics: {}", e), None);
            return Err(anyhow!("Error getting thread metrics: {}", e));
        }
    };

    let thread_dashboards = match thread_dashboards_result {
        Ok(thread_dashboards) => thread_dashboards,
        Err(e) => {
            tracing::error!("Error getting thread dashboards: {}", e);
            send_sentry_error(&format!("Error getting thread dashboards: {}", e), None);
            return Err(anyhow!("Error getting thread dashboards: {}", e));
        }
    };

    let thread_collections = match thread_collections_result {
        Ok(thread_collections) => thread_collections,
        Err(e) => {
            tracing::error!("Error getting thread collections: {}", e);
            send_sentry_error(&format!("Error getting thread collections: {}", e), None);
            return Err(anyhow!("Error getting thread collections: {}", e));
        }
    };

    let (title, dataset_id, dataset_name) = if let Some(_) = draft_session_id {
        // Get the most recent message
        if let Some(most_recent_message) = thread_messages.last() {
            (
                most_recent_message
                    .message
                    .title
                    .clone()
                    .unwrap_or_else(|| "".to_string()),
                most_recent_message.message.dataset_id,
                most_recent_message.dataset_name.clone(),
            )
        } else {
            ("Untitled".to_string(), None, None)
        }
    } else if let Some(state_message_id) = thread.state_message_id {
        (
            get_title_by_message_id(&state_message_id, &thread_messages),
            get_dataset_id_by_message_id(&state_message_id, &thread_messages),
            get_dataset_name_by_message_id(&state_message_id, &thread_messages),
        )
    } else {
        ("Untitled".to_string(), None, None)
    };

    if thread_messages.is_empty() {
        return Err(anyhow!("Metric does not exist"));
    }

    Ok(ThreadState {
        thread,
        title,
        permission,
        dataset_id,
        dataset_name,
        individual_permissions: thread_sharing_info.individual_permissions,
        team_permissions: thread_sharing_info.team_permissions,
        organization_permissions: thread_sharing_info.organization_permissions,
        messages: thread_messages,
        dashboards: thread_dashboards,
        collections: thread_collections,
        public_password,
        draft_session_id: draft_session_id.clone(),
    })
}

fn get_title_by_message_id(state_message_id: &Uuid, messages: &Vec<MessageWithUserInfo>) -> String {
    let message = messages.iter().find(|m| m.message.id == *state_message_id);

    let title = match message {
        Some(m) => match m.message.title.clone() {
            Some(title) => title,
            None => "Untitled".to_string(),
        },
        None => "Untitled".to_string(),
    };

    title
}

fn get_dataset_id_by_message_id(
    state_message_id: &Uuid,
    messages: &Vec<MessageWithUserInfo>,
) -> Option<Uuid> {
    let message = messages.iter().find(|m| m.message.id == *state_message_id);

    let dataset_id = match message {
        Some(m) => match m.message.dataset_id {
            Some(dataset_id) => Some(dataset_id),
            None => None,
        },
        None => None,
    };

    dataset_id
}

fn get_dataset_name_by_message_id(
    state_message_id: &Uuid,
    messages: &Vec<MessageWithUserInfo>,
) -> Option<String> {
    let message = messages.iter().find(|m| m.message.id == *state_message_id);

    let dataset_name = match message {
        Some(m) => match m.dataset_name.clone() {
            Some(dataset_name) => Some(dataset_name),
            None => None,
        },
        None => None,
    };

    dataset_name
}

pub async fn get_user_thread_permission(
    user_id: Arc<Uuid>,
    thread_id: Arc<Uuid>,
) -> Result<Option<AssetPermissionRole>> {
    let is_organization_admin_handle = {
        let user_id = Arc::clone(&user_id);
        let thread_id = Arc::clone(&thread_id);
        tokio::spawn(async move { is_organization_admin_or_owner(user_id, thread_id).await })
    };

    let user_asset_role_handle = {
        let user_id = Arc::clone(&user_id);
        let thread_id = Arc::clone(&thread_id);
        tokio::spawn(async move { get_user_asset_role(user_id, thread_id).await })
    };

    let (is_organization_admin, user_asset_role) =
        match tokio::try_join!(is_organization_admin_handle, user_asset_role_handle) {
            Ok((is_organization_admin, user_asset_role)) => {
                (is_organization_admin, user_asset_role)
            }
            Err(e) => {
                tracing::error!("Error getting user organization role: {}", e);
                return Err(anyhow!("Error getting user organization role: {}", e));
            }
        };

    let permissions = match user_asset_role {
        Ok(permissions) => permissions,
        Err(e) => {
            tracing::error!("Error getting user asset role: {}", e);
            return Err(anyhow!("Error getting user asset role: {}", e));
        }
    };

    let is_organization_admin = match is_organization_admin {
        Ok(is_admin) => is_admin,
        Err(e) => {
            tracing::error!("Error getting user organization role: {}", e);
            return Err(anyhow!("Error getting user organization role: {}", e));
        }
    };

    if is_organization_admin {
        return Ok(Some(AssetPermissionRole::Owner));
    }

    if let Some(permissions) = permissions {
        if permissions.is_empty() {
            return Ok(None);
        }

        let permission = permissions
            .into_iter()
            .max_by_key(|role| match role {
                AssetPermissionRole::Owner => 3,
                AssetPermissionRole::Editor => 2,
                AssetPermissionRole::Viewer => 1,
                _ => 0,
            })
            .ok_or_else(|| anyhow!("No thread found with permissions"))?;

        Ok(Some(permission))
    } else {
        Ok(None)
    }
}

async fn get_user_asset_role(
    user_id: Arc<Uuid>,
    thread_id: Arc<Uuid>,
) -> Result<Option<Vec<AssetPermissionRole>>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let permissions = match asset_permissions::table
        .left_join(
            teams_to_users::table.on(asset_permissions::identity_id.eq(teams_to_users::team_id)),
        )
        .left_join(
            threads_to_dashboards::table.on(asset_permissions::asset_id
                .eq(threads_to_dashboards::dashboard_id)
                .and(threads_to_dashboards::deleted_at.is_null())
                .and(threads_to_dashboards::thread_id.eq(*thread_id))),
        )
        .left_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(collections_to_assets::deleted_at.is_null())
                .and(collections_to_assets::asset_id.eq(*thread_id))),
        )
        .select(asset_permissions::role)
        .filter(asset_permissions::deleted_at.is_null())
        .filter(
            asset_permissions::identity_id
                .eq(user_id.as_ref())
                .or(teams_to_users::user_id.eq(user_id.as_ref())),
        )
        .filter(
            asset_permissions::asset_id
                .eq(thread_id.as_ref())
                .or(threads_to_dashboards::thread_id.is_not_null())
                .or(collections_to_assets::collection_id.is_not_null()),
        )
        .load::<AssetPermissionRole>(&mut conn)
        .await
    {
        Ok(permissions) => Some(permissions),
        Err(diesel::result::Error::NotFound) => return Ok(None),
        Err(e) => {
            tracing::error!("Error querying thread by ID: {}", e);
            return Err(anyhow!("Error querying thread by ID: {}", e));
        }
    };

    Ok(permissions)
}

async fn is_organization_admin_or_owner(user_id: Arc<Uuid>, thread_id: Arc<Uuid>) -> Result<bool> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let is_organization_admin = match users_to_organizations::table
        .inner_join(
            data_sources::table
                .on(users_to_organizations::organization_id.eq(data_sources::organization_id)),
        )
        .inner_join(datasets::table.on(data_sources::id.eq(datasets::data_source_id)))
        .inner_join(
            messages_deprecated::table
                .on(datasets::id.nullable().eq(messages_deprecated::dataset_id)),
        )
        .select(users_to_organizations::role)
        .filter(messages_deprecated::thread_id.eq(thread_id.as_ref()))
        .filter(users_to_organizations::user_id.eq(user_id.as_ref()))
        .first::<UserOrganizationRole>(&mut conn)
        .await
    {
        Ok(role) => role,
        Err(diesel::result::Error::NotFound) => return Ok(false),
        Err(e) => {
            tracing::error!("Error getting user organization role: {}", e);
            return Err(anyhow!("Error getting user organization role: {}", e));
        }
    };

    let is_organization_adminig = if is_organization_admin == UserOrganizationRole::WorkspaceAdmin
        || is_organization_admin == UserOrganizationRole::DataAdmin
    {
        true
    } else {
        false
    };

    Ok(is_organization_adminig)
}

async fn get_thread_and_check_permissions(
    user_id: Arc<Uuid>,
    thread_id: Arc<Uuid>,
) -> Result<(ThreadDeprecated, Option<AssetPermissionRole>)> {
    let thread_handler = {
        let id = Arc::clone(&thread_id);
        tokio::spawn(async move { get_thread_by_id(id).await })
    };

    let permission_handler = {
        let user_id = Arc::clone(&user_id);
        let thread_id = Arc::clone(&thread_id);
        tokio::spawn(async move { get_user_thread_permission(user_id, thread_id).await })
    };

    let (thread_result, permission_result) =
        match tokio::try_join!(thread_handler, permission_handler) {
            Ok((thread, permission)) => (thread, permission),
            Err(e) => return Err(anyhow!("Error getting thread or permission: {}", e)),
        };

    let thread = match thread_result {
        Ok(thread) => thread,
        Err(e) => return Err(anyhow!("Error getting thread: {}", e)),
    };

    let permission = match permission_result {
        Ok(permission) => permission,
        Err(e) => return Err(anyhow!("Error getting permission: {}", e)),
    };

    if permission.is_none() && !thread.publicly_accessible {
        return Err(anyhow!("Thread not found"));
    };

    Ok((thread, permission))
}

async fn get_thread_by_id(thread_id: Arc<Uuid>) -> Result<ThreadDeprecated> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let thread = match threads_deprecated::table
        .filter(threads_deprecated::id.eq(thread_id.as_ref()))
        .filter(threads_deprecated::deleted_at.is_null())
        .select(threads_deprecated::all_columns)
        .first::<ThreadDeprecated>(&mut conn)
        .await
    {
        Ok(threads) => threads,
        Err(diesel::result::Error::NotFound) => {
            return Err(anyhow!("thread not found"));
        }
        Err(e) => {
            return Err(anyhow!("Error querying thread by ID: {}", e));
        }
    };

    Ok(thread)
}

async fn get_thread_messages(
    thread_id: Arc<Uuid>,
    draft_session_id: &Option<Uuid>,
) -> Result<Vec<MessageWithUserInfo>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let mut statement = messages_deprecated::table
        .inner_join(users::table.on(messages_deprecated::sent_by.eq(users::id)))
        .left_join(datasets::table.on(messages_deprecated::dataset_id.eq(datasets::id.nullable())))
        .left_join(
            sql_evaluations::table
                .on(messages_deprecated::sql_evaluation_id.eq(sql_evaluations::id.nullable())),
        )
        .select((
            messages_deprecated::all_columns,
            sql_evaluations::evaluation_summary.nullable(),
            sql_evaluations::score.nullable(),
            users::name.nullable(),
            users::email,
            users::id,
            datasets::name.nullable(),
        ))
        .filter(messages_deprecated::thread_id.eq(thread_id.as_ref()))
        .filter(messages_deprecated::deleted_at.is_null())
        .order(messages_deprecated::created_at.asc())
        .into_boxed();

    if let Some(draft_session_id) = draft_session_id {
        println!("draft_session_id: {:?}", draft_session_id);
        statement = statement.filter(
            messages_deprecated::draft_session_id
                .eq(draft_session_id)
                .or(messages_deprecated::draft_session_id.is_null()),
        );
    } else {
        println!("draft_session_id is null");
        statement = statement.filter(messages_deprecated::draft_session_id.is_null());
    }

    let message_records = match statement
        .load::<(
            MessageDeprecated,
            Option<String>,
            Option<String>,
            Option<String>,
            String,
            Uuid,
            Option<String>,
        )>(&mut conn)
        .await
    {
        Ok(message_records) => message_records,
        Err(e) => {
            return Err(anyhow!("Error querying message records: {}", e));
        }
    };

    let mut messages = Vec::new();
    for (mut message, evaluation_summary, evaluation_score, name, email, id, dataset_name) in
        message_records
    {
        if let Some(draft_session_id) = draft_session_id {
            if let Some(message_draft_state) = &message.draft_state {
                let message_draft_state: MessageDraftState =
                    serde_json::from_value(message_draft_state.clone()).unwrap();
                if message_draft_state.draft_session_id == *draft_session_id {
                    message = apply_draft_state(message, &message_draft_state);
                }
            }
        }

        if message.deleted_at.is_some() {
            continue;
        }

        let response = if let Some(responses) = &message.responses {
            match responses.get("messages") {
                Some(messages) => {
                    // First unescape the JSON string properly
                    let clean_message =
                        serde_json::from_value::<String>(messages.clone()).unwrap_or_default();
                    Some(clean_message)
                }
                None => None,
            }
        } else {
            None
        };

        let thoughts = if let Some(context) = &message.context {
            match context.get("thoughts") {
                Some(thoughts) => Some(thoughts.clone()),
                None => None,
            }
        } else {
            None
        };

        let _sql_evaluation = if let Some(context) = &message.context {
            match context.get("sql_evaluation") {
                Some(sql_evaluation) => Some(sql_evaluation.clone()),
                None => None,
            }
        } else {
            None
        };

        let error = if let Some(context) = &message.context {
            match context.get("error") {
                Some(Value::String(error)) => Some(error.clone()),
                _ => None,
            }
        } else {
            None
        };

        let message = MessageWithUserInfo {
            response,
            message,
            thoughts,
            sent_by_name: name.unwrap_or(email),
            sent_by_id: id,
            sent_by_avatar: None,
            dataset_name,
            evaluation_summary,
            evaluation_score,
            error,
        };
        messages.push(message);
    }
    Ok(messages)
}

fn apply_draft_state(
    message: MessageDeprecated,
    draft_state: &MessageDraftState,
) -> MessageDeprecated {
    let mut message = message;

    if let Some(title) = &draft_state.title {
        message.title = Some(title.clone());
    }

    if let Some(chart_config) = &draft_state.chart_config {
        message.chart_config = Some(chart_config.clone());
    }

    if let Some(code) = &draft_state.code {
        message.code = Some(code.clone());
    }

    if let Some(deleted_at) = &draft_state.deleted_at {
        message.deleted_at = Some(deleted_at.clone());
    }

    message.draft_session_id = Some(draft_state.draft_session_id.clone());

    message
}

async fn get_thread_dashboards(thread_id: Arc<Uuid>) -> Result<Vec<DashboardNameAndId>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let dashboard_records = match dashboards::table
        .inner_join(
            threads_to_dashboards::table.on(dashboards::id.eq(threads_to_dashboards::dashboard_id)),
        )
        .select((dashboards::id, dashboards::name))
        .filter(threads_to_dashboards::thread_id.eq(thread_id.as_ref()))
        .filter(dashboards::deleted_at.is_null())
        .filter(threads_to_dashboards::deleted_at.is_null())
        .load::<(Uuid, String)>(&mut conn)
        .await
    {
        Ok(message_records) => message_records,
        Err(e) => {
            return Err(anyhow!("Error querying message records: {}", e));
        }
    };

    let mut dashboards = Vec::new();

    for (id, name) in dashboard_records {
        let dashboard = DashboardNameAndId { id, name };
        dashboards.push(dashboard);
    }

    Ok(dashboards)
}

pub async fn check_if_thread_saved(thread_id: &Uuid) -> Result<bool> {
    let threads_to_collections_id = thread_id.clone();

    let mut threads_to_collections_conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(anyhow!("Unable to get connection from pool: {}", e));
        }
    };

    let thread_to_collections_handle = tokio::spawn(async move {
        let thread_to_collections = match collections_to_assets::table
            .select(count(collections_to_assets::collection_id))
            .filter(collections_to_assets::asset_id.eq(&threads_to_collections_id))
            .first::<i64>(&mut threads_to_collections_conn)
            .await
        {
            Ok(count) => count,
            Err(e) => {
                return Err(anyhow!("Unable to get thread to collections count: {}", e));
            }
        };

        if thread_to_collections > 0 {
            return Ok(true);
        } else {
            return Ok(false);
        }
    });

    let threads_to_dashboards_id = thread_id.clone();

    let mut threads_to_dashboards_conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(anyhow!("Unable to get connection from pool: {}", e));
        }
    };

    let thread_to_dashboards_handle = tokio::spawn(async move {
        let thread_to_dashboards = match threads_to_dashboards::table
            .select(count(threads_to_dashboards::dashboard_id))
            .filter(threads_to_dashboards::thread_id.eq(&threads_to_dashboards_id))
            .first::<i64>(&mut threads_to_dashboards_conn)
            .await
        {
            Ok(count) => count,
            Err(e) => {
                return Err(anyhow!("Unable to get thread to dashboards count: {}", e));
            }
        };

        if thread_to_dashboards > 0 {
            return Ok(true);
        } else {
            return Ok(false);
        }
    });

    let threads_to_users_id = thread_id.clone();

    let mut threads_to_users_conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(anyhow!("Unable to get connection from pool: {}", e));
        }
    };

    let users_to_threads_handle = tokio::spawn(async move {
        let user_to_threads = match asset_permissions::table
            .select(count(asset_permissions::identity_id))
            .filter(asset_permissions::asset_id.eq(&threads_to_users_id))
            .first::<i64>(&mut threads_to_users_conn)
            .await
        {
            Ok(count) => count,
            Err(e) => {
                return Err(anyhow!(e));
            }
        };

        if user_to_threads > 1 {
            return Ok(true);
        } else {
            return Ok(false);
        }
    });

    let thread_to_collections_result = match thread_to_collections_handle.await.unwrap() {
        Ok(result) => result,
        Err(e) => {
            return Err(anyhow!("Unable to insert thread into database: {}", e));
        }
    };

    let thread_to_dashboards_result = match thread_to_dashboards_handle.await.unwrap() {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Unable to insert thread into database: {:?}", e);
            return Err(anyhow!("Unable to insert thread into database: {}", e));
        }
    };

    let users_to_threads_result = match users_to_threads_handle.await.unwrap() {
        Ok(result) => result,
        Err(e) => {
            return Err(anyhow!("Unable to insert thread into database: {}", e));
        }
    };

    if thread_to_collections_result || thread_to_dashboards_result || users_to_threads_result {
        return Ok(true);
    }

    Ok(false)
}
