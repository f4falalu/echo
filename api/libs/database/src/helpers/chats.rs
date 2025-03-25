use crate::enums::{AssetPermissionRole, AssetType};
use anyhow::Result;
use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl, Queryable};
use diesel::{JoinOnDsl, NullableExpressionMethods};
use diesel_async::RunQueryDsl;
use tokio::try_join;
use uuid::Uuid;

use crate::models::{AssetPermission, Chat};
use crate::pool::get_pg_pool;
use crate::schema::{asset_permissions, chats};

/// Fetches a single chat by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the chat to fetch
///
/// # Returns
/// * `Result<Option<Chat>>` - The chat if found and not deleted
pub async fn fetch_chat(id: &Uuid) -> Result<Option<Chat>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match chats::table
        .filter(chats::id.eq(id))
        .filter(chats::deleted_at.is_null())
        .first::<Chat>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to fetch a chat by ID
async fn fetch_chat_helper(id: &Uuid) -> Result<Option<Chat>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match chats::table
        .filter(chats::id.eq(id))
        .filter(chats::deleted_at.is_null())
        .first::<Chat>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to fetch permission for a chat
async fn fetch_chat_permission(id: &Uuid, user_id: &Uuid) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    let permission = match asset_permissions::table
        .filter(asset_permissions::asset_id.eq(id))
        .filter(asset_permissions::asset_type.eq(AssetType::Chat))
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .first::<AssetPermission>(&mut conn)
        .await
    {
        Ok(result) => Some(result.role),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(permission)
}

#[derive(Queryable)]
pub struct ChatWithPermission {
    pub chat: Chat,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_chat_with_permission(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<ChatWithPermission>> {
    // Run both queries concurrently
    let (chat, permission) = try_join!(fetch_chat_helper(id), fetch_chat_permission(id, user_id))?;

    // If the chat doesn't exist, return None
    let chat = match chat {
        Some(c) => c,
        None => return Ok(None),
    };

    Ok(Some(ChatWithPermission { chat, permission }))
}

/// Fetches multiple chats with their permissions in a single operation
///
/// # Arguments
/// * `ids` - Vector of UUIDs of the chats to fetch
/// * `user_id` - UUID of the user making the request
///
/// # Returns
/// * `Result<Vec<ChatWithPermission>>` - The chats with their permissions
pub async fn fetch_chats_with_permissions(
    ids: &[Uuid],
    user_id: &Uuid,
) -> Result<Vec<ChatWithPermission>> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }

    let mut conn = get_pg_pool().get().await?;

    // Use a LEFT JOIN to fetch chats and their permissions in a single query
    let results = chats::table
        .left_join(
            asset_permissions::table.on(asset_permissions::asset_id
                .eq(chats::id)
                .and(asset_permissions::asset_type.eq(AssetType::Chat))
                .and(asset_permissions::identity_id.eq(user_id))
                .and(asset_permissions::deleted_at.is_null())),
        )
        .filter(chats::id.eq_any(ids))
        .filter(chats::deleted_at.is_null())
        .select((chats::all_columns, asset_permissions::role.nullable()))
        .load::<(Chat, Option<AssetPermissionRole>)>(&mut conn)
        .await?;

    if results.is_empty() {
        return Ok(Vec::new());
    }

    // Create ChatWithPermission objects
    let result = results
        .into_iter()
        .map(|(chat, permission)| ChatWithPermission { chat, permission })
        .collect();

    Ok(result)
}
