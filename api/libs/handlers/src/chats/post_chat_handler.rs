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
#[derive(Clone, Copy, Debug)]
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

// Update transform_tool_message to require ID and not include progress parameter
fn transform_tool_message(
    id: String,
    name: String,
    content: String,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterReasoningMessageContainer>> {
    // Use required ID (tool call ID) for all function calls
    let containers = match name.as_str() {
        "search_data_catalog" => tool_data_catalog_search(id.clone(), content)?,
        "create_file" => tool_create_file(id.clone(), content)?,
        "modify_file" => tool_modify_file(id.clone(), content)?,
        "create_metrics" => tool_create_metrics(id.clone(), content)?,
        "modify_metrics" => tool_modify_metrics(id.clone(), content)?,
        "create_dashboards" => tool_create_dashboards(id.clone(), content)?,
        "modify_dashboards" => tool_modify_dashboards(id.clone(), content)?,
        "create_plan" => tool_create_plan(id.clone(), content)?,
        _ => return Err(anyhow::anyhow!("Unknown tool name: {}", name)),
    };

    // Transform to reasoning containers
    let reasoning_containers = transform_to_reasoning_container(containers, chat_id, message_id);
    Ok(reasoning_containers)
}

// Update tool_create_metrics to require ID
fn tool_create_metrics(
    id: String,
    content: String,
) -> Result<Vec<BusterChatContainer>> {
    println!("MESSAGE_STREAM: Processing tool create metrics message");
    
    let mut parser = StreamingParser::new();
    
    match parser.process_chunk(id, &content)? {
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
fn tool_modify_metrics(
    id: String,
    content: String,
) -> Result<Vec<BusterChatContainer>> {
    println!("MESSAGE_STREAM: Processing tool modify metrics message");
    
    let mut parser = StreamingParser::new();
    
    match parser.process_chunk(id, &content)? {
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
fn tool_create_dashboards(
    id: String,
    content: String,
) -> Result<Vec<BusterChatContainer>> {
    println!("MESSAGE_STREAM: Processing tool create dashboards message");
    
    let mut parser = StreamingParser::new();
    
    match parser.process_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced create dashboards message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid dashboard data found in content");
            Err(anyhow::anyhow!("Failed to parse dashboard data from content"))
        }
    }
}

// Update tool_modify_dashboards to require ID
fn tool_modify_dashboards(
    id: String,
    content: String,
) -> Result<Vec<BusterChatContainer>> {
    println!("MESSAGE_STREAM: Processing tool modify dashboards message");
    
    let mut parser = StreamingParser::new();
    
    match parser.process_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced modify dashboard message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid dashboard data found in content");
            Err(anyhow::anyhow!("Failed to parse dashboard data from content"))
        }
    }
}

// Update tool_create_plan to require ID
fn tool_create_plan(
    id: String,
    content: String,
) -> Result<Vec<BusterChatContainer>> {
    println!("MESSAGE_STREAM: Processing tool create plan message");
    
    let mut parser = StreamingParser::new();
    
    match parser.process_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced create plan message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid plan data found in content");
            Err(anyhow::anyhow!("Failed to parse plan data from content"))
        }
    }
}

// Fix tool_data_catalog_search to use required ID directly
fn tool_data_catalog_search(
    id: String,
    content: String,
) -> Result<Vec<BusterChatContainer>> {
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
            id: id, // Use required ID directly
            thought_type: "thought".to_string(),
            thought_title: format!("Found {} results", result_count),
            thought_secondary_title: format!("{} seconds", duration),
            thoughts: Some(thought_pill_containters),
            status: "completed".to_string(),
        })
    } else {
        BusterChatContainer::Thought(BusterThought {
            id: id, // Use required ID directly
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

    Ok(vec![buster_thought])
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

// Implement tool_create_file with required ID
fn tool_create_file(
    id: String,
    content: String,
) -> Result<Vec<BusterChatContainer>> {
    println!("MESSAGE_STREAM: Processing tool create file message");
    
    let mut parser = StreamingParser::new();
    
    match parser.process_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced create file message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid file data found in content");
            Err(anyhow::anyhow!("Failed to parse file data from content"))
        }
    }
}

// Implement tool_modify_file with required ID
fn tool_modify_file(
    id: String,
    content: String,
) -> Result<Vec<BusterChatContainer>> {
    println!("MESSAGE_STREAM: Processing tool modify file message");
    
    let mut parser = StreamingParser::new();
    
    match parser.process_chunk(id, &content)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced modify file message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!("MESSAGE_STREAM: No valid file data found in content");
            Err(anyhow::anyhow!("Failed to parse file data from content"))
        }
    }
}

// Helper function to transform BusterChatContainer to BusterReasoningMessageContainer
fn transform_to_reasoning_container(
    containers: Vec<BusterChatContainer>,
    chat_id: Uuid,
    message_id: Uuid,
) -> Vec<BusterReasoningMessageContainer> {
    containers
        .into_iter()
        .map(|container| match container {
            BusterChatContainer::Thought(thought) => BusterReasoningMessageContainer {
                reasoning: ReasoningMessage::Thought(thought),
                chat_id,
                message_id,
            },
            BusterChatContainer::File(file) => BusterReasoningMessageContainer {
                reasoning: ReasoningMessage::File(file),
                chat_id,
                message_id,
            },
            _ => unreachable!("Tool messages should only return Thought or File"),
        })
        .collect()
}

fn transform_assistant_tool_message(
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
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
        
        let messages = match &progress {
            Some(MessageProgress::InProgress) => {
                // For InProgress, we show loading states
                match tool_call.function.name.as_str() {
                    "search_data_catalog" => assistant_data_catalog_search(
                        tool_id.clone(), 
                        progress.clone(), 
                        initial
                    ),
                    "create_metrics" => assistant_create_metrics(
                        tool_id.clone(), 
                        progress.clone(), 
                        initial
                    ),
                    "update_metrics" => assistant_modify_metrics(
                        tool_id.clone(), 
                        progress.clone(), 
                        initial
                    ),
                    "create_dashboards" => assistant_create_dashboards(
                        tool_id.clone(), 
                        progress.clone(), 
                        initial
                    ),
                    "update_dashboards" => assistant_modify_dashboards(
                        tool_id.clone(), 
                        progress.clone(), 
                        initial
                    ),
                    "create_plan" => assistant_create_plan(
                        tool_id.clone(), 
                        progress.clone(), 
                        initial
                    ),
                    _ => Err(anyhow::anyhow!(
                        "Unsupported tool name: {}",
                        tool_call.function.name
                    )),
                }
            },
            Some(MessageProgress::Complete) => {
                // For Complete, we process the actual tool calls
                match tool_call.function.name.as_str() {
                    "search_data_catalog" => Ok(vec![]), // Search doesn't have a complete state
                    "create_metrics" => process_assistant_create_metrics(tool_call),
                    "update_metrics" => process_assistant_modify_metrics(tool_call),
                    "create_dashboards" => process_assistant_create_dashboards(tool_call),
                    "update_dashboards" => process_assistant_modify_dashboards(tool_call),
                    "create_plan" => process_assistant_create_plan(tool_call),
                    _ => Err(anyhow::anyhow!(
                        "Unsupported tool name: {}",
                        tool_call.function.name
                    )),
                }
            },
            None => Err(anyhow::anyhow!("Progress state is required")),
        };

        // Add messages from this tool call to our collection if successful
        if let Ok(tool_messages) = messages {
            all_messages.extend(tool_messages);
        }
    }

    println!(
        "MESSAGE_STREAM: transform_assistant_tool_message returning {} containers",
        all_messages.len()
    );
    
    // Transform all collected messages into BusterReasoningMessageContainer objects
    Ok(all_messages
        .into_iter()
        .map(|message| BusterReasoningMessageContainer {
            reasoning: match message {
                BusterChatContainer::Thought(thought) => ReasoningMessage::Thought(thought),
                BusterChatContainer::File(file) => ReasoningMessage::File(file),
                _ => unreachable!("Assistant tool messages should only return Thought or File"),
            },
            chat_id: chat_id.clone(),
            message_id: message_id.clone(),
        })
        .collect())
}

fn assistant_data_catalog_search(
    id: String,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                if initial {
                    Ok(vec![BusterChatContainer::Thought(BusterThought {
                        id,
                        thought_type: "thought".to_string(),
                        thought_title: "Searching your data catalog...".to_string(),
                        thought_secondary_title: "".to_string(),
                        thoughts: None,
                        status: "loading".to_string(),
                    })])
                } else {
                    Ok(vec![])
                }
            }
            _ => Err(anyhow::anyhow!(
                "Assistant data catalog search only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant data catalog search requires progress."
        ))
    }
}

fn assistant_create_metrics(
    id: String,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Creating metrics...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            _ => Err(anyhow::anyhow!(
                "Assistant create metrics only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant create metrics requires progress."
        ))
    }
}

fn process_assistant_create_metrics(
    tool_call: &ToolCall,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_create_metrics called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(tool_call.id.clone(), &tool_call.function.arguments)? {
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

fn process_assistant_modify_metrics(
    tool_call: &ToolCall,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_modify_metrics called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(tool_call.id.clone(), &tool_call.function.arguments)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced modify metric message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!(
                "MESSAGE_STREAM: StreamingParser returned None for modify metrics, waiting for more data"
            );
            Ok(vec![]) // Return empty vec instead of error when waiting for file data
        }
    }
}

fn assistant_create_dashboards(
    id: String,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Creating dashboards...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            _ => Err(anyhow::anyhow!(
                "Assistant create dashboards only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant create dashboards requires progress."
        ))
    }
}

fn process_assistant_create_dashboards(
    tool_call: &ToolCall,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_create_dashboards called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(tool_call.id.clone(), &tool_call.function.arguments)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced dashboard message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!(
                "MESSAGE_STREAM: StreamingParser returned None for dashboards, waiting for more data"
            );
            Ok(vec![]) // Return empty vec instead of error when waiting for file data
        }
    }
}

fn assistant_modify_dashboards(
    id: String,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Updating dashboards...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            _ => Err(anyhow::anyhow!(
                "Assistant modify dashboards only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant modify dashboards requires progress."
        ))
    }
}

fn process_assistant_modify_dashboards(
    tool_call: &ToolCall,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_modify_dashboards called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(tool_call.id.clone(), &tool_call.function.arguments)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced modify dashboard message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!(
                "MESSAGE_STREAM: StreamingParser returned None for modify dashboards, waiting for more data"
            );
            Ok(vec![]) // Return empty vec instead of error when waiting for file data
        }
    }
}

fn assistant_create_plan(
    id: String,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Creating plan...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            _ => Err(anyhow::anyhow!(
                "Assistant create plan only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant create plan requires progress."
        ))
    }
}

fn process_assistant_create_plan(
    tool_call: &ToolCall,
) -> Result<Vec<BusterChatContainer>> {
    println!(
        "MESSAGE_STREAM: process_assistant_create_plan called with arguments: {}",
        tool_call.function.arguments
    );

    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    match parser.process_chunk(tool_call.id.clone(), &tool_call.function.arguments)? {
        Some(message) => {
            println!(
                "MESSAGE_STREAM: StreamingParser produced plan message: {:?}",
                message
            );
            Ok(vec![message])
        }
        None => {
            println!(
                "MESSAGE_STREAM: StreamingParser returned None for plan, waiting for more data"
            );
            Ok(vec![]) // Return empty vec instead of error when waiting for file data
        }
    }
}

fn assistant_modify_metrics(
    id: String,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterChatContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                Ok(vec![BusterChatContainer::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Updating metrics...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
            }
            _ => Err(anyhow::anyhow!(
                "Assistant modify metrics only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant modify metrics requires progress."
        ))
    }
}
