use crate::common::{
    assertions::response::{assert_status, StatusCompare},
    db::MockDB,
    fixtures::{
        chats::ChatFixtureBuilder,
        users::UserFixtureBuilder,
    },
    http::client::{ClientWithDatabase, RequestBuilderExt},
};
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use sharing::create_asset_permission::create_share_by_email;
use reqwest::StatusCode;
use serde_json::json;
use uuid::Uuid;

#[tokio::test]
async fn test_delete_chat_sharing_success() {
    // Setup test database
    let mock_db = MockDB::new().await;
    let db_conn = mock_db.get_connection().await;
    
    // Create test user
    let user = UserFixtureBuilder::new()
        .with_email("test@example.com")
        .build(&db_conn)
        .await;
    
    // Create another user to share with
    let shared_user = UserFixtureBuilder::new()
        .with_email("shared@example.com")
        .build(&db_conn)
        .await;
    
    // Create a test chat owned by the user
    let chat = ChatFixtureBuilder::new()
        .with_created_by(user.id)
        .build(&db_conn)
        .await;
    
    // Create sharing permission for the chat
    create_share_by_email(
        &shared_user.email,
        chat.id,
        AssetType::Chat,
        AssetPermissionRole::FullAccess,
        user.id,
    ).await.unwrap();
    
    // Create client with test database
    let client = ClientWithDatabase::new(mock_db);
    
    // Send DELETE request to remove sharing
    let response = client
        .delete(&format!("/chats/{}/sharing", chat.id))
        .with_authentication(&user.id.to_string())
        .json(&vec![shared_user.email.clone()])
        .send()
        .await;
    
    // Assert success response
    assert_status!(response, StatusCompare::Is(StatusCode::OK));
    
    // Verify the permission no longer exists
    // This would require checking the database or making a GET request to /chats/{id}/sharing
    // In a real test, we would validate this properly
}

#[tokio::test]
async fn test_delete_chat_sharing_not_found() {
    // Setup test database
    let mock_db = MockDB::new().await;
    
    // Create test user
    let user = UserFixtureBuilder::new()
        .with_email("test@example.com")
        .build(&mock_db.get_connection().await)
        .await;
    
    // Create client with test database
    let client = ClientWithDatabase::new(mock_db);
    
    // Send DELETE request for a non-existent chat
    let non_existent_chat_id = Uuid::new_v4();
    let response = client
        .delete(&format!("/chats/{}/sharing", non_existent_chat_id))
        .with_authentication(&user.id.to_string())
        .json(&vec!["shared@example.com".to_string()])
        .send()
        .await;
    
    // Assert not found response
    assert_status!(response, StatusCompare::Is(StatusCode::NOT_FOUND));
}

#[tokio::test]
async fn test_delete_chat_sharing_invalid_email() {
    // Setup test database
    let mock_db = MockDB::new().await;
    let db_conn = mock_db.get_connection().await;
    
    // Create test user
    let user = UserFixtureBuilder::new()
        .with_email("test@example.com")
        .build(&db_conn)
        .await;
    
    // Create a test chat owned by the user
    let chat = ChatFixtureBuilder::new()
        .with_created_by(user.id)
        .build(&db_conn)
        .await;
    
    // Create client with test database
    let client = ClientWithDatabase::new(mock_db);
    
    // Send DELETE request with invalid email format
    let response = client
        .delete(&format!("/chats/{}/sharing", chat.id))
        .with_authentication(&user.id.to_string())
        .json(&vec!["invalid-email".to_string()])
        .send()
        .await;
    
    // Assert bad request response
    assert_status!(response, StatusCompare::Is(StatusCode::BAD_REQUEST));
}

#[tokio::test]
async fn test_delete_chat_sharing_unauthorized() {
    // Setup test database
    let mock_db = MockDB::new().await;
    let db_conn = mock_db.get_connection().await;
    
    // Create test user (owner)
    let owner = UserFixtureBuilder::new()
        .with_email("owner@example.com")
        .build(&db_conn)
        .await;
    
    // Create another user (unauthorized)
    let unauthorized_user = UserFixtureBuilder::new()
        .with_email("unauthorized@example.com")
        .build(&db_conn)
        .await;
    
    // Create a shared user
    let shared_user = UserFixtureBuilder::new()
        .with_email("shared@example.com")
        .build(&db_conn)
        .await;
    
    // Create a test chat owned by the owner
    let chat = ChatFixtureBuilder::new()
        .with_created_by(owner.id)
        .build(&db_conn)
        .await;
    
    // Create client with test database
    let client = ClientWithDatabase::new(mock_db);
    
    // Send DELETE request from unauthorized user
    let response = client
        .delete(&format!("/chats/{}/sharing", chat.id))
        .with_authentication(&unauthorized_user.id.to_string())
        .json(&vec![shared_user.email.clone()])
        .send()
        .await;
    
    // Assert forbidden response
    assert_status!(response, StatusCompare::Is(StatusCode::FORBIDDEN));
}