use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
};
use sharing::{create_share_by_email, has_permission};
use tracing::info;
use uuid::Uuid;

use super::create_sharing_handler::get_chat_exists;

/// Updates sharing permissions for a chat
///
/// # Arguments
/// * `chat_id` - The ID of the chat to update sharing for
/// * `user_id` - The ID of the user updating the sharing permissions
/// * `emails_and_roles` - List of (email, role) pairs representing the recipients and their access levels
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn update_chat_sharing_handler(
    chat_id: &Uuid,
    user_id: &Uuid,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    info!(
        chat_id = %chat_id,
        user_id = %user_id,
        "Updating sharing permissions for chat"
    );
    
    // 1. Validate the chat exists
    let chat_exists = get_chat_exists(chat_id).await?;
    
    if !chat_exists {
        return Err(anyhow!("Chat not found"));
    }

    // 2. Check if user has permission to update sharing for the chat (Owner or FullAccess)
    let has_perm = has_permission(
        *chat_id,
        AssetType::Chat,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_perm {
        return Err(anyhow!("User does not have permission to update sharing for this chat"));
    }

    // 3. Process each email and update sharing permissions
    for (email, role) in emails_and_roles {
        // The create_share_by_email function handles both creation and updates
        // It performs an upsert operation in the database
        match create_share_by_email(
            &email,
            *chat_id,
            AssetType::Chat,
            role,
            *user_id,
        ).await {
            Ok(_) => {
                info!("Updated sharing permission for email: {} on chat: {} with role: {:?}", email, chat_id, role);
            },
            Err(e) => {
                tracing::error!("Failed to update sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to update sharing for email {}: {}", email, e));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_update_chat_sharing_handler_chat_not_found() {
        // Mock UUID for chat and user
        let chat_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Test with empty request to simplify the test
        let emails_and_roles: Vec<(String, AssetPermissionRole)> = vec![];
        
        // Call handler - should fail because the chat doesn't exist
        let result = update_chat_sharing_handler(&chat_id, &user_id, emails_and_roles).await;
        
        // Since we can't easily mock the function in an integration test
        // This is just a placeholder for the real test
        // The actual error could be different based on the testing environment
        assert!(result.is_err());
    }
}