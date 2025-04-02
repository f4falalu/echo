use anyhow::Result;
use chrono::Utc;
use database::models::Chat;
use diesel::prelude::*;
use std::str::FromStr;
use uuid::Uuid;

use crate::common::{
    db::run_test_with_db,
    fixtures::{builder::TestFixtureBuilder, chats::CreateChatParams},
    http::test_app::{TestApp, TestAppBuilder},
    http::client::ApiClient,
};

#[tokio::test]
async fn test_update_chat() -> Result<()> {
    run_test_with_db(|db| async move {
        // Create test user
        let user_id = Uuid::new_v4();
        let mut fixture_builder = TestFixtureBuilder::new(db.clone());
        let user = fixture_builder.create_user(user_id).await?;
        
        // Create test chat
        let chat_id = Uuid::new_v4();
        let chat = fixture_builder
            .create_chat(CreateChatParams {
                id: Some(chat_id),
                title: Some("Original Title".to_string()),
                created_by: Some(user_id),
                ..Default::default()
            })
            .await?;
        
        // Setup test app
        let app = TestAppBuilder::new().with_db(db.clone()).build().await?;
        let client = ApiClient::new(app.client, user.clone());
        
        // Test updating the chat
        let response = client
            .put(&format!("/api/v1/chats/{}", chat_id))
            .json(&serde_json::json!({
                "title": "Updated Title"
            }))
            .send()
            .await?;
        
        // Verify response
        assert_eq!(response.status(), 200);
        let json = response.json::<serde_json::Value>().await?;
        assert_eq!(json["id"], chat_id.to_string());
        assert_eq!(json["success"], true);
        assert_eq!(json["error"], serde_json::Value::Null);
        
        // Verify database update
        let updated_chat = db.with_conn(|conn| async move {
            use database::schema::chats;
            
            chats::table
                .find(chat_id)
                .first::<Chat>(conn)
                .await
                .map_err(anyhow::Error::from)
        }).await?;
        
        assert_eq!(updated_chat.title, "Updated Title");
        
        Ok(())
    }).await
}

#[tokio::test]
async fn test_update_chat_not_found() -> Result<()> {
    run_test_with_db(|db| async move {
        // Create test user
        let user_id = Uuid::new_v4();
        let mut fixture_builder = TestFixtureBuilder::new(db.clone());
        let user = fixture_builder.create_user(user_id).await?;
        
        // Setup test app
        let app = TestAppBuilder::new().with_db(db.clone()).build().await?;
        let client = ApiClient::new(app.client, user.clone());
        
        // Test updating a non-existent chat
        let non_existent_id = Uuid::new_v4();
        let response = client
            .put(&format!("/api/v1/chats/{}", non_existent_id))
            .json(&serde_json::json!({
                "title": "Updated Title"
            }))
            .send()
            .await?;
        
        // Verify response
        assert_eq!(response.status(), 404);
        
        Ok(())
    }).await
}

#[tokio::test]
async fn test_update_chat_unauthorized() -> Result<()> {
    run_test_with_db(|db| async move {
        // Create two test users
        let user1_id = Uuid::new_v4();
        let user2_id = Uuid::new_v4();
        let mut fixture_builder = TestFixtureBuilder::new(db.clone());
        let user1 = fixture_builder.create_user(user1_id).await?;
        let user2 = fixture_builder.create_user(user2_id).await?;
        
        // Create test chat owned by user1
        let chat_id = Uuid::new_v4();
        let chat = fixture_builder
            .create_chat(CreateChatParams {
                id: Some(chat_id),
                title: Some("Original Title".to_string()),
                created_by: Some(user1_id),
                ..Default::default()
            })
            .await?;
        
        // Setup test app with user2 (who doesn't own the chat)
        let app = TestAppBuilder::new().with_db(db.clone()).build().await?;
        let client = ApiClient::new(app.client, user2.clone());
        
        // Test user2 trying to update user1's chat
        let response = client
            .put(&format!("/api/v1/chats/{}", chat_id))
            .json(&serde_json::json!({
                "title": "Updated Title"
            }))
            .send()
            .await?;
        
        // Verify response (should be forbidden)
        assert_eq!(response.status(), 403);
        
        Ok(())
    }).await
}