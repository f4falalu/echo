use anyhow::Result;
use database::{
    enums::{AssetType, WorkspaceSharing},
    models::{Chat, Message, UserFavorite},
    pool::get_pg_pool,
    schema::{chats, messages, user_favorites},
    tests::common::db::{TestDb, TestSetup},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use handlers::chats::{list_chats_handler, ListChatsRequest};
use middleware::UserOrganization;
use uuid::Uuid;

#[tokio::test]
async fn test_workspace_shared_chats_filtered_without_contribution() -> Result<()> {
    let setup = TestSetup::new(None).await?;
    let mut conn = setup.db.diesel_conn().await?;

    // Create another user in the same organization
    let other_user = setup.db.create_user("other@example.com", "Other User").await?;

    // Create a workspace-shared chat by the other user
    let shared_chat = Chat {
        id: Uuid::new_v4(),
        title: "Shared Chat".to_string(),
        organization_id: setup.organization.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: other_user.id,
        updated_by: other_user.id,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        most_recent_file_id: None,
        most_recent_file_type: None,
        most_recent_version_number: None,
        workspace_sharing: WorkspaceSharing::CanView,
        workspace_sharing_enabled_by: Some(other_user.id),
        workspace_sharing_enabled_at: Some(chrono::Utc::now()),
    };

    diesel::insert_into(chats::table)
        .values(&shared_chat)
        .execute(&mut conn)
        .await?;

    // Create a message in the chat by the other user
    let message = Message {
        id: Uuid::new_v4(),
        request_message: Some("Test message".to_string()),
        response_messages: serde_json::json!({}),
        reasoning: serde_json::json!({}),
        title: "Test".to_string(),
        raw_llm_messages: serde_json::json!({}),
        final_reasoning_message: None,
        chat_id: shared_chat.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: other_user.id,
        feedback: None,
        is_completed: true,
        post_processing_message: None,
    };

    diesel::insert_into(messages::table)
        .values(&message)
        .execute(&mut conn)
        .await?;

    // List chats for the test user - should NOT see the shared chat
    let request = ListChatsRequest {
        page: Some(1),
        page_size: 10,
        admin_view: false,
    };

    let auth_user = middleware::AuthenticatedUser {
        id: setup.user.id,
        email: setup.user.email.clone(),
        name: setup.user.name.clone(),
        organizations: vec![UserOrganization {
            id: setup.organization.id,
            name: setup.organization.name.clone(),
        }],
    };

    let result = list_chats_handler(request, &auth_user).await?;
    
    // Should not see the shared chat since user hasn't contributed
    assert_eq!(result.len(), 0);

    // Clean up
    setup.db.cleanup().await?;
    Ok(())
}

#[tokio::test]
async fn test_workspace_shared_chats_visible_with_contribution() -> Result<()> {
    let setup = TestSetup::new(None).await?;
    let mut conn = setup.db.diesel_conn().await?;

    // Create another user in the same organization
    let other_user = setup.db.create_user("other@example.com", "Other User").await?;

    // Create a workspace-shared chat by the other user
    let shared_chat = Chat {
        id: Uuid::new_v4(),
        title: "Shared Chat With Contribution".to_string(),
        organization_id: setup.organization.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: other_user.id,
        updated_by: other_user.id,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        most_recent_file_id: None,
        most_recent_file_type: None,
        most_recent_version_number: None,
        workspace_sharing: WorkspaceSharing::CanView,
        workspace_sharing_enabled_by: Some(other_user.id),
        workspace_sharing_enabled_at: Some(chrono::Utc::now()),
    };

    diesel::insert_into(chats::table)
        .values(&shared_chat)
        .execute(&mut conn)
        .await?;

    // Create a message by the other user
    let message1 = Message {
        id: Uuid::new_v4(),
        request_message: Some("Other user message".to_string()),
        response_messages: serde_json::json!({}),
        reasoning: serde_json::json!({}),
        title: "Test".to_string(),
        raw_llm_messages: serde_json::json!({}),
        final_reasoning_message: None,
        chat_id: shared_chat.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: other_user.id,
        feedback: None,
        is_completed: true,
        post_processing_message: None,
    };

    diesel::insert_into(messages::table)
        .values(&message1)
        .execute(&mut conn)
        .await?;

    // Create a message by the test user (contribution)
    let message2 = Message {
        id: Uuid::new_v4(),
        request_message: Some("Test user message".to_string()),
        response_messages: serde_json::json!({}),
        reasoning: serde_json::json!({}),
        title: "Test".to_string(),
        raw_llm_messages: serde_json::json!({}),
        final_reasoning_message: None,
        chat_id: shared_chat.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: setup.user.id,  // Test user contributes
        feedback: None,
        is_completed: true,
        post_processing_message: None,
    };

    diesel::insert_into(messages::table)
        .values(&message2)
        .execute(&mut conn)
        .await?;

    // List chats for the test user - should see the shared chat
    let request = ListChatsRequest {
        page: Some(1),
        page_size: 10,
        admin_view: false,
    };

    let auth_user = middleware::AuthenticatedUser {
        id: setup.user.id,
        email: setup.user.email.clone(),
        name: setup.user.name.clone(),
        organizations: vec![UserOrganization {
            id: setup.organization.id,
            name: setup.organization.name.clone(),
        }],
    };

    let result = list_chats_handler(request, &auth_user).await?;
    
    // Should see the shared chat since user has contributed
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].name, "Shared Chat With Contribution");

    // Clean up
    setup.db.cleanup().await?;
    Ok(())
}

#[tokio::test]
async fn test_workspace_shared_chats_visible_when_favorited() -> Result<()> {
    let setup = TestSetup::new(None).await?;
    let mut conn = setup.db.diesel_conn().await?;

    // Create another user in the same organization
    let other_user = setup.db.create_user("other@example.com", "Other User").await?;

    // Create a workspace-shared chat by the other user
    let shared_chat = Chat {
        id: Uuid::new_v4(),
        title: "Favorited Shared Chat".to_string(),
        organization_id: setup.organization.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: other_user.id,
        updated_by: other_user.id,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        most_recent_file_id: None,
        most_recent_file_type: None,
        most_recent_version_number: None,
        workspace_sharing: WorkspaceSharing::CanView,
        workspace_sharing_enabled_by: Some(other_user.id),
        workspace_sharing_enabled_at: Some(chrono::Utc::now()),
    };

    diesel::insert_into(chats::table)
        .values(&shared_chat)
        .execute(&mut conn)
        .await?;

    // Create a message by the other user
    let message = Message {
        id: Uuid::new_v4(),
        request_message: Some("Other user message".to_string()),
        response_messages: serde_json::json!({}),
        reasoning: serde_json::json!({}),
        title: "Test".to_string(),
        raw_llm_messages: serde_json::json!({}),
        final_reasoning_message: None,
        chat_id: shared_chat.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: other_user.id,
        feedback: None,
        is_completed: true,
        post_processing_message: None,
    };

    diesel::insert_into(messages::table)
        .values(&message)
        .execute(&mut conn)
        .await?;

    // Add the chat to user's favorites
    let favorite = UserFavorite {
        user_id: setup.user.id,
        asset_id: shared_chat.id,
        asset_type: AssetType::Chat,
        order_index: 0,
        created_at: chrono::Utc::now(),
        deleted_at: None,
    };

    diesel::insert_into(user_favorites::table)
        .values(&favorite)
        .execute(&mut conn)
        .await?;

    // List chats for the test user - should see the shared chat
    let request = ListChatsRequest {
        page: Some(1),
        page_size: 10,
        admin_view: false,
    };

    let auth_user = middleware::AuthenticatedUser {
        id: setup.user.id,
        email: setup.user.email.clone(),
        name: setup.user.name.clone(),
        organizations: vec![UserOrganization {
            id: setup.organization.id,
            name: setup.organization.name.clone(),
        }],
    };

    let result = list_chats_handler(request, &auth_user).await?;
    
    // Should see the shared chat since user has favorited it
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].name, "Favorited Shared Chat");

    // Clean up
    setup.db.cleanup().await?;
    Ok(())
}