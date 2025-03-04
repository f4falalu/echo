use std::sync::Arc;

use anyhow::Result;
use async_trait::async_trait;
use database::{
    models::User,
    pool::get_pg_pool,
    schema::{chats, messages},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use agents::{Agent, AgentMessage};
use uuid::Uuid;

use super::ContextLoader;

pub struct ChatContextLoader {
    pub chat_id: Uuid,
}

impl ChatContextLoader {
    pub fn new(chat_id: Uuid) -> Self {
        Self { chat_id }
    }
}

#[async_trait]
impl ContextLoader for ChatContextLoader {
    async fn load_context(&self, user: &User, agent: &Arc<Agent>) -> Result<Vec<AgentMessage>> {
        let mut conn = get_pg_pool().get().await?;

        // First verify the chat exists and user has access
        let chat = chats::table
            .filter(chats::id.eq(self.chat_id))
            .filter(chats::created_by.eq(&user.id))
            .first::<database::models::Chat>(&mut conn)
            .await?;

        // Get all messages for the chat
        let messages = messages::table
            .filter(messages::chat_id.eq(chat.id))
            .order_by(messages::created_at.asc())
            .load::<database::models::Message>(&mut conn)
            .await?;

        // Convert messages to AgentMessages
        let mut agent_messages = Vec::new();
        for message in messages {
            // Add user message
            agent_messages.push(AgentMessage::user(message.request));

            // Add assistant messages from response
            if let Ok(response_messages) = serde_json::from_value::<Vec<AgentMessage>>(message.response)
            {
                agent_messages.extend(response_messages);
            }
        }

        Ok(agent_messages)
    }
} 