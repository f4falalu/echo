use std::collections::HashMap;

use agents::{
    tools::file_tools::search_data_catalog::SearchDataCatalogOutput, AgentMessage, AgentThread,
    BusterSuperAgent,
};

use anyhow::Result;
use chrono::Utc;
use database::{
    enums::Verification,
    models::{Chat, DashboardFile, Message, MessageToFile, MetricFile, User},
    pool::get_pg_pool,
    schema::{chats, dashboard_files, messages, messages_to_files, metric_files},
};
use diesel::{insert_into, ExpressionMethods};
use diesel_async::RunQueryDsl;
use litellm::{MessageProgress, ToolCall};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::messages::types::{ChatMessage, ChatUserMessage};

use super::types::ChatWithMessages;

// Define ThreadEvent
pub enum ThreadEvent {
    GeneratingResponseMessage,
    GeneratingReasoningMessage,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ChatCreateNewChat {
    pub prompt: String,
    pub chat_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
}

pub async fn post_chat_handler(request: ChatCreateNewChat, user: User) -> Result<ChatWithMessages> {
    let chat_id = request.chat_id.unwrap_or_else(|| Uuid::new_v4());
    let message_id = request.message_id.unwrap_or_else(|| Uuid::new_v4());

    let user_org_id = match user.attributes.get("organization_id") {
        Some(Value::String(org_id)) => Uuid::parse_str(&org_id).unwrap_or_default(),
        _ => {
            tracing::error!("User has no organization ID");
            return Err(anyhow::anyhow!("User has no organization ID"));
        }
    };

    // Create chat
    let chat = Chat {
        id: chat_id,
        title: request.prompt.clone(),
        organization_id: user_org_id,
        created_by: user.id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    let mut chat_with_messages = ChatWithMessages {
        id: chat_id,
        title: request.prompt.clone(),
        is_favorited: false,
        messages: vec![ChatMessage {
            id: message_id,
            request_message: ChatUserMessage {
                request: request.prompt.clone(),
                sender_id: user.id.clone(),
                sender_name: user.name.clone().unwrap_or_default(),
                sender_avatar: None,
            },
            response_messages: vec![],
            reasoning: vec![],
            created_at: Utc::now().to_string(),
        }],
        created_at: Utc::now().to_string(),
        updated_at: Utc::now().to_string(),
        created_by: user.id.to_string(),
        created_by_id: user.id.to_string(),
        created_by_name: user.name.clone().unwrap_or_default(),
        created_by_avatar: None,
    };

    // Create chat in database
    let mut conn = get_pg_pool().get().await?;
    insert_into(chats::table)
        .values(&chat)
        .execute(&mut conn)
        .await?;

    // Initialize agent and process request
    let agent = BusterSuperAgent::new(user.id, chat_id).await?;
    let mut chat = AgentThread::new(
        Some(chat_id),
        user.id,
        vec![AgentMessage::user(request.prompt.clone())],
    );

    // Get the receiver and collect all messages
    let mut rx = agent.run(&mut chat).await?;

    // Improved message processing
    let mut all_messages: Vec<AgentMessage> = Vec::new();
    let mut final_message: Option<String> = None;

    tracing::info!("Processing agent messages for chat_id: {}", chat_id);

    // Process all messages from the agent
    while let Ok(message_result) = rx.recv().await {
        match message_result {
            Ok(msg) => {
                tracing::debug!("Received message: {:?}", msg);

                // Special handling for manager_agent final messages
                if let AgentMessage::Assistant {
                    name: Some(name),
                    content: Some(content),
                    tool_calls: None,
                    ..
                } = &msg
                {
                    if name == "manager_agent" {
                        tracing::info!("Received final message from manager_agent");
                        final_message = Some(content.clone());
                        // Still add the message to the collection for completeness
                        all_messages.push(msg);
                    } else {
                        all_messages.push(msg);
                    }
                } else {
                    // All other message types are collected
                    all_messages.push(msg);
                }
            }
            Err(e) => {
                tracing::error!("Error receiving message from agent: {}", e);
                // Don't return early, continue processing remaining messages
                // but log the error for debugging purposes
            }
        }
    }

    tracing::info!(
        "Processed {} messages for chat_id: {}",
        all_messages.len(),
        chat_id
    );

    // Create and store message in the database
    let message = Message {
        id: message_id,
        request: request.prompt,
        response: serde_json::to_value(&all_messages)?,
        chat_id: chat_id,
        created_by: user.id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    // Insert message into database
    insert_into(messages::table)
        .values(&message)
        .execute(&mut conn)
        .await?;

    // Store final message state and process any completed files
    store_final_message_state(&mut conn, &message, &all_messages, &user_org_id, &user.id).await?;

    // Transform all messages for the response
    if let Some(chat_message) = chat_with_messages.messages.first_mut() {
        // Process all messages to extract response and reasoning content
        let transformed_containers: Vec<BusterContainer> = all_messages
            .iter()
            .filter_map(
                |msg| match transform_message(&chat_id, &message_id, msg.clone()) {
                    Ok((containers, _)) => Some(containers),
                    Err(e) => {
                        tracing::warn!("Failed to transform message: {}", e);
                        None
                    }
                },
            )
            .flatten()
            .collect();

        // Split containers into response messages and reasoning messages
        let (response_messages, reasoning_messages): (Vec<_>, Vec<_>) = transformed_containers
            .iter()
            .filter_map(|container| match container {
                BusterContainer::ChatMessage(chat) => {
                    if let Some(message_text) = &chat.response_message.message {
                        Some((
                            Some(serde_json::to_value(message_text).unwrap_or_default()),
                            None,
                        ))
                    } else {
                        None
                    }
                }
                BusterContainer::ReasoningMessage(reasoning) => {
                    let reasoning_value = match &reasoning.reasoning {
                        ReasoningMessage::Thought(thought) => serde_json::to_value(thought).ok(),
                        ReasoningMessage::File(file) => serde_json::to_value(file).ok(),
                    };

                    if let Some(value) = reasoning_value {
                        Some((None, Some(value)))
                    } else {
                        None
                    }
                }
            })
            .unzip();

        // Collect valid response messages
        let mut final_response_messages: Vec<Value> =
            response_messages.into_iter().flatten().collect();

        // Add the final message from manager_agent if available
        if let Some(final_msg) = final_message {
            if let Ok(value) = serde_json::to_value(final_msg) {
                final_response_messages.push(value);
            }
        }

        // Update the chat message with processed content
        chat_message.response_messages = final_response_messages;
        chat_message.reasoning = reasoning_messages.into_iter().flatten().collect();
    }

    tracing::info!("Completed post_chat_handler for chat_id: {}", chat_id);
    Ok(chat_with_messages)
}

async fn store_final_message_state(
    conn: &mut diesel_async::AsyncPgConnection,
    message: &Message,
    messages: &[AgentMessage],
    organization_id: &Uuid,
    user_id: &Uuid,
) -> Result<()> {
    // Update final message state
    diesel::update(messages::table)
        .filter(messages::id.eq(message.id))
        .set((
            messages::response.eq(&message.response),
            messages::updated_at.eq(message.updated_at),
        ))
        .execute(conn)
        .await?;

    // Transform messages to BusterContainer format
    let transformed_messages: Vec<BusterContainer> = messages
        .iter()
        .filter_map(|msg| {
            transform_message(&message.chat_id, &message.id, msg.clone())
                .ok()
                .map(|(containers, _)| containers)
        })
        .flatten()
        .collect();

    // Process any completed metric or dashboard files
    for container in transformed_messages {
        match container {
            BusterContainer::ReasoningMessage(msg) => match &msg.reasoning {
                ReasoningMessage::File(file) if file.file_type == "metric" => {
                    if let Some(file_content) = &file.file {
                        let metric_file = MetricFile {
                            id: Uuid::new_v4(),
                            name: file.file_name.clone(),
                            file_name: format!(
                                "{}.yml",
                                file.file_name.to_lowercase().replace(' ', "_")
                            ),
                            content: serde_json::to_value(&file_content)?,
                            verification: Verification::NotRequested,
                            evaluation_obj: None,
                            evaluation_summary: None,
                            evaluation_score: None,
                            organization_id: organization_id.clone(),
                            created_by: user_id.clone(),
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };

                        insert_into(metric_files::table)
                            .values(&metric_file)
                            .execute(conn)
                            .await?;

                        let message_to_file = MessageToFile {
                            id: Uuid::new_v4(),
                            message_id: message.id,
                            file_id: metric_file.id,
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };

                        insert_into(messages_to_files::table)
                            .values(&message_to_file)
                            .execute(conn)
                            .await?;
                    }
                }
                ReasoningMessage::File(file) if file.file_type == "dashboard" => {
                    if let Some(file_content) = &file.file {
                        let dashboard_file = DashboardFile {
                            id: Uuid::new_v4(),
                            name: file.file_name.clone(),
                            file_name: format!(
                                "{}.yml",
                                file.file_name.to_lowercase().replace(' ', "_")
                            ),
                            content: serde_json::to_value(&file_content)?,
                            filter: None,
                            organization_id: organization_id.clone(),
                            created_by: user_id.clone(),
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };

                        insert_into(dashboard_files::table)
                            .values(&dashboard_file)
                            .execute(conn)
                            .await?;

                        let message_to_file = MessageToFile {
                            id: Uuid::new_v4(),
                            message_id: message.id,
                            file_id: dashboard_file.id,
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };

                        insert_into(messages_to_files::table)
                            .values(&message_to_file)
                            .execute(conn)
                            .await?;
                    }
                }
                _ => (),
            },
            _ => (),
        }
    }

    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum BusterChatContainer {
    ChatMessage(BusterChatMessage),
    Thought(BusterThought),
    File(BusterFileMessage),
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterChatMessageContainer {
    pub response_message: BusterChatMessage,
    pub chat_id: Uuid,
    pub message_id: Uuid,
}

#[derive(Debug, Serialize, Clone)]
#[serde(untagged)]
pub enum ReasoningMessage {
    Thought(BusterThought),
    File(BusterFileMessage),
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterReasoningMessageContainer {
    pub reasoning: ReasoningMessage,
    pub chat_id: Uuid,
    pub message_id: Uuid,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterChatMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub message: Option<String>,
    pub message_chunk: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThought {
    pub id: String,
    #[serde(rename = "type")]
    pub thought_type: String,
    pub thought_title: String,
    pub thought_secondary_title: String,
    pub thoughts: Option<Vec<BusterThoughtPillContainer>>,
    pub status: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThoughtPillContainer {
    pub title: String,
    pub thought_pills: Vec<BusterThoughtPill>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThoughtPill {
    pub id: String,
    pub text: String,
    #[serde(rename = "type")]
    pub thought_file_type: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterFileMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub file_type: String,
    pub file_name: String,
    pub version_number: i32,
    pub version_id: String,
    pub status: String,
    pub file: Option<Vec<BusterFileLine>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterFileLine {
    pub line_number: usize,
    pub text: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(untagged)]
pub enum BusterContainer {
    ChatMessage(BusterChatMessageContainer),
    ReasoningMessage(BusterReasoningMessageContainer),
}

pub fn transform_message(
    chat_id: &Uuid,
    message_id: &Uuid,
    message: AgentMessage,
) -> Result<(Vec<BusterContainer>, ThreadEvent)> {
    match message {
        AgentMessage::Assistant {
            id,
            content,
            name,
            tool_calls,
            progress,
            initial,
        } => {
            if let Some(content) = content {
                let messages = match transform_text_message(
                    id,
                    content,
                    progress,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .filter(|msg| msg.response_message.message_chunk.is_none()) // Only include completed messages
                        .map(BusterContainer::ChatMessage)
                        .collect(),
                    Err(_) => vec![], // Silently ignore errors by returning empty vec
                };

                return Ok((messages, ThreadEvent::GeneratingResponseMessage));
            }

            if let Some(tool_calls) = tool_calls {
                let messages = match transform_assistant_tool_message(
                    id,
                    tool_calls,
                    progress,
                    initial,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .filter(|msg| match &msg.reasoning {
                            ReasoningMessage::Thought(thought) => thought.status == "completed",
                            ReasoningMessage::File(file) => file.status == "completed",
                        })
                        .map(BusterContainer::ReasoningMessage)
                        .collect(),
                    Err(_) => vec![], // Silently ignore errors by returning empty vec
                };

                return Ok((messages, ThreadEvent::GeneratingReasoningMessage));
            }

            Ok((vec![], ThreadEvent::GeneratingResponseMessage)) // Return empty vec instead of error
        }
        AgentMessage::Tool {
            id,
            content,
            tool_call_id,
            name,
            progress,
        } => {
            if let Some(name) = name {
                let messages = match transform_tool_message(
                    id,
                    name,
                    content,
                    progress,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .filter(|msg| match &msg.reasoning {
                            ReasoningMessage::Thought(thought) => thought.status == "completed",
                            ReasoningMessage::File(file) => file.status == "completed",
                        })
                        .map(BusterContainer::ReasoningMessage)
                        .collect(),
                    Err(_) => vec![], // Silently ignore errors by returning empty vec
                };

                return Ok((messages, ThreadEvent::GeneratingReasoningMessage));
            }

            Ok((vec![], ThreadEvent::GeneratingReasoningMessage)) // Return empty vec instead of error
        }
        _ => Ok((vec![], ThreadEvent::GeneratingResponseMessage)), // Return empty vec instead of error
    }
}

fn transform_text_message(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterChatMessageContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(vec![BusterChatMessageContainer {
                response_message: BusterChatMessage {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    message_type: "text".to_string(),
                    message: None,
                    message_chunk: Some(content),
                },
                chat_id,
                message_id,
            }]),
            MessageProgress::Complete => Ok(vec![BusterChatMessageContainer {
                response_message: BusterChatMessage {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    message_type: "text".to_string(),
                    message: Some(content),
                    message_chunk: None,
                },
                chat_id,
                message_id,
            }]),
            _ => Err(anyhow::anyhow!("Unsupported message progress")),
        }
    } else {
        Ok(vec![BusterChatMessageContainer {
            response_message: BusterChatMessage {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                message_type: "text".to_string(),
                message: None,
                message_chunk: None,
            },
            chat_id,
            message_id,
        }])
    }
}

fn transform_tool_message(
    id: Option<String>,
    name: String,
    content: String,
    progress: Option<MessageProgress>,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterReasoningMessageContainer>> {
    let messages = match name.as_str() {
        "search_data_catalog" => tool_data_catalog_search(id, content, progress),
        "create_files" => tool_create_file(id, content, progress),
        "modify_files" => tool_modify_file(id, content, progress),
        _ => Err(anyhow::anyhow!("Unsupported tool name")),
    }?;

    Ok(messages
        .into_iter()
        .map(|message| BusterReasoningMessageContainer {
            reasoning: match message {
                BusterChatContainer::Thought(thought) => ReasoningMessage::Thought(thought),
                BusterChatContainer::File(file) => ReasoningMessage::File(file),
                _ => unreachable!("Tool messages should only return Thought or File"),
            },
            chat_id,
            message_id,
        })
        .collect())
}

fn transform_assistant_tool_message(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
    initial: bool,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterReasoningMessageContainer>> {
    // Check if there are any tool calls
    if tool_calls.is_empty() {
        return Err(anyhow::anyhow!("Assistant tool message missing tool call"));
    }

    // Access the first tool call safely
    let tool_call = &tool_calls[0];
    let messages = match tool_call.function.name.as_str() {
        "search_data_catalog" => assistant_data_catalog_search(id, progress, initial),
        "create_files" => assistant_create_file(id, tool_calls.clone(), progress),
        "modify_files" => assistant_modify_file(id, tool_calls.clone(), progress),
        _ => Err(anyhow::anyhow!("Unsupported tool name")),
    }?;

    Ok(messages
        .into_iter()
        .map(|message| BusterReasoningMessageContainer {
            reasoning: match message {
                BusterChatContainer::Thought(thought) => ReasoningMessage::Thought(thought),
                BusterChatContainer::File(file) => ReasoningMessage::File(file),
                _ => unreachable!("Assistant tool messages should only return Thought or File"),
            },
            chat_id,
            message_id,
        })
        .collect())
}

fn assistant_data_catalog_search(
    id: Option<String>,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        if initial {
            match progress {
                MessageProgress::InProgress => {
                    let id = id.unwrap_or_else(|| Uuid::new_v4().to_string());

                    Ok(vec![BusterChatContainer::Thought(BusterThought {
                        id,
                        thought_type: "thought".to_string(),
                        thought_title: "Searching your data catalog...".to_string(),
                        thought_secondary_title: "".to_string(),
                        thoughts: None,
                        status: "loading".to_string(),
                    })])
                }
                _ => Err(anyhow::anyhow!(
                    "Assistant data catalog search only supports in progress."
                )),
            }
        } else {
            Err(anyhow::anyhow!(
                "Assistant data catalog search only supports initial."
            ))
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant data catalog search requires progress."
        ))
    }
}

fn tool_data_catalog_search(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        let data_catalog_result = match serde_json::from_str::<SearchDataCatalogOutput>(&content) {
            Ok(result) => result,
            Err(_) => return Ok(vec![]), // Silently ignore parsing errors
        };

        let duration = (data_catalog_result.duration.clone() as f64 / 1000.0 * 10.0).round() / 10.0;
        let result_count = data_catalog_result.results.len();
        let query_params = data_catalog_result.search_requirements.clone();

        let thought_pill_containters =
            match proccess_data_catalog_search_results(data_catalog_result) {
                Ok(object) => object,
                Err(_) => return Ok(vec![]), // Silently ignore processing errors
            };

        let buster_thought = if result_count > 0 {
            BusterChatContainer::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: format!("Found {} results", result_count),
                thought_secondary_title: format!("{} seconds", duration),
                thoughts: Some(thought_pill_containters),
                status: "completed".to_string(),
            })
        } else {
            BusterChatContainer::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "No data catalog items found".to_string(),
                thought_secondary_title: format!("{} seconds", duration),
                thoughts: Some(vec![BusterThoughtPillContainer {
                    title: "No results found".to_string(),
                    thought_pills: vec![BusterThoughtPill {
                        id: "".to_string(),
                        text: query_params,
                        thought_file_type: "empty".to_string(),
                    }],
                }]),
                status: "completed".to_string(),
            })
        };

        match progress {
            MessageProgress::Complete => Ok(vec![buster_thought]),
            _ => Err(anyhow::anyhow!(
                "Tool data catalog search only supports complete."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Tool data catalog search requires progress."
        ))
    }
}

fn proccess_data_catalog_search_results(
    results: SearchDataCatalogOutput,
) -> Result<Vec<BusterThoughtPillContainer>> {
    if results.results.is_empty() {
        return Ok(vec![BusterThoughtPillContainer {
            title: "No results found".to_string(),
            thought_pills: vec![],
        }]);
    }

    let mut file_results: HashMap<String, Vec<BusterThoughtPill>> = HashMap::new();

    for result in results.results {
        file_results
            .entry(result.name.clone().unwrap_or_default())
            .or_insert_with(Vec::new)
            .push(BusterThoughtPill {
                id: result.id.to_string(),
                text: result.name.clone().unwrap_or_default(),
                thought_file_type: result.name.clone().unwrap_or_default(),
            });
    }

    let buster_thought_pill_containers = file_results
        .into_iter()
        .map(|(title, thought_pills)| {
            let count = thought_pills.len();
            BusterThoughtPillContainer {
                title: format!(
                    "{count} {} found",
                    title.chars().next().unwrap().to_uppercase().to_string() + &title[1..]
                ),
                thought_pills,
            }
        })
        .collect();

    Ok(buster_thought_pill_containers)
}

fn assistant_stored_values_search(
    id: Option<String>,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        if initial {
            match progress {
                MessageProgress::InProgress => {
                    Ok(vec![BusterChatContainer::Thought(BusterThought {
                        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                        thought_type: "thought".to_string(),
                        thought_title: "Searching for relevant values...".to_string(),
                        thought_secondary_title: "".to_string(),
                        thoughts: None,
                        status: "loading".to_string(),
                    })])
                }
                _ => Err(anyhow::anyhow!(
                    "Assistant stored values search only supports in progress."
                )),
            }
        } else {
            Err(anyhow::anyhow!(
                "Assistant stored values search only supports initial."
            ))
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant stored values search requires progress."
        ))
    }
}

// TODO: Implmentation for stored values search.
fn tool_stored_values_search(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::Complete => Ok(vec![BusterChatContainer::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "".to_string(),
                thought_secondary_title: "".to_string(),
                thoughts: None,
                status: "completed".to_string(),
            })]),
            _ => Err(anyhow::anyhow!(
                "Tool stored values search only supports complete."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Tool stored values search requires progress."
        ))
    }
}

fn assistant_file_search(
    id: Option<String>,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        if initial {
            match progress {
                MessageProgress::InProgress => {
                    Ok(vec![BusterChatContainer::Thought(BusterThought {
                        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                        thought_type: "thought".to_string(),
                        thought_title: "Searching across your assets...".to_string(),
                        thought_secondary_title: "".to_string(),
                        thoughts: None,
                        status: "loading".to_string(),
                    })])
                }
                _ => Err(anyhow::anyhow!(
                    "Assistant file search only supports in progress."
                )),
            }
        } else {
            Err(anyhow::anyhow!(
                "Assistant file search only supports initial."
            ))
        }
    } else {
        Err(anyhow::anyhow!("Assistant file search requires progress."))
    }
}

fn assistant_create_file(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(vec![]),
            MessageProgress::Complete => {
                // Check if there are any tool calls
                if tool_calls.is_empty() {
                    return Err(anyhow::anyhow!("No tool call found"));
                }

                // Access the first tool call safely
                let tool_call = &tool_calls[0];
                return process_assistant_create_file(tool_call);
            }
            _ => Err(anyhow::anyhow!(
                "Assistant create file only supports in progress and complete."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant create file requires progress."))
    }
}

fn process_assistant_create_file(tool_call: &ToolCall) -> Result<Vec<BusterChatContainer>> {
    // Try to parse the complete arguments directly
    match serde_json::from_str(&tool_call.function.arguments) {
        Ok(value) => {
            let file_data: Value = value;
            if let Some(files) = file_data.get("files").and_then(Value::as_array) {
                if !files.is_empty() {
                    if let Some(file) = files[0].as_object() {
                        let name = file.get("name").and_then(Value::as_str).unwrap_or("");
                        let file_type = file.get("file_type").and_then(Value::as_str).unwrap_or("");
                        let yml_content = file
                            .get("yml_content")
                            .and_then(Value::as_str)
                            .unwrap_or("");

                        let current_lines: Vec<BusterFileLine> = yml_content
                            .lines()
                            .enumerate()
                            .map(|(i, line)| BusterFileLine {
                                line_number: i + 1,
                                text: line.to_string(),
                            })
                            .collect();

                        return Ok(vec![BusterChatContainer::File(BusterFileMessage {
                            id: name.to_string(),
                            message_type: "file".to_string(),
                            file_type: file_type.to_string(),
                            file_name: name.to_string(),
                            version_number: 1,
                            version_id: Uuid::new_v4().to_string(),
                            status: "loading".to_string(),
                            file: Some(current_lines),
                        })]);
                    }
                }
            }
            Ok(vec![])
        }
        Err(_) => Ok(vec![]),
    }
}

fn assistant_modify_file(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Simple loading message for file modification
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Modifying file...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            _ => Err(anyhow::anyhow!(
                "Assistant modify file only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant modify file requires progress."))
    }
}

fn tool_create_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::Complete => {
                // Try to parse the file content from the response
                let file_data: Value = match serde_json::from_str(&content) {
                    Ok(value) => value,
                    Err(_) => return Ok(vec![]), // Silently ignore parsing errors
                };

                let mut messages = Vec::new();

                if let Some(files) = file_data.get("files").and_then(Value::as_array) {
                    for file_obj in files {
                        if let Some(file) = file_obj.as_object() {
                            let name = file.get("name").and_then(Value::as_str).unwrap_or("");
                            let file_type =
                                file.get("file_type").and_then(Value::as_str).unwrap_or("");
                            let yml_content = file
                                .get("yml_content")
                                .and_then(Value::as_str)
                                .unwrap_or("");

                            let current_lines: Vec<BusterFileLine> = yml_content
                                .lines()
                                .enumerate()
                                .map(|(i, line)| BusterFileLine {
                                    line_number: i + 1,
                                    text: line.to_string(),
                                })
                                .collect();

                            messages.push(BusterChatContainer::File(BusterFileMessage {
                                id: Uuid::new_v4().to_string(),
                                message_type: "file".to_string(),
                                file_type: file_type.to_string(),
                                file_name: name.to_string(),
                                version_number: 1,
                                version_id: Uuid::new_v4().to_string(),
                                status: "completed".to_string(),
                                file: Some(current_lines),
                            }));
                        }
                    }
                }

                Ok(messages)
            }
            _ => Err(anyhow::anyhow!("Tool create file only supports complete.")),
        }
    } else {
        Err(anyhow::anyhow!("Tool create file requires progress."))
    }
}

fn tool_modify_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        let duration = 0.1; // File modification is typically very fast

        let buster_thought = BusterChatContainer::Thought(BusterThought {
            id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            thought_type: "thought".to_string(),
            thought_title: "Modified file".to_string(),
            thought_secondary_title: format!("{} seconds", duration),
            thoughts: Some(vec![BusterThoughtPillContainer {
                title: "Modified".to_string(),
                thought_pills: vec![BusterThoughtPill {
                    id: Uuid::new_v4().to_string(),
                    text: content,
                    thought_file_type: "file".to_string(),
                }],
            }]),
            status: "completed".to_string(),
        });

        match progress {
            MessageProgress::Complete => Ok(vec![buster_thought]),
            _ => Err(anyhow::anyhow!("Tool modify file only supports complete.")),
        }
    } else {
        Err(anyhow::anyhow!("Tool modify file requires progress."))
    }
}
