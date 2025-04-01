use crate::common::{
    fixtures::{
        chats::{create_chat_with_files, create_chat},
        users::create_user,
    },
    http::test_app::TestApp,
};
use axum::http::StatusCode;
use database::enums::AssetType;
use handlers::chats::list_chats_handler::ChatListItem;
use uuid::Uuid;

#[tokio::test]
async fn test_list_chats_with_most_recent_file() {
    // Arrange
    let app = TestApp::new().await;
    let user = create_user(&app).await;
    
    // Create a chat with a metric file
    let (chat_with_file, file_id) = create_chat_with_files(
        &app,
        &user,
        AssetType::MetricFile,
        "Chat with metric file",
    ).await;
    
    // Create a regular chat without a file
    let chat_without_file = create_chat(&app, &user, "Chat without file").await;
    
    // Act - Get the list of chats
    let response = app
        .get(&format!("/api/chats?page=1&page_size=10"))
        .with_auth(&user)
        .send()
        .await;
    
    // Assert - Check status and response structure
    assert_eq!(response.status(), StatusCode::OK);
    
    let chats: Vec<ChatListItem> = response.json().await;
    println!("Response: {:?}", chats);
    
    // Expect to find two chats in the response
    assert!(chats.len() >= 2);
    
    // Find the chat with file
    let chat_with_file_result = chats.iter()
        .find(|c| c.id == chat_with_file.id.to_string());
    
    assert!(chat_with_file_result.is_some());
    let chat = chat_with_file_result.unwrap();
    
    // Check if the latest_file_id and latest_file_type are correctly set
    assert_eq!(chat.latest_file_id, Some(file_id.to_string()));
    assert_eq!(chat.latest_file_type, Some("metric".to_string()));
    
    // Find the chat without file
    let chat_without_file_result = chats.iter()
        .find(|c| c.id == chat_without_file.id.to_string());
    
    assert!(chat_without_file_result.is_some());
    let chat = chat_without_file_result.unwrap();
    
    // Check that latest_file_id and latest_file_type are None
    assert_eq!(chat.latest_file_id, None);
    assert_eq!(chat.latest_file_type, None);
}