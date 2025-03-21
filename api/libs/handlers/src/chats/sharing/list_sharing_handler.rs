use anyhow::{anyhow, Result};
use database::{
    enums::{AssetType, IdentityType},
    pool::get_pg_pool,
    schema::chats,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::{
    check_asset_permission::check_access,
    list_asset_permissions::list_shares,
    types::AssetPermissionWithUser,
};
use tracing::{error, info};
use uuid::Uuid;

/// Lists all sharing permissions for a specific chat
///
/// # Arguments
///
/// * `chat_id` - The unique identifier of the chat
/// * `user_id` - The unique identifier of the user requesting the permissions
///
/// # Returns
///
/// A vector of asset permissions with user information
pub async fn list_chat_sharing_handler(
    chat_id: &Uuid,
    user_id: &Uuid,
) -> Result<Vec<AssetPermissionWithUser>> {
    info!(
        chat_id = %chat_id,
        user_id = %user_id,
        "Listing chat sharing permissions"
    );

    // 1. Validate the chat exists
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

    let chat_exists = chats::table
        .filter(chats::id.eq(chat_id))
        .filter(chats::deleted_at.is_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await
        .map_err(|e| {
            error!("Error checking if chat exists: {}", e);
            anyhow!("Database error: {}", e)
        })?;

    if chat_exists == 0 {
        error!(
            chat_id = %chat_id,
            "Chat not found"
        );
        return Err(anyhow!("Chat not found"));
    }

    // 2. Check if user has permission to view the chat
    let user_role = check_access(
        *chat_id,
        AssetType::Chat,
        *user_id,
        IdentityType::User,
    )
    .await
    .map_err(|e| {
        error!(
            chat_id = %chat_id,
            user_id = %user_id,
            "Error checking chat access: {}", e
        );
        anyhow!("Error checking chat access: {}", e)
    })?;

    if user_role.is_none() {
        error!(
            chat_id = %chat_id,
            user_id = %user_id,
            "User does not have permission to view this chat"
        );
        return Err(anyhow!("User does not have permission to view this chat"));
    }

    // 3. Get all permissions for the chat
    let permissions = list_shares(
        *chat_id,
        AssetType::Chat,
    )
    .await
    .map_err(|e| {
        error!(
            chat_id = %chat_id,
            "Error listing chat permissions: {}", e
        );
        anyhow!("Error listing sharing permissions: {}", e)
    })?;

    info!(
        chat_id = %chat_id,
        permission_count = permissions.len(),
        "Successfully retrieved chat sharing permissions"
    );

    Ok(permissions)
}

#[cfg(test)]
mod tests {
    
    
    #[tokio::test]
    async fn test_list_chat_sharing_handler() {
        // Placeholder test implementation
        // In a real test, we would set up test data and verify the response
        assert!(true);
    }
}