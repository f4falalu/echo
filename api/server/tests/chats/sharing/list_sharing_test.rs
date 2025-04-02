use std::sync::Arc;
use axum::{
    body::Body,
    extract::connect_info::MockConnectInfo,
    http::{Request, StatusCode},
};
use uuid::Uuid;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, Chat, User},
};
use crate::common::{
    assertions::response::{assert_json_response, assert_status},
    db::setup_test_db,
    fixtures::{
        chats::create_test_chat,
        users::create_test_user,
    },
    http::client::TestClient,
};
use chrono::Utc;

// Test listing sharing permissions for a chat
#[tokio::test]
async fn test_list_chat_sharing_permissions() {
    // Setup test database and create test users and chat
    let pool = setup_test_db().await;
    let mut conn = pool.get().await.unwrap();
    
    // Create test users
    let owner = create_test_user(&mut conn).await;
    let viewer = create_test_user(&mut conn).await;
    
    // Create test chat
    let chat = create_test_chat(&mut conn, &owner.id).await;
    
    // Create sharing permission for the viewer
    let permission = AssetPermission {
        identity_id: viewer.id,
        identity_type: IdentityType::User,
        asset_id: chat.id,
        asset_type: AssetType::Chat,
        role: AssetPermissionRole::CanView,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: owner.id,
        updated_by: owner.id,
    };
    
    diesel::insert_into(database::schema::asset_permissions::table)
        .values(&permission)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Make request as owner
    let client = TestClient::new(
        Arc::new(MockConnectInfo(([127, 0, 0, 1], 8080))),
        owner,
    );
    
    let response = client
        .get(&format!("/chats/{}/sharing", chat.id))
        .send()
        .await;
    
    // Assert successful response
    assert_status!(response, StatusCode::OK);
    
    // Verify response contains the sharing permission
    let body = response.into_body();
    let json = hyper::body::to_bytes(body).await.unwrap();
    let response: serde_json::Value = serde_json::from_slice(&json).unwrap();
    
    assert!(response["permissions"].is_array());
    assert_eq!(response["permissions"].as_array().unwrap().len(), 1);
    assert_eq!(response["permissions"][0]["user_id"], viewer.id.to_string());
    assert_eq!(response["permissions"][0]["role"], "CanView");
}

// Test listing sharing permissions for a chat that doesn't exist
#[tokio::test]
async fn test_list_sharing_nonexistent_chat() {
    // Setup test database and create test users
    let pool = setup_test_db().await;
    let mut conn = pool.get().await.unwrap();
    
    // Create test user
    let user = create_test_user(&mut conn).await;
    
    // Make request with non-existent chat ID
    let client = TestClient::new(
        Arc::new(MockConnectInfo(([127, 0, 0, 1], 8080))),
        user,
    );
    
    let response = client
        .get(&format!("/chats/{}/sharing", Uuid::new_v4()))
        .send()
        .await;
    
    // Assert not found response
    assert_status!(response, StatusCode::NOT_FOUND);
}

// Test listing sharing permissions for a chat without permission
#[tokio::test]
async fn test_list_sharing_without_permission() {
    // Setup test database and create test users and chat
    let pool = setup_test_db().await;
    let mut conn = pool.get().await.unwrap();
    
    // Create test users
    let owner = create_test_user(&mut conn).await;
    let unauthorized_user = create_test_user(&mut conn).await;
    
    // Create test chat
    let chat = create_test_chat(&mut conn, &owner.id).await;
    
    // Make request as unauthorized user
    let client = TestClient::new(
        Arc::new(MockConnectInfo(([127, 0, 0, 1], 8080))),
        unauthorized_user,
    );
    
    let response = client
        .get(&format!("/chats/{}/sharing", chat.id))
        .send()
        .await;
    
    // Assert forbidden response
    assert_status!(response, StatusCode::FORBIDDEN);
}

// Test listing sharing permissions for a chat with no sharing permissions
#[tokio::test]
async fn test_list_empty_sharing_permissions() {
    // Setup test database and create test users and chat
    let pool = setup_test_db().await;
    let mut conn = pool.get().await.unwrap();
    
    // Create test user
    let user = create_test_user(&mut conn).await;
    
    // Create test chat
    let chat = create_test_chat(&mut conn, &user.id).await;
    
    // Make request as owner
    let client = TestClient::new(
        Arc::new(MockConnectInfo(([127, 0, 0, 1], 8080))),
        user,
    );
    
    let response = client
        .get(&format!("/chats/{}/sharing", chat.id))
        .send()
        .await;
    
    // Assert successful response
    assert_status!(response, StatusCode::OK);
    
    // Verify response contains empty permissions array
    let body = response.into_body();
    let json = hyper::body::to_bytes(body).await.unwrap();
    let response: serde_json::Value = serde_json::from_slice(&json).unwrap();
    
    assert!(response["permissions"].is_array());
    assert_eq!(response["permissions"].as_array().unwrap().len(), 0);
}