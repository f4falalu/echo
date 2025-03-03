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
use litellm::{
    AgentMessage as LiteLLMAgentMessage, ChatCompletionRequest, LiteLLMClient, MessageProgress,
    Metadata, ToolCall,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::chats::streaming_parser::StreamingParser;
use crate::messages::types::{ChatMessage, ChatUserMessage};

use super::types::ChatWithMessages;
use futures::{stream::Stream, StreamExt};
use tokio::sync::mpsc;

// Define ThreadEvent
#[derive(Clone, Copy, Debug)]
pub enum ThreadEvent {
    GeneratingResponseMessage,
    GeneratingReasoningMessage,
    GeneratingTitle,
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
    tx: Option<mpsc::Sender<Result<(BusterContainer, ThreadEvent)>>>,
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

    let title_handle = {
        let tx = tx.clone();
        let chat_id = chat_id.clone();
        let message_id = message_id.clone();
        let user_id = user.id.clone();
        let chat_messages = chat.messages.clone();
        tokio::spawn(async move {
            generate_conversation_title(&chat_messages, &message_id, &user_id, &chat_id, tx).await
        })
    };

    // Get the receiver and collect all messages
    let mut rx = agent.run(&mut chat).await?;

    // Collect all messages for final processing
    let mut all_messages: Vec<AgentMessage> = Vec::new();
    let mut all_transformed_containers: Vec<BusterContainer> = Vec::new();

    // Process all messages from the agent
    while let Ok(message_result) = rx.recv().await {
        match message_result {
            Ok(msg) => {
                // Store the original message
                all_messages.push(msg.clone());

                // Always transform the message
                match transform_message(&chat_id, &message_id, msg) {
                    Ok((containers, event)) => {
                        // Store all transformed containers
                        for container in containers.clone() {
                            all_transformed_containers.push(container.clone());
                        }

                        // If we have a tx channel, send the transformed messages
                        if let Some(tx) = &tx {
                            for container in containers {
                                if tx.send(Ok((container, event.clone()))).await.is_err() {
                                    // Client disconnected, but continue processing messages
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

    let title = title_handle.await??;

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
                        BusterReasoningMessage::Pill(thought) => serde_json::to_value(thought).ok(),
                        BusterReasoningMessage::File(file) => serde_json::to_value(file).ok(),
                        BusterReasoningMessage::Text(text) => serde_json::to_value(text).ok(),
                    };

                    if let Some(value) = reasoning_value {
                        Some((None, Some(value)))
                    } else {
                        None
                    }
                }
                _ => None,
            })
            .unzip();

        // Collect valid response messages
        let mut final_response_messages: Vec<Value> =
            response_messages.into_iter().flatten().collect();

        // Update the chat message with processed content
        chat_message.response_messages = final_response_messages;
        chat_message.reasoning = reasoning_messages.into_iter().flatten().collect();
    }

    if let Some(title) = title.title {
        chat_with_messages.title = title;
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
                BusterReasoningMessage::File(file) if file.file_type == "metric" => {
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
                BusterReasoningMessage::File(file) if file.file_type == "dashboard" => {
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
    Thought(BusterReasoningPill),
    File(BusterReasoningFile),
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterChatMessageContainer {
    pub response_message: BusterChatMessage,
    pub chat_id: Uuid,
    pub message_id: Uuid,
}

#[derive(Debug, Serialize, Clone)]
#[serde(untagged)]
pub enum BusterReasoningMessage {
    Pill(BusterReasoningPill),
    File(BusterReasoningFile),
    Text(BusterReasoningText),
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterReasoningMessageContainer {
    pub reasoning: BusterReasoningMessage,
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
pub struct BusterReasoningPill {
    pub id: String,
    #[serde(rename = "type")]
    pub thought_type: String,
    pub title: String,
    pub secondary_title: String,
    pub pill_containers: Option<Vec<BusterThoughtPillContainer>>,
    pub status: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterReasoningText {
    pub id: String,
    #[serde(rename = "type")]
    pub reasoning_type: String,
    pub title: String,
    pub secondary_title: Option<String>,
    pub message: Option<String>,
    pub message_chunk: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThoughtPillContainer {
    pub title: String,
    pub pills: Vec<BusterThoughtPill>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThoughtPill {
    pub id: String,
    pub text: String,
    #[serde(rename = "type")]
    pub thought_file_type: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterReasoningFile {
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
    GeneratingTitle(BusterGeneratingTitle),
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
                    id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    content,
                    progress,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .map(|msg| {
                            BusterContainer::ChatMessage(BusterChatMessageContainer {
                                response_message: msg,
                                chat_id: chat_id.clone(),
                                message_id: message_id.clone(),
                            })
                        })
                        .collect(),
                    Err(e) => {
                        tracing::warn!("Error transforming text message: {:?}", e);
                        println!("MESSAGE_STREAM: Error transforming text message: {:?}", e);
                        vec![] // Return empty vec but warn about the error
                    }
                };

                return Ok((messages, ThreadEvent::GeneratingResponseMessage));
            }

            if let Some(tool_calls) = tool_calls {
                let messages = match transform_assistant_tool_message(
                    tool_calls.clone(),
                    progress,
                    initial,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .map(BusterContainer::ReasoningMessage)
                        .collect(),
                    Err(e) => {
                        tracing::warn!("Error transforming assistant tool message: {:?}", e);
                        println!(
                            "MESSAGE_STREAM: Error transforming assistant tool message: {:?}",
                            e
                        );
                        vec![] // Return empty vec but warn about the error
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

                // Use tool_call_id directly as it's already a String
                let messages = match transform_tool_message(
                    tool_call_id,
                    name,
                    content.clone(),
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .map(BusterContainer::ReasoningMessage)
                        .collect(),
                    Err(e) => {
                        tracing::warn!("Error transforming tool message '{}': {:?}", name_str, e);
                        println!("MESSAGE_STREAM: Error transforming tool message: {:?}", e);
                        vec![] // Return empty vec but warn about the error
                    }
                };

                return Ok((messages, ThreadEvent::GeneratingReasoningMessage));
            }

            Ok((vec![], ThreadEvent::GeneratingResponseMessage)) // Return empty vec instead of error
        }
        _ => Ok((vec![], ThreadEvent::GeneratingResponseMessage)), // Return empty vec instead of error
    }
}

fn transform_text_message(
    id: String,
    content: String,
    progress: MessageProgress,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterChatMessage>> {
    println!(
        "MESSAGE_STREAM: transform_text_message called with progress: {:?}",
        progress
    );

    match progress {
        MessageProgress::InProgress => {
            let container = BusterChatMessage {
                id: id.clone(),
                message_type: "text".to_string(),
                message: None,
                message_chunk: Some(content),
                is_final_message: Some(false),
            };
            println!(
                "MESSAGE_STREAM: Created in-progress text message: {:?}",
                container
            );
            Ok(vec![container])
        }
        MessageProgress::Complete => {
            let container = BusterChatMessage {
                id: id.clone(),
                message_type: "text".to_string(),
                message: Some(content),
                message_chunk: None,
                is_final_message: Some(true),
            };
            println!(
                "MESSAGE_STREAM: Created complete text message: {:?}",
                container
            );
            Ok(vec![container])
        }
    }
}

// Update transform_tool_message to require ID and not include progress parameter
fn transform_tool_message(
    id: String,
    name: String,
    content: String,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterReasoningMessageContainer>> {
    // Use required ID (tool call ID) for all function calls
    let messages = match name.as_str() {
        "search_data_catalog" => tool_data_catalog_search(id.clone(), content)?,
        "create_metrics" => tool_create_metrics(id.clone(), content)?,
        "modify_metrics" => tool_modify_metrics(id.clone(), content)?,
        "create_dashboards" => tool_create_dashboards(id.clone(), content)?,
        "modify_dashboards" => tool_modify_dashboards(id.clone(), content)?,
        "create_plan" => return Ok(vec![]), // Return empty vec wrapped in Ok
        _ => return Err(anyhow::anyhow!("Unknown tool name: {}", name)),
    };

    // Convert BusterReasoningMessage to BusterReasoningMessageContainer
    let reasoning_containers = messages
        .into_iter()
        .map(|reasoning| BusterReasoningMessageContainer {
            reasoning,
            chat_id,
            message_id,
        })
        .collect();

    Ok(reasoning_containers)
}

// Update tool_create_metrics to require ID
fn tool_create_metrics(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    println!("MESSAGE_STREAM: Processing tool create metrics message");

    let mut parser = StreamingParser::new();

    match parser.process_metric_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced create metrics message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid metrics data found in content");
            Err(anyhow::anyhow!("Failed to parse metrics data from content"))
        }
    }
}

// Update tool_modify_metrics to require ID
fn tool_modify_metrics(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    println!("MESSAGE_STREAM: Processing tool modify metrics message");

    let mut parser = StreamingParser::new();

    match parser.process_metric_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced modify metrics message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid metrics data found in content");
            Err(anyhow::anyhow!("Failed to parse metrics data from content"))
        }
    }
}

// Update tool_create_dashboards to require ID
fn tool_create_dashboards(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    println!("MESSAGE_STREAM: Processing tool create dashboards message");

    let mut parser = StreamingParser::new();

    match parser.process_dashboard_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced create dashboards message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid dashboard data found in content");
            Err(anyhow::anyhow!(
                "Failed to parse dashboard data from content"
            ))
        }
    }
}

// Update tool_modify_dashboards to require ID
fn tool_modify_dashboards(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    println!("MESSAGE_STREAM: Processing tool modify dashboards message");

    let mut parser = StreamingParser::new();

    match parser.process_dashboard_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced modify dashboard message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid dashboard data found in content");
            Err(anyhow::anyhow!(
                "Failed to parse dashboard data from content"
            ))
        }
    }
}

// Restore the original tool_data_catalog_search function
fn tool_data_catalog_search(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    let data_catalog_result = match serde_json::from_str::<SearchDataCatalogOutput>(&content) {
        Ok(result) => result,
        Err(e) => {
            println!("Failed to parse SearchDataCatalogOutput: {:?}", e);
            return Ok(vec![]);
        }
    };

    let duration = (data_catalog_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;
    let result_count = data_catalog_result.results.len();
    let query_params = data_catalog_result.search_requirements.clone();

    let thought_pill_containers = match proccess_data_catalog_search_results(data_catalog_result) {
        Ok(containers) => containers,
        Err(e) => {
            println!("Failed to process data catalog search results: {:?}", e);
            return Ok(vec![]);
        }
    };

    let buster_thought = if result_count > 0 {
        BusterReasoningMessage::Pill(BusterReasoningPill {
            id: id.clone(),
            thought_type: "pills".to_string(),
            title: format!("Found {} results", result_count),
            secondary_title: format!("{} seconds", duration),
            pill_containers: Some(thought_pill_containers),
            status: "completed".to_string(),
        })
    } else {
        BusterReasoningMessage::Pill(BusterReasoningPill {
            id: id.clone(),
            thought_type: "pills".to_string(),
            title: "No data catalog items found".to_string(),
            secondary_title: format!("{} seconds", duration),
            pill_containers: Some(vec![BusterThoughtPillContainer {
                title: "No results found".to_string(),
                pills: vec![BusterThoughtPill {
                    id: "".to_string(),
                    text: query_params,
                    thought_file_type: "empty".to_string(),
                }],
            }]),
            status: "completed".to_string(),
        })
    };

    Ok(vec![buster_thought])
}

fn proccess_data_catalog_search_results(
    results: SearchDataCatalogOutput,
) -> Result<Vec<BusterThoughtPillContainer>> {
    if results.results.is_empty() {
        return Ok(vec![BusterThoughtPillContainer {
            title: "No results found".to_string(),
            pills: vec![],
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
                pills: thought_pills,
            }
        })
        .collect();

    Ok(buster_thought_pill_containers)
}

fn transform_assistant_tool_message(
    tool_calls: Vec<ToolCall>,
    progress: MessageProgress,
    initial: bool,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterReasoningMessageContainer>> {
    println!(
        "MESSAGE_STREAM: transform_assistant_tool_message called with {} tool_calls",
        tool_calls.len()
    );

    if tool_calls.is_empty() {
        println!("MESSAGE_STREAM: No tool calls found");
        return Ok(vec![]);
    }

    let mut all_messages = Vec::new();

    // Process each tool call individually
    for tool_call in &tool_calls {
        let tool_id = tool_call.id.clone();

        // Always use the assistant_* functions, passing both arguments and progress
        // Clone progress for each iteration to avoid moved value errors
        let messages = match tool_call.function.name.as_str() {
            "search_data_catalog" => assistant_data_catalog_search(
                tool_id,
                tool_call.function.arguments.clone(),
                progress.clone(),
                initial,
            )?,
            "create_metrics" => assistant_create_metrics(
                tool_id,
                tool_call.function.arguments.clone(),
                progress.clone(),
                initial,
            )?,
            "modify_metrics" => assistant_modify_metrics(
                tool_id,
                tool_call.function.arguments.clone(),
                progress.clone(),
                initial,
            )?,
            "create_dashboards" => assistant_create_dashboards(
                tool_id,
                tool_call.function.arguments.clone(),
                progress.clone(),
                initial,
            )?,
            "modify_dashboards" => assistant_modify_dashboards(
                tool_id,
                tool_call.function.arguments.clone(),
                progress.clone(),
                initial,
            )?,
            "create_plan" => assistant_create_plan(
                tool_id,
                tool_call.function.arguments.clone(),
                progress.clone(),
                initial,
            )?,
            _ => {
                println!(
                    "MESSAGE_STREAM: Unknown tool name: {}",
                    tool_call.function.name
                );
                vec![]
            }
        };

        // Convert BusterReasoningMessage to BusterReasoningMessageContainer
        let containers: Vec<BusterReasoningMessageContainer> = messages
            .into_iter()
            .map(|reasoning| BusterReasoningMessageContainer {
                reasoning,
                chat_id,
                message_id,
            })
            .collect();

        all_messages.extend(containers);
    }

    Ok(all_messages)
}

// Fix the assistant_data_catalog_search function to return BusterReasoningMessage instead of BusterChatContainer
fn assistant_data_catalog_search(
    id: String,
    content: String,
    progress: MessageProgress,
    initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    if let Ok(Some(message)) = parser.process_search_data_catalog_chunk(id.clone(), &content) {
        match message {
            BusterReasoningMessage::Text(text) => {
                return Ok(vec![BusterReasoningMessage::Text(text)]);
            }
            _ => unreachable!("Data catalog search should only return Text type"),
        }
    }

    // Fall back to existing logic for full search results
    let data_catalog_result = match serde_json::from_str::<SearchDataCatalogOutput>(&content) {
        Ok(result) => result,
        Err(e) => {
            println!("Failed to parse SearchDataCatalogOutput: {:?}", e);
            return Ok(vec![]);
        }
    };

    let duration = (data_catalog_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;
    let result_count = data_catalog_result.results.len();
    let query_params = data_catalog_result.search_requirements.clone();

    let thought_pill_containers = match proccess_data_catalog_search_results(data_catalog_result) {
        Ok(containers) => containers,
        Err(e) => {
            println!("Failed to process data catalog search results: {:?}", e);
            return Ok(vec![]);
        }
    };

    let thought = if result_count > 0 {
        BusterReasoningMessage::Pill(BusterReasoningPill {
            id: id.clone(),
            thought_type: "thought".to_string(),
            title: format!("Found {} results", result_count),
            secondary_title: format!("{} seconds", duration),
            pill_containers: Some(thought_pill_containers),
            status: "completed".to_string(),
        })
    } else {
        BusterReasoningMessage::Pill(BusterReasoningPill {
            id: id.clone(),
            thought_type: "thought".to_string(),
            title: "No data catalog items found".to_string(),
            secondary_title: format!("{} seconds", duration),
            pill_containers: Some(vec![BusterThoughtPillContainer {
                title: "No results found".to_string(),
                pills: vec![BusterThoughtPill {
                    id: "".to_string(),
                    text: query_params,
                    thought_file_type: "empty".to_string(),
                }],
            }]),
            status: "completed".to_string(),
        })
    };

    Ok(vec![thought])
}

fn assistant_create_metrics(
    id: String,
    content: String,
    progress: MessageProgress,
    initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    match parser.process_metric_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            let status = match progress {
                MessageProgress::InProgress => "loading",
                MessageProgress::Complete => "completed",
                _ => "loading",
            };

            // Update status in the message if it's a File type
            match message {
                BusterReasoningMessage::File(mut file) => {
                    file.status = status.to_string();
                    Ok(vec![BusterReasoningMessage::File(file)])
                }
                _ => Ok(vec![message]),
            }
        }
        Ok(None) => Ok(vec![]),
        Err(e) => Err(e),
    }
}

fn assistant_modify_metrics(
    id: String,
    content: String,
    progress: MessageProgress,
    initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    match parser.process_metric_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            let status = match progress {
                MessageProgress::InProgress => "loading",
                MessageProgress::Complete => "completed",
            };

            // Update status in the message if it's a File type
            match message {
                BusterReasoningMessage::File(mut file) => {
                    file.status = status.to_string();
                    Ok(vec![BusterReasoningMessage::File(file)])
                }
                _ => Ok(vec![message]),
            }
        }
        Ok(None) => Ok(vec![]),
        Err(e) => Err(e),
    }
}

fn assistant_create_dashboards(
    id: String,
    content: String,
    progress: MessageProgress,
    initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    match parser.process_dashboard_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            let status = match progress {
                MessageProgress::InProgress => "loading",
                MessageProgress::Complete => "completed",
            };

            // Update status in the message if it's a File type
            match message {
                BusterReasoningMessage::File(mut file) => {
                    file.status = status.to_string();
                    Ok(vec![BusterReasoningMessage::File(file)])
                }
                _ => Ok(vec![message]),
            }
        }
        Ok(None) => Ok(vec![]),
        Err(e) => Err(e),
    }
}

// Fix for the modify_dashboards function to return BusterReasoningMessage instead of BusterChatContainer
fn assistant_modify_dashboards(
    id: String,
    content: String,
    progress: MessageProgress,
    initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    match parser.process_dashboard_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            let status = match progress {
                MessageProgress::InProgress => "loading",
                MessageProgress::Complete => "completed",
                _ => "loading",
            };

            // Update status in the message if it's a File type
            match message {
                BusterReasoningMessage::File(mut file) => {
                    file.status = status.to_string();
                    Ok(vec![BusterReasoningMessage::File(file)])
                }
                _ => Ok(vec![message]),
            }
        }
        Ok(None) => Ok(vec![]),
        Err(e) => Err(e),
    }
}

fn assistant_create_plan(
    id: String,
    content: String,
    progress: MessageProgress,
    initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    // Process both in-progress and complete messages for plan creation
    match parser.process_plan_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            let status = match progress {
                MessageProgress::InProgress => "loading",
                MessageProgress::Complete => "completed",
                _ => "loading",
            };

            // Convert BusterReasoningMessage to BusterChatContainer and update status
            match message {
                BusterReasoningMessage::Text(text) => {
                    // Create a thought pill container for the plan text
                    let plan_container = BusterThoughtPillContainer {
                        title: text.title.clone(),
                        pills: vec![BusterThoughtPill {
                            id: Uuid::new_v4().to_string(),
                            text: text.message.unwrap_or_default(),
                            thought_file_type: "markdown".to_string(),
                        }],
                    };

                    Ok(vec![BusterReasoningMessage::Pill(BusterReasoningPill {
                        id: text.id,
                        thought_type: "thought".to_string(),
                        title: text.title,
                        secondary_title: text.secondary_title.unwrap_or_default(),
                        pill_containers: Some(vec![plan_container]),
                        status: status.to_string(),
                    })])
                }
                BusterReasoningMessage::File(mut file) => {
                    file.status = status.to_string();
                    Ok(vec![BusterReasoningMessage::File(file)])
                }
                BusterReasoningMessage::Pill(mut thought) => {
                    thought.status = status.to_string();
                    Ok(vec![BusterReasoningMessage::Pill(thought)])
                }
            }
        }
        Ok(None) => Ok(vec![]),
        Err(e) => Err(e),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum BusterGeneratingTitleProgress {
    Completed,
    InProgress,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterGeneratingTitle {
    pub chat_id: Uuid,
    pub message_id: Uuid,
    pub title: Option<String>,
    pub title_chunk: Option<String>,
    pub progress: BusterGeneratingTitleProgress,
}

// Conversation title generation functionality
// -----------------------------------------

// Constants for title generation
const TITLE_GENERATION_PROMPT: &str = r#"
You are a conversation title generator. Your task is to generate a clear, concise, and descriptive title for a conversation based on the user messages and assistant responses provided.

Guidelines:
1. The title should be 3-10 words and should capture the core topic or intent of the conversation
2. Focus on key topics, questions, or themes from the conversation
3. Be specific rather than generic when possible
4. Avoid phrases like "Conversation about..." or "Discussion on..."
5. Don't include mentions of yourself in the title
6. The title should make sense out of context
7. Pay attention to the most recent messages to guide topic changes, etc.

Conversation:
{conversation_messages}

Return only the title text with no additional formatting, explanation, quotes, new lines, special characters, etc.
"#;

/// Generates a title for a conversation by processing user and assistant messages.
/// The function streams the title back as it's being generated.
pub async fn generate_conversation_title(
    messages: &[AgentMessage],
    message_id: &Uuid,
    user_id: &Uuid,
    session_id: &Uuid,
    tx: Option<mpsc::Sender<Result<(BusterContainer, ThreadEvent)>>>,
) -> Result<BusterGeneratingTitle> {
    // Format conversation messages for the prompt
    let mut formatted_messages = vec![];
    for message in messages {
        if message.get_role() == "user"
            || (message.get_role() == "assistant" && message.get_content().is_some())
        {
            formatted_messages.push(format!(
                "{}: {}",
                message.get_role(),
                message.get_content().unwrap_or_default()
            ));
        }
    }

    let formatted_messages = formatted_messages.join("\n\n");
    // Create the prompt with the formatted messages
    let prompt = TITLE_GENERATION_PROMPT.replace("{conversation_messages}", &formatted_messages);

    // Set up LiteLLM client
    let llm_client = LiteLLMClient::new(None, None);

    // Create the request
    let request = ChatCompletionRequest {
        model: "gemini-2".to_string(),
        messages: vec![LiteLLMAgentMessage::User {
            id: None,
            content: prompt,
            name: None,
        }],
        metadata: Some(Metadata {
            generation_name: "conversation_title".to_string(),
            user_id: user_id.to_string(),
            session_id: session_id.to_string(),
            trace_id: session_id.to_string(),
        }),
        ..Default::default()
    };

    // Get streaming response - use chat_completion with stream parameter set to true
    let response = match llm_client.chat_completion(request).await {
        Ok(response) => response,
        Err(e) => {
            return Err(anyhow::anyhow!("Failed to start title generation: {}", e));
        }
    };

    // Parse LLM response
    let content = match &response.choices[0].message {
        AgentMessage::Assistant {
            content: Some(content),
            ..
        } => content,
        _ => {
            tracing::error!("LLM response missing content");
            return Err(anyhow::anyhow!("LLM response missing content"));
        }
    };

    let title = BusterGeneratingTitle {
        chat_id: session_id.clone(),
        message_id: message_id.clone(),
        title: Some(content.clone().replace("\n", "")),
        title_chunk: None,
        progress: BusterGeneratingTitleProgress::Completed,
    };

    if let Some(tx) = tx {
        tx.send(Ok((
            BusterContainer::GeneratingTitle(title.clone()),
            ThreadEvent::GeneratingTitle,
        )))
        .await?;
    }

    Ok(title)
}
