use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::chats,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::{
    check_asset_permission::has_permission, remove_asset_permissions::remove_share_by_email,
};
use tracing::{error, info};
use uuid::Uuid;

/// Handler for deleting sharing permissions for a specific chat
pub async fn delete_chat_sharing_handler(
    chat_id: &Uuid,
    user_id: &Uuid,
    emails: Vec<String>,
) -> Result<()> {
    info!(
        chat_id = %chat_id,
        user_id = %user_id,
        email_count = emails.len(),
        "Deleting chat sharing permissions"
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
        error!(chat_id = %chat_id, "Chat not found");
        return Err(anyhow!("Chat not found"));
    }

    // 2. Check if user has permission to delete sharing (Owner or FullAccess)
    let has_permission = has_permission(
        *chat_id,
        AssetType::Chat,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    )
    .await
    .map_err(|e| {
        error!(
            chat_id = %chat_id,
            user_id = %user_id,
            "Error checking chat permissions: {}", e
        );
        anyhow!("Error checking chat permissions: {}", e)
    })?;

    if !has_permission {
        error!(
            chat_id = %chat_id,
            user_id = %user_id,
            "User does not have permission to delete sharing for this chat"
        );
        return Err(anyhow!(
            "User does not have permission to delete sharing for this chat"
        ));
    }

    // 3. Process each email and delete sharing permissions
    for email in &emails {
        // Validate email format
        if !email.contains('@') {
            error!(email = %email, "Invalid email format");
            return Err(anyhow!("Invalid email format: {}", email));
        }

        match remove_share_by_email(email, *chat_id, AssetType::Chat, *user_id).await {
            Ok(_) => {
                info!(
                    chat_id = %chat_id,
                    email = %email,
                    "Deleted sharing permission"
                );
            }
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    info!(
                        chat_id = %chat_id,
                        email = %email,
                        "No active permission found to delete"
                    );
                    continue;
                }

                error!(
                    chat_id = %chat_id,
                    email = %email,
                    "Failed to delete sharing: {}", e
                );
                return Err(anyhow!(
                    "Failed to delete sharing for email {}: {}",
                    email,
                    e
                ));
            }
        }
    }

    info!(
        chat_id = %chat_id,
        email_count = emails.len(),
        "Successfully deleted chat sharing permissions"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;
    
    // Basic placeholder test
    #[tokio::test]
    async fn test_delete_chat_sharing_handler_invalid_email() {
        // This is a simple placeholder test - would be replaced with actual mocked tests in real implementation
        // Invalid email format test doesn't require mocking database or other functions
        let chat_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let emails = vec!["invalid-email".to_string()];

        let result = delete_chat_sharing_handler(&chat_id, &user_id, emails).await;
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Invalid email format"));
    }
}
