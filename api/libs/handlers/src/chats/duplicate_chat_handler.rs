use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::chats::get_chat_handler::get_chat_handler;
use crate::chats::types::ChatWithMessages;
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::helpers::chats::fetch_chat_with_permission;
use database::models::{AssetPermission, Chat, Message, MessageToFile};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, chats, messages, messages_to_files};
use sharing::check_permission_access;

/// Handler function to duplicate an existing chat
///
/// # Arguments
/// * `chat_id` - UUID of the source chat to duplicate
/// * `message_id` - Optional UUID of a message in the chat; if provided, only messages created at or after this message will be duplicated
/// * `user` - The authenticated user making the request
///
/// # Returns
/// * `Result<ChatWithMessages>` - The newly created chat with all duplicated messages
pub async fn duplicate_chat_handler(
    chat_id: &Uuid,
    message_id: Option<&Uuid>,
    user: &AuthenticatedUser,
) -> Result<ChatWithMessages> {
    // First check if the user has permission to view the source chat
    let chat_with_permission = fetch_chat_with_permission(chat_id, &user.id).await?;

    // If chat not found, return error
    let chat_with_permission = match chat_with_permission {
        Some(cwp) => cwp,
        None => return Err(anyhow!("Chat not found")),
    };

    // Check if user has permission to view the chat
    // Users need at least CanView permission or any higher permission
    let has_permission = check_permission_access(
        chat_with_permission.permission,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        chat_with_permission.chat.organization_id,
        &user.organizations,
    );

    // If user is the creator, they automatically have access
    let is_creator = chat_with_permission.chat.created_by == user.id;

    if !has_permission && !is_creator {
        return Err(anyhow!("You don't have permission to view this chat"));
    }

    let mut conn = get_pg_pool().get().await?;

    // 1. Create a new chat record
    let source_chat = chat_with_permission.chat;
    let new_chat_id = Uuid::new_v4();
    let now = Utc::now();

    // Append (Copy) to the title
    let new_title = format!("{} (Copy)", source_chat.title);

    let new_chat = Chat {
        id: new_chat_id,
        title: new_title,
        organization_id: source_chat.organization_id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
        publicly_accessible: false, // Start with private access
        publicly_enabled_by: None,
        public_expiry_date: None,
        most_recent_file_id: source_chat.most_recent_file_id,
        most_recent_file_type: source_chat.most_recent_file_type.clone(),
    };

    // Insert the new chat record
    diesel::insert_into(chats::table)
        .values(&new_chat)
        .execute(&mut conn)
        .await?;

    // 2. Set permissions for the new chat (owner for the current user)
    let new_permission = AssetPermission {
        identity_id: user.id,
        identity_type: IdentityType::User,
        asset_id: new_chat_id,
        asset_type: AssetType::Chat,
        role: AssetPermissionRole::Owner,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
    };

    diesel::insert_into(asset_permissions::table)
        .values(&new_permission)
        .execute(&mut conn)
        .await?;

    // 3. Determine which messages to duplicate based on message_id parameter
    let messages_to_duplicate = match message_id {
        Some(msg_id) => {
            // Get the specific message and check if it belongs to the chat
            let message = messages::table
                .filter(messages::id.eq(msg_id))
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .first::<Message>(&mut conn)
                .await?;

            // Get this message and all older messages (messages created at or before this message)
            messages::table
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .filter(messages::created_at.le(message.created_at))
                .order_by(messages::created_at.asc())
                .load::<Message>(&mut conn)
                .await?
        }
        None => {
            // Get all non-deleted messages from the chat
            messages::table
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .order_by(messages::created_at.asc())
                .load::<Message>(&mut conn)
                .await?
        }
    };

    // 4. Duplicate each message
    for source_message in messages_to_duplicate {
        let new_message_id = Uuid::new_v4();

        // Create a new message record
        let new_message = Message {
            id: new_message_id,
            request_message: source_message.request_message.clone(),
            response_messages: source_message.response_messages.clone(),
            reasoning: source_message.reasoning.clone(),
            title: source_message.title.clone(),
            raw_llm_messages: source_message.raw_llm_messages.clone(),
            final_reasoning_message: source_message.final_reasoning_message.clone(),
            chat_id: new_chat_id,
            created_at: source_message.created_at,
            updated_at: source_message.updated_at,
            deleted_at: None,
            created_by: user.id,
            feedback: source_message.feedback.clone(),
        };

        // Insert the new message record
        diesel::insert_into(messages::table)
            .values(&new_message)
            .execute(&mut conn)
            .await?;

        // 5. Duplicate associated file references with is_duplicate flag
        let file_references = messages_to_files::table
            .filter(messages_to_files::message_id.eq(source_message.id))
            .filter(messages_to_files::deleted_at.is_null())
            .load::<MessageToFile>(&mut conn)
            .await?;

        for file_ref in file_references {
            let new_file_ref = MessageToFile {
                id: Uuid::new_v4(),
                message_id: new_message_id,
                file_id: file_ref.file_id,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                is_duplicate: true, // Mark as duplicate
            };

            diesel::insert_into(messages_to_files::table)
                .values(&new_file_ref)
                .execute(&mut conn)
                .await?;
        }
    }

    // 6. Return the new chat with all messages
    get_chat_handler(&new_chat_id, user, false).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use database::{
        models::{MessageToFile, User},
        pool::get_pg_pool,
        schema::{messages_to_files, users},
    };
    use diesel::insert_into;
    use diesel::prelude::*;
    use diesel_async::RunQueryDsl;
    use serde_json::{json};
    use uuid::Uuid;

    async fn setup_test_user() -> AuthenticatedUser {
        use database::enums::{UserOrganizationRole};
        use middleware::types::{OrganizationMembership};

        let user_id = Uuid::new_v4();
        let now = Utc::now();

        let user = User {
            id: user_id,
            name: Some("Test User".to_string()),
            email: "test@example.com".to_string(),
            config: json!({}),
            created_at: now,
            updated_at: now,
            attributes: json!({}),
            avatar_url: None,
        };

        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(users::table)
            .values(&user)
            .execute(&mut conn)
            .await
            .unwrap();

        // Create organization memberships
        let organizations = vec![OrganizationMembership {
            id: Uuid::new_v4(),
            role: UserOrganizationRole::Owner,
        }];

        // Create team memberships
        let teams = vec![];

        AuthenticatedUser {
            id: user_id,
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            config: json!({}),
            created_at: now,
            updated_at: now,
            attributes: json!({}),
            avatar_url: None,
            organizations,
            teams,
        }
    }

    async fn setup_test_chat(user: &AuthenticatedUser) -> (Uuid, Vec<Uuid>) {
        let chat_id = Uuid::new_v4();
        let now = Utc::now();

        // Create chat record
        let chat = Chat {
            id: chat_id,
            title: "Test Chat".to_string(),
            organization_id: *user.organizations.keys().next().unwrap(),
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by: user.id,
            updated_by: user.id,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            most_recent_file_id: None,
            most_recent_file_type: None,
        };

        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(chats::table)
            .values(&chat)
            .execute(&mut conn)
            .await
            .unwrap();

        // Create permission for user
        let permission = AssetPermission {
            identity_id: user.id,
            identity_type: IdentityType::User,
            asset_id: chat_id,
            asset_type: AssetType::Chat,
            role: AssetPermissionRole::Owner,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by: user.id,
            updated_by: user.id,
        };

        insert_into(asset_permissions::table)
            .values(&permission)
            .execute(&mut conn)
            .await
            .unwrap();

        // Create test messages
        let message_ids = vec![Uuid::new_v4(), Uuid::new_v4(), Uuid::new_v4()];

        for (i, message_id) in message_ids.iter().enumerate() {
            let message = Message {
                id: *message_id,
                request_message: Some(format!("Test message {}", i + 1)),
                response_messages: json!([{"id": format!("resp_{}", i), "type": "text", "message": format!("Response {}", i + 1)}]),
                reasoning: json!([{"id": format!("reason_{}", i), "type": "text", "message": format!("Reasoning {}", i + 1)}]),
                title: format!("Message {}", i + 1),
                raw_llm_messages: json!([]),
                final_reasoning_message: Some(format!("Final reasoning {}", i + 1)),
                chat_id,
                created_at: now + chrono::Duration::seconds(i as i64 * 10),
                updated_at: now + chrono::Duration::seconds(i as i64 * 10),
                deleted_at: None,
                created_by: user.id,
                feedback: None,
            };

            insert_into(messages::table)
                .values(&message)
                .execute(&mut conn)
                .await
                .unwrap();
        }

        (chat_id, message_ids)
    }

    async fn setup_test_file_reference(message_id: &Uuid, user_id: &Uuid) -> Uuid {
        let file_id = Uuid::new_v4();
        let now = Utc::now();

        let file_ref = MessageToFile {
            id: Uuid::new_v4(),
            message_id: *message_id,
            file_id,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            is_duplicate: false,
        };

        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(messages_to_files::table)
            .values(&file_ref)
            .execute(&mut conn)
            .await
            .unwrap();

        file_id
    }

    #[tokio::test]
    async fn test_duplicate_full_chat() {
        // Create test user, chat, and messages
        let user = setup_test_user().await;
        let (chat_id, message_ids) = setup_test_chat(&user).await;

        // Add a file reference to one message
        let file_id = setup_test_file_reference(&message_ids[0], &user.id).await;

        // Duplicate the entire chat
        let result = duplicate_chat_handler(&chat_id, None, &user).await;
        assert!(
            result.is_ok(),
            "Failed to duplicate chat: {:?}",
            result.err()
        );

        let duplicated_chat = result.unwrap();

        // Verify chat properties
        assert_ne!(
            duplicated_chat.id, chat_id,
            "New chat should have a different ID"
        );
        assert_eq!(
            duplicated_chat.title, "Test Chat (Copy)",
            "New chat title should have (Copy) suffix"
        );
        assert_eq!(
            duplicated_chat.message_ids.len(),
            3,
            "Chat should have 3 messages"
        );

        // Verify file references
        let mut conn = get_pg_pool().get().await.unwrap();

        // Get all file references for the new chat
        let new_chat_messages = messages::table
            .filter(messages::chat_id.eq(duplicated_chat.id))
            .filter(messages::deleted_at.is_null())
            .load::<Message>(&mut conn)
            .await
            .unwrap();

        let file_refs = messages_to_files::table
            .filter(messages_to_files::message_id.eq_any(new_chat_messages.iter().map(|m| m.id)))
            .filter(messages_to_files::deleted_at.is_null())
            .load::<MessageToFile>(&mut conn)
            .await
            .unwrap();

        assert_eq!(file_refs.len(), 1, "Should have one file reference");
        assert_eq!(
            file_refs[0].file_id, file_id,
            "File reference should point to the original file"
        );
        assert!(
            file_refs[0].is_duplicate,
            "File reference should be marked as duplicate"
        );
    }

    #[tokio::test]
    async fn test_duplicate_partial_chat() {
        // Create test user, chat, and messages
        let user = setup_test_user().await;
        let (chat_id, message_ids) = setup_test_chat(&user).await;

        // Add file references to messages
        for message_id in &message_ids {
            setup_test_file_reference(message_id, &user.id).await;
        }

        // Duplicate second message and all older messages (not the third message)
        let result = duplicate_chat_handler(&chat_id, Some(&message_ids[1]), &user).await;
        assert!(
            result.is_ok(),
            "Failed to duplicate chat: {:?}",
            result.err()
        );

        let duplicated_chat = result.unwrap();

        // Verify chat properties
        assert_ne!(
            duplicated_chat.id, chat_id,
            "New chat should have a different ID"
        );
        assert_eq!(
            duplicated_chat.title, "Test Chat (Copy)",
            "New chat title should have (Copy) suffix"
        );
        assert_eq!(
            duplicated_chat.message_ids.len(),
            2,
            "Chat should have 2 messages (first and second message, but not third)"
        );

        // Verify file references
        let mut conn = get_pg_pool().get().await.unwrap();

        // Get all file references for the new chat
        let new_chat_messages = messages::table
            .filter(messages::chat_id.eq(duplicated_chat.id))
            .filter(messages::deleted_at.is_null())
            .load::<Message>(&mut conn)
            .await
            .unwrap();

        let file_refs = messages_to_files::table
            .filter(messages_to_files::message_id.eq_any(new_chat_messages.iter().map(|m| m.id)))
            .filter(messages_to_files::deleted_at.is_null())
            .load::<MessageToFile>(&mut conn)
            .await
            .unwrap();

        assert_eq!(file_refs.len(), 2, "Should have two file references");
        assert!(
            file_refs.iter().all(|fr| fr.is_duplicate),
            "All file references should be marked as duplicate"
        );
    }

    #[tokio::test]
    async fn test_duplicate_chat_no_permission() {
        // Create test user and chat
        let owner = setup_test_user().await;
        let (chat_id, _) = setup_test_chat(&owner).await;

        // Create another user who doesn't have permission
        let other_user = setup_test_user().await;

        // Try to duplicate the chat with the other user
        let result = duplicate_chat_handler(&chat_id, None, &other_user).await;
        assert!(
            result.is_err(),
            "Should fail when user doesn't have permission"
        );
        assert!(
            result.err().unwrap().to_string().contains("permission"),
            "Error should mention permission"
        );
    }

    #[tokio::test]
    async fn test_duplicate_nonexistent_chat() {
        // Create test user
        let user = setup_test_user().await;

        // Try to duplicate a nonexistent chat
        let nonexistent_id = Uuid::new_v4();
        let result = duplicate_chat_handler(&nonexistent_id, None, &user).await;
        assert!(result.is_err(), "Should fail when chat doesn't exist");
        assert!(
            result.err().unwrap().to_string().contains("not found"),
            "Error should mention not found"
        );
    }

    #[tokio::test]
    async fn test_duplicate_chat_invalid_message_id() {
        // Create test user, chat, and messages
        let user = setup_test_user().await;
        let (chat_id, _) = setup_test_chat(&user).await;

        // Try to duplicate with an invalid message ID
        let invalid_message_id = Uuid::new_v4();
        let result = duplicate_chat_handler(&chat_id, Some(&invalid_message_id), &user).await;
        assert!(result.is_err(), "Should fail when message ID is invalid");
    }
}
