use anyhow::Result;
use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{Chat, MessageToFile, Message, MetricFile, DashboardFile, AssetPermission},
    pool::get_pg_pool,
    schema::{chats, messages, messages_to_files, metric_files, dashboard_files, asset_permissions},
};
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use serde_json::json;
use uuid::Uuid;

use super::builder::{FixtureBuilder, TestFixture, TestFixtureBuilder};
use super::users::UserFixture;

/// A fixture for testing chats
pub struct ChatFixture {
    pub id: Uuid,
    pub title: String,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub messages: Vec<Uuid>,
}

/// Builder for chat fixtures
pub struct ChatFixtureBuilder {
    title: Option<String>,
    user: Option<UserFixture>,
    message_count: usize,
    add_file_references: bool,
}

impl FixtureBuilder<ChatFixture> for ChatFixtureBuilder {
    fn default() -> Self {
        Self {
            title: None,
            user: None,
            message_count: 0,
            add_file_references: false,
        }
    }
    
    async fn build(self) -> ChatFixture {
        let user = match self.user {
            Some(user) => user,
            None => UserFixture::default().build().await,
        };
        
        let title = self.title.unwrap_or_else(|| format!("Test Chat {}", Uuid::new_v4()));
        
        // Create chat
        let mut conn = get_pg_pool().get().await.unwrap();
        
        let chat = Chat {
            id: Uuid::new_v4(),
            title: title.clone(),
            organization_id: user.organization_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: user.id,
            updated_by: user.id,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            most_recent_file_id: None,
            most_recent_file_type: None,
        };
        
        let chat = insert_into(chats::table)
            .values(&chat)
            .get_result::<Chat>(&mut conn)
            .await
            .unwrap();
            
        // Create permission for the user
        let permission = AssetPermission {
            identity_id: user.id,
            identity_type: IdentityType::User,
            asset_id: chat.id,
            asset_type: AssetType::Chat,
            role: AssetPermissionRole::Owner,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: user.id,
            updated_by: user.id,
        };
        
        insert_into(asset_permissions::table)
            .values(&permission)
            .execute(&mut conn)
            .await
            .unwrap();
            
        // Create messages if requested
        let mut message_ids = Vec::new();
        
        if self.message_count > 0 {
            for i in 0..self.message_count {
                let message = Message {
                    id: Uuid::new_v4(),
                    request_message: Some(format!("Test message {}", i + 1)),
                    response_messages: json!([{"id": format!("resp_{}", i), "type": "text", "message": format!("Response {}", i + 1)}]),
                    reasoning: json!([{"id": format!("reason_{}", i), "type": "text", "message": format!("Reasoning {}", i + 1)}]),
                    title: format!("Message {}", i + 1),
                    raw_llm_messages: json!([]),
                    final_reasoning_message: Some(format!("Final reasoning {}", i + 1)),
                    chat_id: chat.id,
                    created_at: Utc::now() + chrono::Duration::seconds(i as i64 * 10),
                    updated_at: Utc::now() + chrono::Duration::seconds(i as i64 * 10),
                    deleted_at: None,
                    created_by: user.id,
                    feedback: None,
                };
                
                let created_message = insert_into(messages::table)
                    .values(&message)
                    .get_result::<Message>(&mut conn)
                    .await
                    .unwrap();
                    
                message_ids.push(created_message.id);
                
                // Add file reference if requested
                if self.add_file_references {
                    let file_ref = MessageToFile {
                        id: Uuid::new_v4(),
                        message_id: created_message.id,
                        file_id: Uuid::new_v4(), // Mock file ID
                        created_at: Utc::now(),
                        updated_at: Utc::now(),
                        deleted_at: None,
                        is_duplicate: false,
                    };
                    
                    insert_into(messages_to_files::table)
                        .values(&file_ref)
                        .execute(&mut conn)
                        .await
                        .unwrap();
                }
            }
        }
        
        ChatFixture {
            id: chat.id,
            title,
            organization_id: chat.organization_id,
            created_by: user.id,
            messages: message_ids,
        }
    }
}

impl ChatFixtureBuilder {
    /// Set the chat title
    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }
    
    /// Set the user who owns this chat
    pub fn with_user(mut self, user: &UserFixture) -> Self {
        self.user = Some(user.clone());
        self
    }
    
    /// Set the number of messages to create
    pub fn with_messages(mut self, count: usize) -> Self {
        self.message_count = count;
        self
    }
    
    /// Add file references to messages
    pub fn with_file_references(mut self, add: bool) -> Self {
        self.add_file_references = add;
        self
    }
}

impl TestFixture for ChatFixture {
    type Builder = ChatFixtureBuilder;
}

impl Clone for ChatFixture {
    fn clone(&self) -> Self {
        Self {
            id: self.id,
            title: self.title.clone(),
            organization_id: self.organization_id,
            created_by: self.created_by,
            messages: self.messages.clone(),
        }
    }
}

impl TestFixtureBuilder {
    /// Create a test chat owned by a specific user
    pub async fn create_chat(&mut self, user_id: &Uuid) -> Result<Chat> {
        let mut conn = get_pg_pool().get().await?;
        
        let chat = Chat {
            id: Uuid::new_v4(),
            title: format!("Test Chat {}", Uuid::new_v4()),
            organization_id: Uuid::new_v4(), // In a real fixture, we'd use a proper organization id
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: *user_id,
            updated_by: *user_id,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            most_recent_file_id: None,
            most_recent_file_type: None,
        };
        
        insert_into(chats::table)
            .values(&chat)
            .get_result(&mut conn)
            .await
            .map_err(Into::into)
    }
}