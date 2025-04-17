use std::collections::HashSet;
use std::sync::Arc;

use agents::{Agent, AgentMessage};
use anyhow::Result;
use async_trait::async_trait;
use database::{
    pool::get_pg_pool,
    schema::{chats, messages},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
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
        // Handle tool calls from assistant messages
        if let AgentMessage::Assistant {
            tool_calls: Some(tool_calls),
            ..
        } = message
        {
            for tool_call in tool_calls {
                match tool_call.function.name.as_str() {
                    "search_data_catalog" => {
                        agent
                            .set_state_value(String::from("data_context"), Value::Bool(true))
                            .await;
                    }
                    "create_metrics" | "update_metrics" => {
                        agent
                            .set_state_value(String::from("metrics_available"), Value::Bool(true))
                            .await;
                    }
                    "create_dashboards" | "update_dashboards" => {
                        agent
                            .set_state_value(
                                String::from("dashboards_available"),
                                Value::Bool(true),
                            )
                            .await;
                    }
                    "import_assets" => {
                        // When we see import_assets, we need to check the content in the corresponding tool response
                        // This will be handled separately when processing tool messages
                    }
                    name if name.contains("file")
                        || name.contains("read")
                        || name.contains("write")
                        || name.contains("edit") =>
                    {
                        agent
                            .set_state_value(String::from("files_available"), Value::Bool(true))
                            .await;
                    }
                    _ => {}
                }
            }
        }

        // Handle tool responses - important for import_assets
        if let AgentMessage::Tool {
            name: Some(tool_name),
            content,
            ..
        } = message
        {
            if tool_name == "import_assets" {
                // Parse the tool response to see what was imported
                if let Ok(import_result) = serde_json::from_str::<serde_json::Value>(content) {
                    // Check for files array
                    if let Some(files) = import_result.get("files").and_then(|f| f.as_array()) {
                        if !files.is_empty() {
                            // Set files_available for any imported files
                            agent
                                .set_state_value(String::from("files_available"), Value::Bool(true))
                                .await;

                            // Check each file to determine its type
                            let mut has_metrics = false;
                            let mut has_dashboards = false;
                            let mut has_datasets = false;

                            for file in files {
                                // Check file_type/asset_type to determine what kind of asset this is
                                let file_type = file
                                    .get("file_type")
                                    .and_then(|ft| ft.as_str())
                                    .or_else(|| file.get("asset_type").and_then(|at| at.as_str()));

                                tracing::debug!(
                                    "Processing imported file with type: {:?}",
                                    file_type
                                );

                                match file_type {
                                    Some("metric") => {
                                        has_metrics = true;

                                        // Check if the metric has dataset references
                                        if let Some(yml_content) =
                                            file.get("yml_content").and_then(|y| y.as_str())
                                        {
                                            if yml_content.contains("dataset")
                                                || yml_content.contains("datasetIds")
                                            {
                                                has_datasets = true;
                                            }
                                        }
                                    }
                                    Some("dashboard") => {
                                        has_dashboards = true;

                                        // Dashboards often reference metrics too
                                        has_metrics = true;

                                        // Check if the dashboard has dataset references via metrics
                                        if let Some(yml_content) =
                                            file.get("yml_content").and_then(|y| y.as_str())
                                        {
                                            if yml_content.contains("dataset")
                                                || yml_content.contains("datasetIds")
                                            {
                                                has_datasets = true;
                                            }
                                        }
                                    }
                                    _ => {
                                        tracing::debug!(
                                            "Unknown file type in import_assets: {:?}",
                                            file_type
                                        );
                                    }
                                }
                            }

                            // Set appropriate state values based on what we found
                            if has_metrics {
                                tracing::debug!("Setting metrics_available state to true");
                                agent
                                    .set_state_value(
                                        String::from("metrics_available"),
                                        Value::Bool(true),
                                    )
                                    .await;
                            }
                            if has_dashboards {
                                tracing::debug!("Setting dashboards_available state to true");
                                agent
                                    .set_state_value(
                                        String::from("dashboards_available"),
                                        Value::Bool(true),
                                    )
                                    .await;
                            }
                            if has_datasets {
                                tracing::debug!("Setting data_context state to true");
                                agent
                                    .set_state_value(
                                        String::from("data_context"),
                                        Value::Bool(true),
                                    )
                                    .await;
                            }
                        }
                    }
                }
            }
        }
    }
}

#[async_trait]
impl ContextLoader for ChatContextLoader {
    async fn load_context(
        &self,
        user: &AuthenticatedUser,
        agent: &Arc<Agent>,
    ) -> Result<Vec<AgentMessage>> {
        let mut conn = get_pg_pool().get().await?;

        // First verify the chat exists and user has access
        let chat = chats::table
            .filter(chats::id.eq(self.chat_id))
            .filter(chats::created_by.eq(&user.id))
            .filter(chats::deleted_at.is_null())
            .first::<database::models::Chat>(&mut conn)
            .await?;

        // Get only the most recent message for the chat
        let message = match messages::table
            .filter(messages::chat_id.eq(chat.id))
            .filter(messages::deleted_at.is_null())
            .order_by(messages::created_at.desc())
            .first::<database::models::Message>(&mut conn)
            .await
        {
            Ok(message) => message,
            Err(diesel::NotFound) => return Ok(vec![]),
            Err(e) => return Err(anyhow::anyhow!("Failed to get message: {}", e)),
        };

        // Track seen message IDs
        let mut seen_ids = HashSet::new();
        // Convert messages to AgentMessages
        let mut agent_messages = Vec::new();

        // Process only the most recent message's raw LLM messages
        if let Ok(raw_messages) =
            serde_json::from_value::<Vec<AgentMessage>>(message.raw_llm_messages)
        {
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
