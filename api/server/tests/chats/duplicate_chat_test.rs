use anyhow::Result;
use crate::common::fixtures::builder::BuildableFixture;
use crate::common::fixtures::{self, chats::ChatFixture, users::UserFixture};
use crate::common::http::client::TestClient;
use crate::common::http::test_app;
use crate::common::env;
use crate::common::assertions::response::ResponseAssertions;
use axum::http::StatusCode;
use database::models::{Chat, MessageToFile};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde_json::{json, Value};
use uuid::Uuid;

/// Tests the full chat duplication functionality
///
/// This test verifies:
/// - User can duplicate their own chat
/// - All messages are duplicated
/// - All file references are duplicated and marked with is_duplicate=true
/// - The new chat has the correct title with (Copy) suffix
#[tokio::test]
async fn test_duplicate_chat_integration() -> Result<()> {
    // Initialize test environment
    env::init_test_env();
    
    // Setup test context
    let app = test_app::create_test_app().await;
    let client = TestClient::new(app);
    let test_id = Uuid::new_v4().to_string();
    
    // Create a test user
    let user = UserFixture::default().build().await;
    
    // Create a test chat with messages and file references
    let chat = ChatFixture::default()
        .with_user(&user)
        .with_title(format!("Test Chat for duplication {}", test_id))
        .with_messages(3) // Create 3 messages
        .with_file_references(true) // Add file references to messages
        .build()
        .await;
    
    // Login as the user
    client.login_as(&user).await;
    
    // Act: Send request to duplicate the chat
    let response = client
        .post("/chats/duplicate")
        .json(&json!({
            "id": chat.id
        }))
        .send()
        .await;
    
    // Assert: Check response status
    response.assert_status(StatusCode::OK);
    
    // Parse response
    let json_response: Value = response.json().await;
    let chat_data = &json_response["data"]["chat"];
    
    // Assert: Verify response contains expected fields
    assert!(chat_data["id"].is_string(), "Chat id should be a string");
    assert_ne!(
        chat_data["id"].as_str().unwrap(),
        chat.id.to_string(),
        "New chat should have a different ID than the original"
    );
    assert_eq!(
        chat_data["title"].as_str().unwrap(),
        format!("{} (Copy)", chat.title),
        "Chat title should have (Copy) suffix"
    );
    
    // Assert: Verify all messages were duplicated
    let message_ids = chat_data["message_ids"].as_array().unwrap();
    assert_eq!(message_ids.len(), 3, "Chat should have 3 messages");
    
    // Get the new chat ID
    let new_chat_id = Uuid::parse_str(chat_data["id"].as_str().unwrap()).unwrap();
    
    // Verify in the database that file references were duplicated with is_duplicate=true
    let mut conn = fixtures::db::get_connection().await?;
    
    // Get all messages from the new chat
    let sql = "SELECT id FROM messages WHERE chat_id = $1 AND deleted_at IS NULL";
    let message_ids: Vec<(Uuid,)> = diesel::sql_query(sql)
        .bind::<diesel::sql_types::Uuid, _>(new_chat_id)
        .load(&mut conn)
        .await?;
    
    // Check if file references were created correctly
    let message_id_vec: Vec<Uuid> = message_ids.into_iter().map(|(id,)| id).collect();
    
    let sql = "SELECT * FROM messages_to_files WHERE message_id = ANY($1) AND deleted_at IS NULL";
    let file_refs: Vec<MessageToFile> = diesel::sql_query(sql)
        .bind::<diesel::sql_types::Array<diesel::sql_types::Uuid>, _>(&message_id_vec)
        .load(&mut conn)
        .await?;
    
    // Assert: Verify all file references are marked as duplicates
    assert!(!file_refs.is_empty(), "Should have at least one file reference");
    assert!(
        file_refs.iter().all(|fr| fr.is_duplicate),
        "All file references should be marked as duplicates"
    );
    
    Ok(())
}

/// Tests duplication of a chat from a specific message onwards
///
/// This test verifies:
/// - User can duplicate a chat starting from a specific message
/// - Only messages from that point onward are included
/// - The new chat has the correct title with (Copy) suffix
#[tokio::test]
async fn test_duplicate_chat_with_message_id() -> Result<()> {
    // Initialize test environment
    env::init_test_env();
    
    // Setup test context
    let app = test_app::create_test_app().await;
    let client = TestClient::new(app);
    let test_id = Uuid::new_v4().to_string();
    
    // Create a test user
    let user = UserFixture::default().build().await;
    
    // Create a test chat with messages
    let chat = ChatFixture::default()
        .with_user(&user)
        .with_title(format!("Test Chat for partial duplication {}", test_id))
        .with_messages(3) // Create 3 messages
        .build()
        .await;
    
    // Get the ID of the second message
    let mut conn = fixtures::db::get_connection().await?;
    let sql = "SELECT id FROM messages WHERE chat_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1 OFFSET 1";
    let second_message_id: (Uuid,) = diesel::sql_query(sql)
        .bind::<diesel::sql_types::Uuid, _>(chat.id)
        .get_result(&mut conn)
        .await?;
    
    // Login as the user
    client.login_as(&user).await;
    
    // Act: Send request to duplicate the chat from the second message
    let response = client
        .post("/chats/duplicate")
        .json(&json!({
            "id": chat.id,
            "message_id": second_message_id.0
        }))
        .send()
        .await;
    
    // Assert: Check response status
    response.assert_status(StatusCode::OK);
    
    // Parse response
    let json_response: Value = response.json().await;
    let chat_data = &json_response["data"]["chat"];
    
    // Assert: Verify only 2 messages were duplicated (second and third)
    let message_ids = chat_data["message_ids"].as_array().unwrap();
    assert_eq!(message_ids.len(), 2, "Chat should have 2 messages (from the second message)");
    
    Ok(())
}

/// Tests error handling when attempting to duplicate a nonexistent chat
///
/// This test verifies:
/// - API returns a 404 Not Found status when the chat ID doesn't exist
#[tokio::test]
async fn test_duplicate_nonexistent_chat() -> Result<()> {
    // Initialize test environment
    env::init_test_env();
    
    // Setup test context
    let app = test_app::create_test_app().await;
    let client = TestClient::new(app);
    
    // Create a test user
    let user = UserFixture::default().build().await;
    
    // Login as the user
    client.login_as(&user).await;
    
    // Act: Send request to duplicate a nonexistent chat
    let response = client
        .post("/chats/duplicate")
        .json(&json!({
            "id": Uuid::new_v4()
        }))
        .send()
        .await;
    
    // Assert: Check response status - should be not found
    response.assert_status(StatusCode::NOT_FOUND);
    
    Ok(())
}

/// Tests permission checks when duplicating chats
///
/// This test verifies:
/// - User cannot duplicate a chat they don't have access to
/// - API returns a 403 Forbidden status in this case
#[tokio::test]
async fn test_duplicate_chat_with_no_permission() -> Result<()> {
    // Initialize test environment
    env::init_test_env();
    
    // Setup test context
    let app = test_app::create_test_app().await;
    let client = TestClient::new(app);
    let test_id = Uuid::new_v4().to_string();
    
    // Create two users
    let user1 = UserFixture::default().build().await;
    let user2 = UserFixture::default().build().await;
    
    // Create a chat as user1
    let chat = ChatFixture::default()
        .with_user(&user1)
        .with_title(format!("Test Chat for permission check {}", test_id))
        .with_messages(2)
        .build()
        .await;
    
    // Act: Login as user2 who doesn't have access to the chat
    client.login_as(&user2).await;
    
    // Try to duplicate the chat
    let response = client
        .post("/chats/duplicate")
        .json(&json!({
            "id": chat.id
        }))
        .send()
        .await;
    
    // Assert: Check response status - should be forbidden
    response.assert_status(StatusCode::FORBIDDEN);
    
    Ok(())
}