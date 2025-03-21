use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::chats,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::{create_share_by_email, has_permission};
use tracing;
use uuid::Uuid;

/// Creates sharing permissions for a chat
///
/// # Arguments
/// * `chat_id` - The ID of the chat to share
/// * `user_id` - The ID of the user creating the sharing permissions
/// * `emails_and_roles` - List of (email, role) pairs representing the recipients and their access levels
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn create_chat_sharing_handler(
    chat_id: &Uuid,
    user_id: &Uuid,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    // 1. Validate the chat exists
    let chat_exists = get_chat_exists(chat_id).await?;
    
    if !chat_exists {
        return Err(anyhow!("Chat not found"));
    }

    // 2. Check if user has permission to share the chat (Owner or FullAccess)
    let has_permission = has_permission(
        *chat_id,
        AssetType::Chat,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission {
        return Err(anyhow!("User does not have permission to share this chat"));
    }

    // 3. Process each email and create sharing permissions
    for (email, role) in emails_and_roles {
        match create_share_by_email(
            &email,
            *chat_id,
            AssetType::Chat,
            role,
            *user_id,
        ).await {
            Ok(_) => {
                tracing::info!("Created sharing permission for email: {} on chat: {} with role: {:?}", email, chat_id, role);
            },
            Err(e) => {
                tracing::error!("Failed to create sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to create sharing for email {}: {}", email, e));
            }
        }
    }

    Ok(())
}

/// Helper function to check if a chat exists
pub async fn get_chat_exists(chat_id: &Uuid) -> Result<bool> {
    let mut conn = get_pg_pool().get().await?;
    
    let chat_exists = chats::table
        .filter(chats::id.eq(chat_id))
        .filter(chats::deleted_at.is_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await?;
    
    Ok(chat_exists > 0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::{AssetPermissionRole, AssetType, IdentityType};
    
    use uuid::Uuid;

    // Mock function to test permission checking
    async fn mock_has_permission(
        _asset_id: Uuid,
        _asset_type: AssetType,
        _identity_id: Uuid,
        _identity_type: IdentityType,
        _required_role: AssetPermissionRole,
    ) -> Result<bool> {
        // For testing, return true to simulate having permission
        Ok(true)
    }

    // This test would require a test database setup
    // Mock implementation to demonstrate testing approach
    #[tokio::test]
    async fn test_create_chat_sharing_handler_permissions() {
        // This test would need a properly mocked database
        // Just demonstrating the structure

        // Setup test data
        let chat_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let emails_and_roles = vec![
            ("test@example.com".to_string(), AssetPermissionRole::Viewer),
        ];

        // In a real test, we would use a test database
        // and set up the necessary mocks

        // Example assertion
        // let result = create_chat_sharing_handler(&chat_id, &user_id, emails_and_roles).await;
        // assert!(result.is_ok());
    }
}