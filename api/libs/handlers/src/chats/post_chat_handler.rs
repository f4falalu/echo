use std::collections::HashMap;

use agents::{
    tools::file_tools::search_data_catalog::SearchDataCatalogOutput, AgentMessage, AgentThread,
    BusterSuperAgent,
};

use anyhow::{anyhow, Result};
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

use crate::chats::streaming_parser::StreamingParser;
use crate::messages::types::{ChatMessage, ChatUserMessage};

use super::types::ChatWithMessages;
use tokio::sync::mpsc;

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

pub async fn post_chat_handler(
    request: ChatCreateNewChat,
    user: User,
    tx: Option<mpsc::Sender<Result<BusterContainer>>>,
) -> Result<ChatWithMessages> {
    let chat_id = request.chat_id.unwrap_or_else(Uuid::new_v4);
    let message_id = request.message_id.unwrap_or_else(Uuid::new_v4);

    let user_org_id = match user.attributes.get("organization_id") {
        Some(Value::String(org_id)) => Uuid::parse_str(&org_id).unwrap_or_default(),
        _ => {
            tracing::error!("User has no organization ID");
            return Err(anyhow!("User has no organization ID"));
        }
    };

    tracing::info!(
        "Starting post_chat_handler for chat_id: {}, message_id: {}, organization_id: {}, user_id: {}",
        chat_id, message_id, user_org_id, user.id
    );

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

    // Create database connection
    let mut conn = get_pg_pool().get().await?;

    // Create chat in database
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

    // Collect all messages for final processing
    let mut all_messages: Vec<AgentMessage> = Vec::new();
    let mut all_transformed_containers: Vec<BusterContainer> = Vec::new();
    let mut final_message: Option<String> = None;

    // Process all messages from the agent
    while let Ok(message_result) = rx.recv().await {
        match message_result {
            Ok(msg) => {
                // Check for final message from manager_agent
                if let AgentMessage::Assistant {
                    name: Some(name),
                    content: Some(content),
                    tool_calls: None,
                    ..
                } = &msg
                {
                    if name == "manager_agent" {
                        final_message = Some(content.clone());
                    }
                }

                // Store the original message
                all_messages.push(msg.clone());

                // Always transform the message
                match transform_message(&chat_id, &message_id, msg) {
                    Ok((containers, _event)) => {
                        // Store all transformed containers
                        for container in containers.clone() {
                            all_transformed_containers.push(container.clone());
                        }

                        // If we have a tx channel, send the transformed messages
                        if let Some(tx) = &tx {
                            for container in containers {
                                if tx.send(Ok(container)).await.is_err() {
                                    // Client disconnected, but continue processing
                                    tracing::warn!(
                                        "Client disconnected, but continuing to process messages"
                                    );
                                    break;
                                }
                            }
                        }
                    }
                    Err(e) => {
                        // Log the error but continue processing
                        tracing::error!("Error transforming message: {}", e);

                        // If we have a tx channel, send the error
                        if let Some(tx) = &tx {
                            let _ = tx.send(Err(e)).await;
                        }
                    }
                }
            }
            Err(e) => {
                // If we have a tx channel, send the error
                if let Some(tx) = &tx {
                    let _ = tx
                        .send(Err(anyhow!("Error receiving message from agent: {}", e)))
                        .await;
                }

                tracing::error!("Error receiving message from agent: {}", e);
                // Don't return early, continue processing remaining messages
            }
        }
    }

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

    // When we get to the section where we transform all messages for the response, use the already transformed containers
    if let Some(chat_message) = chat_with_messages.messages.first_mut() {
        // Split containers into response messages and reasoning messages
        let (response_messages, reasoning_messages): (Vec<_>, Vec<_>) = all_transformed_containers
            .iter()
            .filter_map(|container| match container {
                BusterContainer::ChatMessage(chat) => {
                    if let Some(message_text) = &chat.response_message.message {
                        Some((
                            Some(serde_json::to_value(&chat.response_message).unwrap_or_default()),
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
    pub is_final_message: Option<bool>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThought {
    pub id: String,
    #[serde(rename = "type")]
    pub thought_type: String,
    #[serde(rename = "title")]
    pub thought_title: String,
    #[serde(rename = "secondary_title")]
    pub thought_secondary_title: String,
    #[serde(rename = "pill_containers")]
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
    pub filter_version_id: Option<String>,
    pub metadata: Option<Vec<BusterFileMetadata>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterFileLine {
    pub line_number: usize,
    pub text: String,
    pub modified: Option<bool>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterFileMetadata {
    pub status: String,
    pub message: String,
    pub timestamp: Option<i64>,
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
    println!("MESSAGE_STREAM: Transforming message: {:?}", message);

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
                    Ok(messages) => {
                        let filtered_messages: Vec<BusterContainer> = messages
                            .into_iter()
                            .filter(|msg| msg.response_message.message_chunk.is_none()) // Only include completed messages
                            .map(BusterContainer::ChatMessage)
                            .collect();

                        println!(
                            "MESSAGE_STREAM: Transformed text message into {} containers",
                            filtered_messages.len()
                        );
                        if !filtered_messages.is_empty() {
                            println!(
                                "MESSAGE_STREAM: First container: {:?}",
                                filtered_messages[0]
                            );
                        }

                        filtered_messages
                    }
                    Err(e) => {
                        println!("MESSAGE_STREAM: Error transforming text message: {:?}", e);
                        vec![] // Silently ignore errors by returning empty vec
                    }
                };

                return Ok((messages, ThreadEvent::GeneratingResponseMessage));
            }

            if let Some(tool_calls) = tool_calls {
                let messages = match transform_assistant_tool_message(
                    id,
                    tool_calls.clone(),
                    progress,
                    initial,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => {
                        let filtered_messages: Vec<BusterContainer> = messages
                            .into_iter()
                            .filter(|msg| match &msg.reasoning {
                                ReasoningMessage::Thought(thought) => thought.status == "completed",
                                ReasoningMessage::File(file) => file.status == "completed",
                            })
                            .map(BusterContainer::ReasoningMessage)
                            .collect();

                        println!(
                            "MESSAGE_STREAM: Transformed assistant tool message into {} containers",
                            filtered_messages.len()
                        );
                        if !filtered_messages.is_empty() {
                            println!(
                                "MESSAGE_STREAM: First container: {:?}",
                                filtered_messages[0]
                            );
                        }

                        filtered_messages
                    }
                    Err(e) => {
                        println!(
                            "MESSAGE_STREAM: Error transforming assistant tool message: {:?}",
                            e
                        );
                        vec![] // Silently ignore errors by returning empty vec
                    }
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
                let name_str = name.clone(); // Clone here to use in println later
                let messages = match transform_tool_message(
                    id,
                    name,
                    content.clone(),
                    progress,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => {
                        let filtered_messages: Vec<BusterContainer> = messages
                            .into_iter()
                            .filter(|msg| match &msg.reasoning {
                                ReasoningMessage::Thought(thought) => thought.status == "completed",
                                ReasoningMessage::File(file) => file.status == "completed",
                            })
                            .map(BusterContainer::ReasoningMessage)
                            .collect();

                        println!(
                            "MESSAGE_STREAM: Transformed tool message '{}' into {} containers",
                            name_str,
                            filtered_messages.len()
                        );
                        if !filtered_messages.is_empty() {
                            println!(
                                "MESSAGE_STREAM: First container: {:?}",
                                filtered_messages[0]
                            );
                        }

                        filtered_messages
                    }
                    Err(e) => {
                        println!("MESSAGE_STREAM: Error transforming tool message: {:?}", e);
                        vec![] // Silently ignore errors by returning empty vec
                    }
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
    println!(
        "MESSAGE_STREAM: transform_text_message called with progress: {:?}",
        progress
    );

    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                let container = BusterChatMessageContainer {
                    response_message: BusterChatMessage {
                        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                        message_type: "text".to_string(),
                        message: None,
                        message_chunk: Some(content),
                        is_final_message: Some(false),
                    },
                    chat_id,
                    message_id,
                };
                println!(
                    "MESSAGE_STREAM: Created in-progress text message: {:?}",
                    container
                );
                Ok(vec![container])
            }
            MessageProgress::Complete => {
                let container = BusterChatMessageContainer {
                    response_message: BusterChatMessage {
                        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                        message_type: "text".to_string(),
                        message: Some(content),
                        message_chunk: None,
                        is_final_message: Some(true),
                    },
                    chat_id,
                    message_id,
                };
                println!(
                    "MESSAGE_STREAM: Created complete text message: {:?}",
                    container
                );
                Ok(vec![container])
            }
        }
    } else {
        // Default case
        let container = BusterChatMessageContainer {
            response_message: BusterChatMessage {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                message_type: "text".to_string(),
                message: None,
                message_chunk: None,
                is_final_message: Some(false),
            },
            chat_id,
            message_id,
        };
        println!(
            "MESSAGE_STREAM: Created default text message: {:?}",
            container
        );
        Ok(vec![container])
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
    let name_str = name.clone(); // Clone here to use in println later
    println!(
        "MESSAGE_STREAM: transform_tool_message called with name: {}",
        name_str
    );

    let messages = match name.as_str() {
        "search_data_catalog" => tool_data_catalog_search(id, content.clone(), progress),
        "create_files" => tool_create_file(id.clone(), content.clone(), progress),
        "modify_files" => tool_modify_file(id.clone(), content.clone(), progress),
        "create_metrics" => tool_create_metrics(id.clone(), content.clone(), progress),
        "update_metrics" => tool_modify_metrics(id.clone(), content.clone(), progress),
        "create_dashboards" => tool_create_dashboards(id.clone(), content.clone(), progress),
        "update_dashboards" => tool_modify_dashboards(id.clone(), content.clone(), progress),
        "create_plan" => tool_create_plan(id, content.clone(), progress),
        _ => {
            println!("MESSAGE_STREAM: Unsupported tool name: {}", name_str);
            Err(anyhow::anyhow!("Unsupported tool name: {}", name))
        }
    }?;

    println!(
        "MESSAGE_STREAM: transform_tool_message for '{}' returning {} containers",
        name_str,
        messages.len()
    );
    if !messages.is_empty() {
        println!("MESSAGE_STREAM: First container: {:?}", messages[0]);
    }

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
    println!(
        "MESSAGE_STREAM: transform_assistant_tool_message called with tool_calls: {:?}",
        tool_calls
    );

    if tool_calls.is_empty() {
        println!("MESSAGE_STREAM: No tool calls found");
        return Ok(vec![]);
    }

    let tool_call = &tool_calls[0];
    let messages = match tool_call.function.name.as_str() {
        "search_data_catalog" => assistant_data_catalog_search(id, progress, initial),
        "create_metrics" => assistant_create_metrics(id, tool_calls.clone(), progress),
        "update_metrics" => assistant_modify_metrics(id, tool_calls.clone(), progress),
        "create_dashboards" => assistant_create_dashboards(id, tool_calls.clone(), progress),
        "update_dashboards" => assistant_modify_dashboards(id, tool_calls.clone(), progress),
        "create_plan" => assistant_create_plan(id, tool_calls.clone(), progress),
        _ => Err(anyhow::anyhow!(
            "Unsupported tool name: {}",
            tool_call.function.name
        )),
    }?;

    println!(
        "MESSAGE_STREAM: transform_assistant_tool_message returning {} containers",
        messages.len()
    );
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

fn assistant_create_metrics(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Simple loading message for metric creation
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Creating metrics...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                println!("MESSAGE_STREAM: Processing complete create metrics message");
                // Check if there are any tool calls
                if tool_calls.is_empty() {
                    return Err(anyhow::anyhow!("No tool call found"));
                }

                // Access the first tool call safely
                let tool_call = &tool_calls[0];
                return process_assistant_create_metrics(tool_call);
            }
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant create metrics requires progress."
        ))
    }
}

fn process_assistant_create_metrics(tool_call: &ToolCall) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_create_metrics called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(&tool_call.function.arguments)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced metric message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!(
                "MESSAGE_STREAM: StreamingParser returned None for metrics, waiting for more data"
            );
            Ok(vec![]) // Return empty vec instead of error when waiting for file data
        }
    }
}

fn assistant_modify_metrics(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Simple loading message for metric modification
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Updating metrics...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                println!("MESSAGE_STREAM: Processing complete modify metrics message");
                // Check if there are any tool calls
                if tool_calls.is_empty() {
                    return Err(anyhow::anyhow!("No tool call found"));
                }

                // Access the first tool call safely
                let tool_call = &tool_calls[0];
                return process_assistant_modify_metrics(tool_call);
            }
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant modify metrics requires progress."
        ))
    }
}

fn process_assistant_modify_metrics(tool_call: &ToolCall) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_modify_metrics called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(&tool_call.function.arguments)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced modify metric message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: StreamingParser returned None for modify metrics, waiting for more data");
            Ok(vec![]) // Return empty vec instead of error when waiting for file data
        }
    }
}

fn assistant_create_dashboards(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Simple loading message for dashboard creation
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Creating dashboards...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                println!("MESSAGE_STREAM: Processing complete create dashboards message");
                // Check if there are any tool calls
                if tool_calls.is_empty() {
                    return Err(anyhow::anyhow!("No tool call found"));
                }

                // Access the first tool call safely
                let tool_call = &tool_calls[0];
                return process_assistant_create_dashboards(tool_call);
            }
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant create dashboards requires progress."
        ))
    }
}

fn process_assistant_create_dashboards(tool_call: &ToolCall) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_create_dashboards called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(&tool_call.function.arguments)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced dashboard message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: StreamingParser returned None for dashboards, waiting for more data");
            Ok(vec![]) // Return empty vec instead of error when waiting for file data
        }
    }
}

fn assistant_modify_dashboards(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Simple loading message for dashboard modification
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Updating dashboards...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                println!("MESSAGE_STREAM: Processing complete modify dashboards message");
                // Check if there are any tool calls
                if tool_calls.is_empty() {
                    return Err(anyhow::anyhow!("No tool call found"));
                }

                // Access the first tool call safely
                let tool_call = &tool_calls[0];
                return process_assistant_modify_dashboards(tool_call);
            }
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant modify dashboards requires progress."
        ))
    }
}

fn process_assistant_modify_dashboards(tool_call: &ToolCall) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_modify_dashboards called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(&tool_call.function.arguments)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced modify dashboard message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: StreamingParser returned None for modify dashboards, waiting for more data");
            Ok(vec![]) // Return empty vec instead of error when waiting for file data
        }
    }
}

fn tool_create_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: tool_create_file called with content: {}",
        content
    );

    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Return a loading thought for in-progress file creation
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Creating file...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                // Process the completed file creation
                let mut parser = StreamingParser::new();
                match parser.process_chunk(&content)? {
                    Some(message) => {
                        println!(
                            "MESSAGE_STREAM: StreamingParser produced file message from tool: {:?}",
                            message
                        );
                        Ok(vec![message])
                    }
                    None => {
                        println!(
                            "MESSAGE_STREAM: StreamingParser returned None for create file tool"
                        );
                        Ok(vec![]) // Return empty vec instead of error
                    }
                }
            }
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
    println!(
        "MESSAGE_STREAM: tool_modify_file called with content: {}",
        content
    );

    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Return a loading thought for in-progress file modification
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Modifying file...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                // Process the completed file modification
                let mut parser = StreamingParser::new();
                match parser.process_chunk(&content)? {
                    Some(message) => {
                        println!("MESSAGE_STREAM: StreamingParser produced modify file message from tool: {:?}", message);
                        Ok(vec![message])
                    }
                    None => {
                        println!(
                            "MESSAGE_STREAM: StreamingParser returned None for modify file tool"
                        );
                        Ok(vec![]) // Return empty vec instead of error
                    }
                }
            }
        }
    } else {
        Err(anyhow::anyhow!("Tool modify file requires progress."))
    }
}

fn tool_create_metrics(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: tool_create_metrics called with content: {}",
        content
    );

    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Return a loading thought for in-progress metrics
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Creating metrics...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                // Process the completed metrics
                let mut parser = StreamingParser::new();
                match parser.process_chunk(&content)? {
                    Some(message) => {
                        println!("MESSAGE_STREAM: StreamingParser produced metric message from tool: {:?}", message);
                        Ok(vec![message])
                    }
                    None => {
                        println!("MESSAGE_STREAM: StreamingParser returned None for metrics tool");
                        Ok(vec![]) // Return empty vec instead of error
                    }
                }
            }
        }
    } else {
        Err(anyhow::anyhow!("Tool create metrics requires progress."))
    }
}

fn tool_modify_metrics(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: tool_modify_metrics called with content: {}",
        content
    );

    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Return a loading thought for in-progress metric modifications
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Updating metrics...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                // Process the completed metric modifications
                let mut parser = StreamingParser::new();
                match parser.process_chunk(&content)? {
                    Some(message) => {
                        println!("MESSAGE_STREAM: StreamingParser produced modify metric message from tool: {:?}", message);
                        Ok(vec![message])
                    }
                    None => {
                        println!(
                            "MESSAGE_STREAM: StreamingParser returned None for modify metrics tool"
                        );
                        Ok(vec![]) // Return empty vec instead of error
                    }
                }
            }
        }
    } else {
        Err(anyhow::anyhow!("Tool modify metrics requires progress."))
    }
}

fn tool_create_dashboards(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: tool_create_dashboards called with content: {}",
        content
    );

    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Return a loading thought for in-progress dashboards
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Creating dashboards...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                // Process the completed dashboards
                let mut parser = StreamingParser::new();
                match parser.process_chunk(&content)? {
                    Some(message) => {
                        println!("MESSAGE_STREAM: StreamingParser produced dashboard message from tool: {:?}", message);
                        Ok(vec![message])
                    }
                    None => {
                        println!(
                            "MESSAGE_STREAM: StreamingParser returned None for dashboards tool"
                        );
                        Ok(vec![]) // Return empty vec instead of error
                    }
                }
            }
        }
    } else {
        Err(anyhow::anyhow!("Tool create dashboards requires progress."))
    }
}

fn tool_modify_dashboards(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: tool_modify_dashboards called with content: {}",
        content
    );

    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Return a loading thought for in-progress dashboard modifications
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Updating dashboards...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                // Process the completed dashboard modifications
                let mut parser = StreamingParser::new();
                match parser.process_chunk(&content)? {
                    Some(message) => {
                        println!("MESSAGE_STREAM: StreamingParser produced modify dashboard message from tool: {:?}", message);
                        Ok(vec![message])
                    }
                    None => {
                        println!("MESSAGE_STREAM: StreamingParser returned None for modify dashboards tool");
                        Ok(vec![]) // Return empty vec instead of error
                    }
                }
            }
        }
    } else {
        Err(anyhow::anyhow!("Tool modify dashboards requires progress."))
    }
}

fn assistant_create_plan(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Simple loading message for metric creation
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    thought_type: "thought".to_string(),
                    thought_title: "Creating metrics...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            MessageProgress::Complete => {
                println!("MESSAGE_STREAM: Processing complete create metrics message");
                // Check if there are any tool calls
                if tool_calls.is_empty() {
                    return Err(anyhow::anyhow!("No tool call found"));
                }

                // Access the first tool call safely
                let tool_call = &tool_calls[0];
                return process_assistant_create_metrics(tool_call);
            }
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant create metrics requires progress."
        ))
    }
}

fn tool_create_plan(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: tool_create_plan called with content: {}",
        content
    );

    Ok(vec![])
}
