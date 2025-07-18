use database::enums::{AssetPermissionRole, AssetType, IdentityType, UserOrganizationRole, WorkspaceSharing};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, dashboard_files, metric_files_to_dashboard_files, collections, collections_to_assets, chats};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl, OptionalExtension};
use diesel_async::RunQueryDsl;
use middleware::OrganizationMembership;
use uuid::Uuid;
use std::cmp::Ordering;

/// Computes the effective permission level for a user on an asset by taking the maximum
/// of their direct permission and workspace sharing permission.
///
/// # Arguments
/// * `direct_permission` - The user's direct permission on the asset (if any)
/// * `workspace_sharing` - The workspace sharing level for the asset
/// * `organization_id` - UUID of the organization
/// * `organization_role_grants` - User's organization memberships
///
/// # Returns
/// * `Option<AssetPermissionRole>` - The highest permission level available to the user
pub fn compute_effective_permission(
    direct_permission: Option<AssetPermissionRole>,
    workspace_sharing: WorkspaceSharing,
    organization_id: Uuid,
    organization_role_grants: &[OrganizationMembership],
) -> Option<AssetPermissionRole> {
    // First check if the user has WorkspaceAdmin or DataAdmin role for the organization
    for org in organization_role_grants {
        if org.id == organization_id
            && (org.role == UserOrganizationRole::WorkspaceAdmin
                || org.role == UserOrganizationRole::DataAdmin)
        {
            return Some(AssetPermissionRole::Owner);
        }
    }

    // Compute workspace-granted permission
    let workspace_permission = if workspace_sharing != WorkspaceSharing::None {
        // Check if user is member of the organization
        if organization_role_grants.iter().any(|org| org.id == organization_id) {
            match workspace_sharing {
                WorkspaceSharing::CanView => Some(AssetPermissionRole::CanView),
                WorkspaceSharing::CanEdit => Some(AssetPermissionRole::CanEdit),
                WorkspaceSharing::FullAccess => Some(AssetPermissionRole::FullAccess),
                WorkspaceSharing::None => None,
            }
        } else {
            None
        }
    } else {
        None
    };

    // Return the highest permission level
    match (direct_permission, workspace_permission) {
        (Some(direct), Some(workspace)) => {
            // Use the max method to get the higher permission
            Some(direct.max(workspace))
        }
        (Some(direct), None) => Some(direct),
        (None, Some(workspace)) => Some(workspace),
        (None, None) => None,
    }
}

/// Checks if a user has sufficient permissions based on organization roles and asset permissions.
///
/// # Arguments
/// * `current_permission_level` - Optional current permission level of the user for the asset
/// * `required_permission_level` - Required permission level to access the asset
/// * `organization_id` - UUID of the organization
/// * `organization_role_grants` - Array of tuples containing (UUID, UserOrganizationRole) for the user
/// * `workspace_sharing` - Workspace sharing level for the asset
///
/// # Returns
/// * `bool` - True if the user has sufficient permissions, false otherwise
pub fn check_permission_access(
    current_permission_level: Option<AssetPermissionRole>,
    required_permission_level: &[AssetPermissionRole],
    organization_id: Uuid,
    organization_role_grants: &[OrganizationMembership],
    workspace_sharing: WorkspaceSharing,
) -> bool {
    // First check if the user has WorkspaceAdmin or DataAdmin role for the organization
    for org in organization_role_grants {
        if org.id == organization_id
            && (org.role == UserOrganizationRole::WorkspaceAdmin
                || org.role == UserOrganizationRole::DataAdmin)
        {
            return true;
        }
    }

    // Check if user is member of the workspace and asset is shared
    if workspace_sharing != WorkspaceSharing::None {
        for org in organization_role_grants {
            if org.id == organization_id {
                // Map workspace sharing level to permission role
                let workspace_permission = match workspace_sharing {
                    WorkspaceSharing::CanView => AssetPermissionRole::CanView,
                    WorkspaceSharing::CanEdit => AssetPermissionRole::CanEdit,
                    WorkspaceSharing::FullAccess => AssetPermissionRole::FullAccess,
                    WorkspaceSharing::None => unreachable!(),
                };
                
                if required_permission_level.contains(&workspace_permission) {
                    return true;
                }
            }
        }
    }

    // Then check if the user has the required permission level
    if let Some(permission) = current_permission_level {
        if required_permission_level.contains(&permission) {
            return true;
        }
    }

    // If none of the above conditions are met, return false
    false
}

/// Checks if a user has access to a metric through any associated dashboard.
///
/// This function is used to implement permission cascading from dashboards to metrics.
/// If a user has access to any dashboard containing the metric (either through direct permissions,
/// workspace sharing, or if the dashboard is public), they get at least CanView permission.
/// This also checks if the dashboard itself is accessible via collections (transitive cascading).
///
/// # Arguments
/// * `metric_id` - UUID of the metric to check
/// * `user_id` - UUID of the user to check permissions for
/// * `user_orgs` - User's organization memberships
///
/// # Returns
/// * `Result<bool>` - True if the user has access to any dashboard containing the metric, false otherwise
pub async fn check_metric_dashboard_access(
    metric_id: &Uuid,
    user_id: &Uuid,
    user_orgs: &[OrganizationMembership],
) -> Result<bool, diesel::result::Error> {
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new(e.to_string()),
        )
    })?;

    // Get all dashboards containing this metric
    let dashboard_ids: Vec<Uuid> = metric_files_to_dashboard_files::table
        .inner_join(
            dashboard_files::table
                .on(dashboard_files::id.eq(metric_files_to_dashboard_files::dashboard_file_id)),
        )
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .filter(dashboard_files::deleted_at.is_null())
        .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        .select(dashboard_files::id)
        .load::<Uuid>(&mut conn)
        .await?;

    if dashboard_ids.is_empty() {
        return Ok(false);
    }

    // Check multiple access paths concurrently
    let user_id_clone = *user_id;
    let user_orgs_clone = user_orgs.to_vec();
    let dashboard_ids_clone = dashboard_ids.clone();
    
    // 1. Check direct access to dashboards
    let direct_access_future = async move {
        let mut conn = get_pg_pool().get().await.map_err(|e| {
            diesel::result::Error::DatabaseError(
                diesel::result::DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;
        
        let has_direct = asset_permissions::table
            .filter(asset_permissions::asset_id.eq_any(&dashboard_ids_clone))
            .filter(asset_permissions::asset_type.eq(AssetType::DashboardFile))
            .filter(asset_permissions::identity_id.eq(user_id_clone))
            .filter(asset_permissions::identity_type.eq(IdentityType::User))
            .filter(asset_permissions::deleted_at.is_null())
            .select(asset_permissions::asset_id)
            .first::<Uuid>(&mut conn)
            .await
            .optional()?;
            
        Ok::<bool, diesel::result::Error>(has_direct.is_some())
    };

    // 2. Check public access to dashboards
    let dashboard_ids_public = dashboard_ids.clone();
    let public_access_future = async move {
        let mut conn = get_pg_pool().get().await.map_err(|e| {
            diesel::result::Error::DatabaseError(
                diesel::result::DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;
        
        let now = chrono::Utc::now();
        let has_public = dashboard_files::table
            .filter(dashboard_files::id.eq_any(&dashboard_ids_public))
            .filter(dashboard_files::deleted_at.is_null())
            .filter(dashboard_files::publicly_accessible.eq(true))
            .filter(
                dashboard_files::public_expiry_date
                    .is_null()
                    .or(dashboard_files::public_expiry_date.gt(now)),
            )
            .select(dashboard_files::id)
            .first::<Uuid>(&mut conn)
            .await
            .optional()?;
            
        Ok::<bool, diesel::result::Error>(has_public.is_some())
    };

    // 3. Check workspace sharing on dashboards
    let dashboard_ids_ws = dashboard_ids.clone();
    let user_orgs_ws = user_orgs.to_vec();
    let workspace_access_future = async move {
        let mut conn = get_pg_pool().get().await.map_err(|e| {
            diesel::result::Error::DatabaseError(
                diesel::result::DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;
        
        let workspace_dashboards = dashboard_files::table
            .filter(dashboard_files::id.eq_any(&dashboard_ids_ws))
            .filter(dashboard_files::deleted_at.is_null())
            .filter(dashboard_files::workspace_sharing.ne(WorkspaceSharing::None))
            .select((dashboard_files::organization_id, dashboard_files::workspace_sharing))
            .load::<(Uuid, WorkspaceSharing)>(&mut conn)
            .await?;
            
        for (org_id, _) in workspace_dashboards {
            if user_orgs_ws.iter().any(|org| org.id == org_id) {
                return Ok::<bool, diesel::result::Error>(true);
            }
        }
        
        Ok::<bool, diesel::result::Error>(false)
    };

    // 4. Check if dashboards are accessible via collections
    let dashboard_ids_coll = dashboard_ids.clone();
    let user_id_coll = *user_id;
    let user_orgs_coll = user_orgs.to_vec();
    let collection_access_future = async move {
        for dashboard_id in &dashboard_ids_coll {
            if check_dashboard_collection_access(&dashboard_id, &user_id_coll, &user_orgs_coll).await? {
                return Ok::<bool, diesel::result::Error>(true);
            }
        }
        Ok::<bool, diesel::result::Error>(false)
    };

    // Execute all checks concurrently
    let (direct_result, public_result, workspace_result, collection_result) = tokio::join!(
        direct_access_future,
        public_access_future,
        workspace_access_future,
        collection_access_future
    );

    // Return true if any check succeeds
    Ok(direct_result? || public_result? || workspace_result? || collection_result?)
}

/// Checks if a user has access to a metric through any associated chat.
///
/// This function is used to implement permission cascading from chats to metrics.
/// If a user has access to any chat containing the metric (either through direct permissions,
/// workspace sharing, or if the chat is public), they get at least CanView permission.
///
/// # Arguments
/// * `metric_id` - UUID of the metric to check
/// * `user_id` - UUID of the user to check permissions for
/// * `user_orgs` - User's organization memberships
///
/// # Returns
/// * `Result<bool>` - True if the user has access to any chat containing the metric, false otherwise
pub async fn check_metric_chat_access(
    metric_id: &Uuid,
    user_id: &Uuid,
    user_orgs: &[OrganizationMembership],
) -> Result<bool, diesel::result::Error> {
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new(e.to_string()),
        )
    })?;

    // Check if user has access to any chat containing this metric
    let has_chat_access = database::schema::messages_to_files::table
        .inner_join(
            database::schema::messages::table
                .on(database::schema::messages::id.eq(database::schema::messages_to_files::message_id)),
        )
        .inner_join(
            database::schema::chats::table
                .on(database::schema::chats::id.eq(database::schema::messages::chat_id)),
        )
        .inner_join(
            asset_permissions::table.on(
                asset_permissions::asset_id.eq(database::schema::chats::id)
                    .and(asset_permissions::asset_type.eq(AssetType::Chat))
                    .and(asset_permissions::identity_id.eq(user_id))
                    .and(asset_permissions::identity_type.eq(IdentityType::User))
                    .and(asset_permissions::deleted_at.is_null())
            ),
        )
        .filter(database::schema::messages_to_files::file_id.eq(metric_id))
        .filter(database::schema::messages_to_files::deleted_at.is_null())
        .filter(database::schema::messages::deleted_at.is_null())
        .filter(database::schema::chats::deleted_at.is_null())
        .select(database::schema::chats::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    if has_chat_access.is_some() {
        return Ok(true);
    }

    // Now check if metric belongs to any PUBLIC chat
    let now = chrono::Utc::now();
    let has_public_chat_access = database::schema::messages_to_files::table
        .inner_join(
            database::schema::messages::table
                .on(database::schema::messages::id.eq(database::schema::messages_to_files::message_id)),
        )
        .inner_join(
            database::schema::chats::table
                .on(database::schema::chats::id.eq(database::schema::messages::chat_id)),
        )
        .filter(database::schema::messages_to_files::file_id.eq(metric_id))
        .filter(database::schema::messages_to_files::deleted_at.is_null())
        .filter(database::schema::messages::deleted_at.is_null())
        .filter(database::schema::chats::deleted_at.is_null())
        .filter(database::schema::chats::publicly_accessible.eq(true))
        .filter(
            database::schema::chats::public_expiry_date
                .is_null()
                .or(database::schema::chats::public_expiry_date.gt(now)),
        )
        .select(database::schema::chats::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    if has_public_chat_access.is_some() {
        return Ok(true);
    }

    // Check if metric belongs to any workspace-shared chat
    let workspace_shared_chat = database::schema::messages_to_files::table
        .inner_join(
            database::schema::messages::table
                .on(database::schema::messages::id.eq(database::schema::messages_to_files::message_id)),
        )
        .inner_join(
            database::schema::chats::table
                .on(database::schema::chats::id.eq(database::schema::messages::chat_id)),
        )
        .filter(database::schema::messages_to_files::file_id.eq(metric_id))
        .filter(database::schema::messages_to_files::deleted_at.is_null())
        .filter(database::schema::messages::deleted_at.is_null())
        .filter(database::schema::chats::deleted_at.is_null())
        .filter(database::schema::chats::workspace_sharing.ne(WorkspaceSharing::None))
        .select((database::schema::chats::organization_id, database::schema::chats::workspace_sharing))
        .first::<(Uuid, WorkspaceSharing)>(&mut conn)
        .await
        .optional()?;

    if let Some((org_id, _sharing_level)) = workspace_shared_chat {
        // Check if user is member of that organization
        if user_orgs.iter().any(|org| org.id == org_id) {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Checks if a user has access to a dashboard through any associated chat.
///
/// This function is used to implement permission cascading from chats to dashboards.
/// If a user has access to any chat containing the dashboard (either through direct permissions,
/// workspace sharing, or if the chat is public), they get at least CanView permission.
///
/// # Arguments
/// * `dashboard_id` - UUID of the dashboard to check
/// * `user_id` - UUID of the user to check permissions for
/// * `user_orgs` - User's organization memberships
///
/// # Returns
/// * `Result<bool>` - True if the user has access to any chat containing the dashboard, false otherwise
pub async fn check_dashboard_chat_access(
    dashboard_id: &Uuid,
    user_id: &Uuid,
    user_orgs: &[OrganizationMembership],
) -> Result<bool, diesel::result::Error> {
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new(e.to_string()),
        )
    })?;

    // Check if user has access to any chat containing this dashboard
    let has_chat_access = database::schema::messages_to_files::table
        .inner_join(
            database::schema::messages::table
                .on(database::schema::messages::id.eq(database::schema::messages_to_files::message_id)),
        )
        .inner_join(
            database::schema::chats::table
                .on(database::schema::chats::id.eq(database::schema::messages::chat_id)),
        )
        .inner_join(
            asset_permissions::table.on(
                asset_permissions::asset_id.eq(database::schema::chats::id)
                    .and(asset_permissions::asset_type.eq(AssetType::Chat))
                    .and(asset_permissions::identity_id.eq(user_id))
                    .and(asset_permissions::identity_type.eq(IdentityType::User))
                    .and(asset_permissions::deleted_at.is_null())
            ),
        )
        .filter(database::schema::messages_to_files::file_id.eq(dashboard_id))
        .filter(database::schema::messages_to_files::deleted_at.is_null())
        .filter(database::schema::messages::deleted_at.is_null())
        .filter(database::schema::chats::deleted_at.is_null())
        .select(database::schema::chats::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    if has_chat_access.is_some() {
        return Ok(true);
    }

    // Now check if dashboard belongs to any PUBLIC chat
    let now = chrono::Utc::now();
    let has_public_chat_access = database::schema::messages_to_files::table
        .inner_join(
            database::schema::messages::table
                .on(database::schema::messages::id.eq(database::schema::messages_to_files::message_id)),
        )
        .inner_join(
            database::schema::chats::table
                .on(database::schema::chats::id.eq(database::schema::messages::chat_id)),
        )
        .filter(database::schema::messages_to_files::file_id.eq(dashboard_id))
        .filter(database::schema::messages_to_files::deleted_at.is_null())
        .filter(database::schema::messages::deleted_at.is_null())
        .filter(database::schema::chats::deleted_at.is_null())
        .filter(database::schema::chats::publicly_accessible.eq(true))
        .filter(
            database::schema::chats::public_expiry_date
                .is_null()
                .or(database::schema::chats::public_expiry_date.gt(now)),
        )
        .select(database::schema::chats::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    if has_public_chat_access.is_some() {
        return Ok(true);
    }

    // Check if dashboard belongs to any workspace-shared chat
    let workspace_shared_chat = database::schema::messages_to_files::table
        .inner_join(
            database::schema::messages::table
                .on(database::schema::messages::id.eq(database::schema::messages_to_files::message_id)),
        )
        .inner_join(
            database::schema::chats::table
                .on(database::schema::chats::id.eq(database::schema::messages::chat_id)),
        )
        .filter(database::schema::messages_to_files::file_id.eq(dashboard_id))
        .filter(database::schema::messages_to_files::deleted_at.is_null())
        .filter(database::schema::messages::deleted_at.is_null())
        .filter(database::schema::chats::deleted_at.is_null())
        .filter(database::schema::chats::workspace_sharing.ne(WorkspaceSharing::None))
        .select((database::schema::chats::organization_id, database::schema::chats::workspace_sharing))
        .first::<(Uuid, WorkspaceSharing)>(&mut conn)
        .await
        .optional()?;

    if let Some((org_id, _sharing_level)) = workspace_shared_chat {
        // Check if user is member of that organization
        if user_orgs.iter().any(|org| org.id == org_id) {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Checks if a user has access to a metric through any associated collection.
///
/// This function is used to implement permission cascading from collections to metrics.
/// If a user has access to any collection containing the metric (either through direct permissions,
/// workspace sharing, or if the collection is public), they get at least CanView permission.
///
/// # Arguments
/// * `metric_id` - UUID of the metric to check
/// * `user_id` - UUID of the user to check permissions for
/// * `user_orgs` - User's organization memberships
///
/// # Returns
/// * `Result<bool>` - True if the user has access to any collection containing the metric, false otherwise
pub async fn check_metric_collection_access(
    metric_id: &Uuid,
    user_id: &Uuid,
    user_orgs: &[OrganizationMembership],
) -> Result<bool, diesel::result::Error> {
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new(e.to_string()),
        )
    })?;

    // First check if user has direct access to any collection containing this metric
    let has_direct_access = collections_to_assets::table
        .inner_join(
            collections::table
                .on(collections::id.eq(collections_to_assets::collection_id)),
        )
        .inner_join(
            asset_permissions::table.on(
                asset_permissions::asset_id.eq(collections::id)
                    .and(asset_permissions::asset_type.eq(AssetType::Collection))
                    .and(asset_permissions::identity_id.eq(user_id))
                    .and(asset_permissions::identity_type.eq(IdentityType::User))
                    .and(asset_permissions::deleted_at.is_null())
            ),
        )
        .filter(collections_to_assets::asset_id.eq(metric_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .select(collections::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    if has_direct_access.is_some() {
        return Ok(true);
    }

    // Note: Collections don't have publicly_accessible fields, only workspace_sharing

    // Check if metric belongs to any workspace-shared collection
    let workspace_shared_collection = collections_to_assets::table
        .inner_join(
            collections::table
                .on(collections::id.eq(collections_to_assets::collection_id)),
        )
        .filter(collections_to_assets::asset_id.eq(metric_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .filter(collections::workspace_sharing.ne(WorkspaceSharing::None))
        .select((collections::organization_id, collections::workspace_sharing))
        .first::<(Uuid, WorkspaceSharing)>(&mut conn)
        .await
        .optional()?;

    if let Some((org_id, _sharing_level)) = workspace_shared_collection {
        // Check if user is member of that organization
        if user_orgs.iter().any(|org| org.id == org_id) {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Checks if a user has access to a dashboard through any associated collection.
///
/// This function is used to implement permission cascading from collections to dashboards.
/// If a user has access to any collection containing the dashboard (either through direct permissions,
/// workspace sharing, or if the collection is public), they get at least CanView permission.
///
/// # Arguments
/// * `dashboard_id` - UUID of the dashboard to check
/// * `user_id` - UUID of the user to check permissions for
/// * `user_orgs` - User's organization memberships
///
/// # Returns
/// * `Result<bool>` - True if the user has access to any collection containing the dashboard, false otherwise
pub async fn check_dashboard_collection_access(
    dashboard_id: &Uuid,
    user_id: &Uuid,
    user_orgs: &[OrganizationMembership],
) -> Result<bool, diesel::result::Error> {
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new(e.to_string()),
        )
    })?;

    // First check if user has direct access to any collection containing this dashboard
    let has_direct_access = collections_to_assets::table
        .inner_join(
            collections::table
                .on(collections::id.eq(collections_to_assets::collection_id)),
        )
        .inner_join(
            asset_permissions::table.on(
                asset_permissions::asset_id.eq(collections::id)
                    .and(asset_permissions::asset_type.eq(AssetType::Collection))
                    .and(asset_permissions::identity_id.eq(user_id))
                    .and(asset_permissions::identity_type.eq(IdentityType::User))
                    .and(asset_permissions::deleted_at.is_null())
            ),
        )
        .filter(collections_to_assets::asset_id.eq(dashboard_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .select(collections::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    if has_direct_access.is_some() {
        return Ok(true);
    }

    // Note: Collections don't have publicly_accessible fields, only workspace_sharing

    // Check if dashboard belongs to any workspace-shared collection
    let workspace_shared_collection = collections_to_assets::table
        .inner_join(
            collections::table
                .on(collections::id.eq(collections_to_assets::collection_id)),
        )
        .filter(collections_to_assets::asset_id.eq(dashboard_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .filter(collections::workspace_sharing.ne(WorkspaceSharing::None))
        .select((collections::organization_id, collections::workspace_sharing))
        .first::<(Uuid, WorkspaceSharing)>(&mut conn)
        .await
        .optional()?;

    if let Some((org_id, _sharing_level)) = workspace_shared_collection {
        // Check if user is member of that organization
        if user_orgs.iter().any(|org| org.id == org_id) {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Checks if a user has access to a chat through any associated collection.
///
/// This function is used to implement permission cascading from collections to chats.
/// If a user has access to any collection containing the chat (either through direct permissions
/// or workspace sharing), they get at least CanView permission.
///
/// # Arguments
/// * `chat_id` - UUID of the chat to check
/// * `user_id` - UUID of the user to check permissions for
/// * `user_orgs` - User's organization memberships
///
/// # Returns
/// * `Result<bool>` - True if the user has access to any collection containing the chat, false otherwise
pub async fn check_chat_collection_access(
    chat_id: &Uuid,
    user_id: &Uuid,
    user_orgs: &[OrganizationMembership],
) -> Result<bool, diesel::result::Error> {
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new(e.to_string()),
        )
    })?;

    // First check if user has direct access to any collection containing this chat
    let has_direct_access = collections_to_assets::table
        .inner_join(
            collections::table
                .on(collections::id.eq(collections_to_assets::collection_id)),
        )
        .inner_join(
            asset_permissions::table.on(
                asset_permissions::asset_id.eq(collections::id)
                    .and(asset_permissions::asset_type.eq(AssetType::Collection))
                    .and(asset_permissions::identity_id.eq(user_id))
                    .and(asset_permissions::identity_type.eq(IdentityType::User))
                    .and(asset_permissions::deleted_at.is_null())
            ),
        )
        .filter(collections_to_assets::asset_id.eq(chat_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::Chat))
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .select(collections::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    if has_direct_access.is_some() {
        return Ok(true);
    }

    // Check if chat belongs to any workspace-shared collection
    let workspace_shared_collection = collections_to_assets::table
        .inner_join(
            collections::table
                .on(collections::id.eq(collections_to_assets::collection_id)),
        )
        .filter(collections_to_assets::asset_id.eq(chat_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::Chat))
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .filter(collections::workspace_sharing.ne(WorkspaceSharing::None))
        .select((collections::organization_id, collections::workspace_sharing))
        .first::<(Uuid, WorkspaceSharing)>(&mut conn)
        .await
        .optional()?;

    if let Some((org_id, _sharing_level)) = workspace_shared_collection {
        // Check if user is member of that organization
        if user_orgs.iter().any(|org| org.id == org_id) {
            return Ok(true);
        }
    }

    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_workspace_admin_access() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::WorkspaceAdmin
        }];

        assert!(check_permission_access(
            None,
            &[AssetPermissionRole::Owner],
            org_id,
            &grants,
            WorkspaceSharing::None
        ));
    }

    #[test]
    fn test_data_admin_access() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::DataAdmin
        }];

        assert!(check_permission_access(
            None,
            &[AssetPermissionRole::Owner],
            org_id,
            &grants,
            WorkspaceSharing::None
        ));
    }

    #[test]
    fn test_matching_permission_level() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(check_permission_access(
            Some(AssetPermissionRole::CanEdit),
            &[AssetPermissionRole::CanEdit],
            org_id,
            &grants,
            WorkspaceSharing::None
        ));
    }

    #[test]
    fn test_insufficient_permissions() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(!check_permission_access(
            Some(AssetPermissionRole::CanView),
            &[AssetPermissionRole::CanEdit],
            org_id,
            &grants,
            WorkspaceSharing::None
        ));
    }

    #[test]
    fn test_no_permissions() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(!check_permission_access(
            None,
            &[AssetPermissionRole::CanView],
            org_id,
            &grants,
            WorkspaceSharing::None
        ));
    }
}
