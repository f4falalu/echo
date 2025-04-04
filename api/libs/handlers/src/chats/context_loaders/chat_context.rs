use std::sync::Arc;
use std::collections::HashSet;

use anyhow::Result;
use async_trait::async_trait;
use database::{
    pool::get_pg_pool,
    schema::{chats, messages},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use agents::{Agent, AgentMessage};
use middleware::AuthenticatedUser;
use serde_json::Value;
use uuid::Uuid;

use super::ContextLoader;

pub struct ChatContextLoader {
    pub chat_id: Uuid,
}

impl ChatContextLoader {
    pub fn new(chat_id: Uuid) -> Self {
        Self { chat_id }
    }

    // Helper function to check for tool usage and set appropriate context
    async fn update_context_from_tool_calls(agent: &Arc<Agent>, message: &AgentMessage) {
        if let AgentMessage::Assistant { tool_calls: Some(tool_calls), .. } = message {
            for tool_call in tool_calls {
                match tool_call.function.name.as_str() {
                    "search_data_catalog" => {
                        agent.set_state_value(String::from("data_context"), Value::Bool(true))
                            .await;
                    },
                    "create_metrics" | "update_metrics" => {
                        agent.set_state_value(String::from("metrics_available"), Value::Bool(true))
                            .await;
                    },
                    "create_dashboards" | "update_dashboards" => {
                        agent.set_state_value(String::from("dashboards_available"), Value::Bool(true))
                            .await;
                    },
                    name if name.contains("file") || name.contains("read") || name.contains("write") || name.contains("edit") => {
                        agent.set_state_value(String::from("files_available"), Value::Bool(true))
                            .await;
                    },
                    _ => {}
                }
            }
        }
    }
}

#[async_trait]
impl ContextLoader for ChatContextLoader {
    async fn load_context(&self, user: &AuthenticatedUser, agent: &Arc<Agent>) -> Result<Vec<AgentMessage>> {
        let mut conn = get_pg_pool().get().await?;

        // First verify the chat exists and user has access
        let chat = chats::table
            .filter(chats::id.eq(self.chat_id))
            .filter(chats::created_by.eq(&user.id))
            .first::<database::models::Chat>(&mut conn)
            .await?;

        // Get only the most recent message for the chat
        let message = messages::table
            .filter(messages::chat_id.eq(chat.id))
            .order_by(messages::created_at.desc())
            .first::<database::models::Message>(&mut conn)
            .await?;

        // Track seen message IDs
        let mut seen_ids = HashSet::new();
        // Convert messages to AgentMessages
        let mut agent_messages = Vec::new();
        
        // Process only the most recent message's raw LLM messages
        if let Ok(raw_messages) = serde_json::from_value::<Vec<AgentMessage>>(message.raw_llm_messages) {
            // Check each message for tool calls and update context
            for agent_message in &raw_messages {
                Self::update_context_from_tool_calls(agent, agent_message).await;
                
                // Only add messages with new IDs
                if let Some(id) = agent_message.get_id() {
                    if seen_ids.insert(id.to_string()) {
                        agent_messages.push(agent_message.clone());
                    }
                } else {
                    // Messages without IDs are always included
                    agent_messages.push(agent_message.clone());
                }
            }
        }

        Ok(agent_messages)
    }
} 