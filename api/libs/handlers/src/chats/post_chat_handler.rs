use once_cell::sync::OnceCell;
use std::{collections::HashMap, sync::Mutex, time::Instant};

use agents::{
    tools::file_tools::search_data_catalog::SearchDataCatalogOutput, AgentExt, AgentMessage,
    AgentThread, BusterSuperAgent,
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
use serde_json::{json, Value};
use uuid::Uuid;

use crate::chats::{
    context_loaders::{
        chat_context::ChatContextLoader, dashboard_context::DashboardContextLoader,
        metric_context::MetricContextLoader, validate_context_request, ContextLoader,
    },
    get_chat_handler,
    streaming_parser::StreamingParser,
};
use crate::messages::types::{ChatMessage, ChatUserMessage};

use super::types::ChatWithMessages;
use tokio::sync::mpsc;

static CHUNK_TRACKER: OnceCell<ChunkTracker> = OnceCell::new();

fn get_chunk_tracker() -> &'static ChunkTracker {
    CHUNK_TRACKER.get_or_init(|| ChunkTracker::new())
}

// Define ThreadEvent
#[derive(Clone, Copy, Debug)]
pub enum ThreadEvent {
    GeneratingResponseMessage,
    GeneratingReasoningMessage,
    GeneratingTitle,
    InitializeChat,
    Completed,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ChatCreateNewChat {
    pub prompt: String,
    pub chat_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
    pub metric_id: Option<Uuid>,
    pub dashboard_id: Option<Uuid>,
}

struct ChunkTracker {
    chunks: Mutex<HashMap<String, ChunkState>>,
}

struct ChunkState {
    complete_text: String,
    last_seen_content: String,
}

impl ChunkTracker {
    pub fn new() -> Self {
        Self {
            chunks: Mutex::new(HashMap::new()),
        }
    }

    pub fn add_chunk(&self, chunk_id: String, new_chunk: String) -> String {
        if let Ok(mut chunks) = self.chunks.lock() {
            let state = chunks.entry(chunk_id).or_insert(ChunkState {
                complete_text: String::new(),
                last_seen_content: String::new(),
            });
            
            // Calculate the delta by finding what's new since last_seen_content
            let delta = if state.last_seen_content.is_empty() {
                // First chunk, use it as is
                new_chunk.clone()
            } else if new_chunk.starts_with(&state.last_seen_content) {
                // New chunk contains all previous content at the start, extract only the new part
                new_chunk[state.last_seen_content.len()..].to_string()
            } else {
                // If we can't find the previous content, try to find where the new content starts
                match new_chunk.find(&state.last_seen_content) {
                    Some(pos) => new_chunk[pos + state.last_seen_content.len()..].to_string(),
                    None => {
                        // If we can't find any overlap, this might be completely new content
                        new_chunk.clone()
                    }
                }
            };
            
            // Update tracking state only if we found new content
            if !delta.is_empty() {
                state.complete_text.push_str(&delta);
                state.last_seen_content = new_chunk;
            }
            
            delta
        } else {
            new_chunk
        }
    }

    pub fn get_complete_text(&self, chunk_id: String) -> Option<String> {
        self.chunks
            .lock()
            .ok()
            .and_then(|chunks| chunks.get(&chunk_id).map(|state| state.complete_text.clone()))
    }

    pub fn clear_chunk(&self, chunk_id: String) {
        if let Ok(mut chunks) = self.chunks.lock() {
            chunks.remove(&chunk_id);
        }
    }
}

pub async fn post_chat_handler(
    request: ChatCreateNewChat,
    user: User,
    tx: Option<mpsc::Sender<Result<(BusterContainer, ThreadEvent)>>>,
) -> Result<ChatWithMessages> {
    let reasoning_duration = Instant::now();
    validate_context_request(request.chat_id, request.metric_id, request.dashboard_id)?;

    let user_org_id = match user.attributes.get("organization_id") {
        Some(Value::String(org_id)) => Uuid::parse_str(&org_id).unwrap_or_default(),
        _ => {
            tracing::error!("User has no organization ID");
            return Err(anyhow!("User has no organization ID"));
        }
    };

    // Initialize chat - either get existing or create new
    let (chat_id, message_id, mut chat_with_messages) =
        initialize_chat(&request, &user, user_org_id).await?;

    tracing::info!(
        "Starting post_chat_handler for chat_id: {}, message_id: {}, organization_id: {}, user_id: {}",
        chat_id, message_id, user_org_id, user.id
    );

    // Send initial chat state to client
    if let Some(tx) = tx.clone() {
        tx.send(Ok((
            BusterContainer::Chat(chat_with_messages.clone()),
            ThreadEvent::InitializeChat,
        )))
        .await?;
    }

    // Create database connection
    let mut conn = get_pg_pool().get().await?;

    // Initialize agent with context if provided
    let mut initial_messages = vec![];

    // Initialize agent to add context
    let agent = BusterSuperAgent::new(user.id, chat_id).await?;

    // Load context if provided
    if let Some(existing_chat_id) = request.chat_id {
        let context_loader = ChatContextLoader::new(existing_chat_id);
        let context_messages = context_loader
            .load_context(&user, agent.get_agent())
            .await?;
        initial_messages.extend(context_messages);
    } else if let Some(metric_id) = request.metric_id {
        let context_loader = MetricContextLoader::new(metric_id);
        let context_messages = context_loader
            .load_context(&user, agent.get_agent())
            .await?;
        initial_messages.extend(context_messages);
    } else if let Some(dashboard_id) = request.dashboard_id {
        let context_loader = DashboardContextLoader::new(dashboard_id);
        let context_messages = context_loader
            .load_context(&user, agent.get_agent())
            .await?;
        initial_messages.extend(context_messages);
    }

    // Add the new user message
    initial_messages.push(AgentMessage::user(request.prompt.clone()));

    // Initialize raw_llm_messages with initial_messages
    let mut raw_llm_messages = initial_messages.clone();

    // Initialize the agent thread
    let mut chat = AgentThread::new(Some(chat_id), user.id, initial_messages);

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
                // Store the original message for file processing
                all_messages.push(msg.clone());

                // Only store completed messages in raw_llm_messages
                match &msg {
                    AgentMessage::Assistant { progress, .. } => {
                        if matches!(progress, MessageProgress::Complete) {
                            raw_llm_messages.push(msg.clone());
                        }
                    }
                    AgentMessage::Tool { progress, .. } => {
                        if matches!(progress, MessageProgress::Complete) {
                            raw_llm_messages.push(msg.clone());
                        }
                    }
                    // User messages and other types don't have progress, so we store them all
                    AgentMessage::User { .. } => {
                        raw_llm_messages.push(msg.clone());
                    }
                    _ => {} // Ignore other message types
                }

                // Always transform the message
                match transform_message(&chat_id, &message_id, msg, tx.as_ref()).await {
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
                break;
            }
        }
    }

    let title = title_handle.await??;
    let reasoning_duration = reasoning_duration.elapsed().as_secs();

    // Transform all messages for final storage
    let (response_messages, reasoning_messages) =
        prepare_final_message_state(&all_transformed_containers)?;

    // Update chat_with_messages with final state
    let message = ChatMessage::new_with_messages(
        message_id,
        ChatUserMessage {
            request: request.prompt.clone(),
            sender_id: user.id.clone(),
            sender_name: user.name.clone().unwrap_or_default(),
            sender_avatar: None,
        },
        response_messages.clone(),
        reasoning_messages.clone(),
        Some(format!("Reasoned for {} seconds", reasoning_duration).to_string()),
    );
    
    chat_with_messages.update_message(message);

    // Create and store message in the database with final state
    let db_message = Message {
        id: message_id,
        request_message: request.prompt,
        chat_id,
        created_by: user.id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        response_messages: serde_json::to_value(&response_messages)?,
        reasoning: serde_json::to_value(&reasoning_messages)?,
        final_reasoning_message: format!("Reasoned for {} seconds", reasoning_duration),
        title: title.title.clone().unwrap_or_default(),
        raw_llm_messages: serde_json::to_value(&raw_llm_messages)?,
    };

    // Insert message into database
    insert_into(messages::table)
        .values(&db_message)
        .execute(&mut conn)
        .await?;

    // First process completed files (database updates only)
    let _ =
        process_completed_files(&mut conn, &db_message, &all_messages, &user_org_id, &user.id).await?;

    // Then send text response messages
    if let Some(tx) = &tx {
        for container in &all_transformed_containers {
            if let BusterContainer::ChatMessage(chat) = container {
                if let BusterChatMessage::Text {
                    message: Some(_),
                    message_chunk: None,
                    ..
                } = &chat.response_message
                {
                    tx.send(Ok((
                        BusterContainer::ChatMessage(chat.clone()),
                        ThreadEvent::GeneratingResponseMessage,
                    )))
                    .await?;
                }
            }
        }
    }

    if let Some(title) = title.title {
        chat_with_messages.title = title;
    }

    // Send final completed state
    if let Some(tx) = &tx {
        tx.send(Ok((
            BusterContainer::Chat(chat_with_messages.clone()),
            ThreadEvent::Completed,
        )))
        .await?;
    }

    tracing::info!("Completed post_chat_handler for chat_id: {}", chat_id);
    Ok(chat_with_messages)
}

/// Prepares the final message state from transformed containers
fn prepare_final_message_state(containers: &[BusterContainer]) -> Result<(Vec<Value>, Vec<Value>)> {
    let mut response_messages = Vec::new();
    let mut reasoning_messages = Vec::new();

    for container in containers {
        match container {
            BusterContainer::ChatMessage(chat) => {
                // For text messages, only include complete ones (message present, chunk absent)
                match &chat.response_message {
                    BusterChatMessage::Text {
                        message,
                        message_chunk,
                        ..
                    } => {
                        if message.is_some() && message_chunk.is_none() {
                            if let Ok(value) = serde_json::to_value(&chat.response_message) {
                                response_messages.push(value);
                            }
                        }
                    }
                    // For non-text messages (like files), keep existing behavior
                    _ => {
                        if let Ok(value) = serde_json::to_value(&chat.response_message) {
                            response_messages.push(value);
                        }
                    }
                }
            }
            BusterContainer::ReasoningMessage(reasoning) => {
                let reasoning_value = match &reasoning.reasoning {
                    BusterReasoningMessage::Pill(thought) => {
                        if thought.status == "completed" {
                            serde_json::to_value(thought).ok()
                        } else {
                            None
                        }
                    }
                    BusterReasoningMessage::File(file) => {
                        if file.status == "completed" {
                            serde_json::to_value(file).ok()
                        } else {
                            None
                        }
                    }
                    BusterReasoningMessage::Text(text) => {
                        if text.status.as_deref() == Some("completed") {
                            serde_json::to_value(text).ok()
                        } else {
                            None
                        }
                    }
                };

                if let Some(value) = reasoning_value {
                    reasoning_messages.push(value);
                }
            }
            _ => {}
        }
    }

    Ok((response_messages, reasoning_messages))
}

/// Process any completed files and create necessary database records
async fn process_completed_files(
    conn: &mut diesel_async::AsyncPgConnection,
    message: &Message,
    messages: &[AgentMessage],
    organization_id: &Uuid,
    user_id: &Uuid,
) -> Result<()> {
    let mut transformed_messages = Vec::new();
    for msg in messages {
        if let Ok((containers, _)) =
            transform_message(&message.chat_id, &message.id, msg.clone(), None).await
        {
            transformed_messages.extend(containers);
        }
    }

    // Process files for database updates only
    for container in transformed_messages {
        match container {
            BusterContainer::ReasoningMessage(msg) => match &msg.reasoning {
                BusterReasoningMessage::File(file) if file.message_type == "files" => {
                    for file_id in &file.file_ids {
                        if let Some(file_content) = file.files.get(file_id) {
                            // Only process files that have completed reasoning
                            if file.status == "completed" {
                                // Create message-to-file association
                                let message_to_file = MessageToFile {
                                    id: Uuid::new_v4(),
                                    message_id: message.id,
                                    file_id: Uuid::parse_str(&file_id)?,
                                    created_at: Utc::now(),
                                    updated_at: Utc::now(),
                                    deleted_at: None,
                                };

                                diesel::insert_into(messages_to_files::table)
                                    .values(&message_to_file)
                                    .execute(conn)
                                    .await?;
                            }
                        }
                    }
                }
                _ => (),
            },
            _ => (),
        }
    }

    Ok(())
}

#[derive(Debug, Serialize, Clone)]
pub enum BusterChatContainer {
    ChatMessage(BusterChatMessageContainer),
    Thought(BusterReasoningPill),
    File(BusterReasoningFile),
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterChatContainerContainer {
    pub container: BusterChatContainer,
    pub chat_id: Uuid,
    pub message_id: Uuid,
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
pub struct BusterChatResponseFileMetadata {
    pub status: String,
    pub message: String,
    pub timestamp: Option<i64>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum BusterChatMessage {
    Text {
        id: String,
        message: Option<String>,
        message_chunk: Option<String>,
        is_final_message: Option<bool>,
    },
    File {
        id: String,
        file_type: String,
        file_name: String,
        version_number: i32,
        version_id: String,
        filter_version_id: Option<String>,
        metadata: Option<Vec<BusterChatResponseFileMetadata>>,
    },
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
    pub secondary_title: String,
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
pub struct BusterFile {
    pub id: String,
    pub file_type: String,
    pub file_name: String,
    pub version_number: i32,
    pub version_id: String,
    pub status: String,
    pub file: BusterFileContent,
    pub metadata: Option<Vec<BusterFileMetadata>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterFileContent {
    pub text: Option<String>,
    pub text_chunk: Option<String>,
    pub modifided: Option<Vec<(i32, i32)>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterReasoningFile {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub title: String,
    pub secondary_title: String,
    pub status: String,
    pub file_ids: Vec<String>,
    pub files: HashMap<String, BusterFile>,
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
    Chat(ChatWithMessages),
    ChatMessage(BusterChatMessageContainer),
    ReasoningMessage(BusterReasoningMessageContainer),
    GeneratingTitle(BusterGeneratingTitle),
}

pub async fn transform_message(
    chat_id: &Uuid,
    message_id: &Uuid,
    message: AgentMessage,
    tx: Option<&mpsc::Sender<Result<(BusterContainer, ThreadEvent)>>>,
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
                let mut containers = Vec::new();

                // Create the regular content message
                let chat_messages = match transform_text_message(
                    id.clone().unwrap_or_else(|| Uuid::new_v4().to_string()),
                    content,
                    progress.clone(),
                    *chat_id,
                    *message_id,
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .map(|msg| {
                            BusterContainer::ChatMessage(BusterChatMessageContainer {
                                response_message: msg,
                                chat_id: *chat_id,
                                message_id: *message_id,
                            })
                        })
                        .collect::<Vec<_>>(),
                    Err(e) => {
                        tracing::warn!("Error transforming text message: {:?}", e);
                        vec![]
                    }
                };
                containers.extend(chat_messages);

                // Add the "Finished reasoning" message if we're just starting
                if initial {
                    let reasoning_message = BusterReasoningMessage::Text(BusterReasoningText {
                        id: Uuid::new_v4().to_string(),
                        reasoning_type: "text".to_string(),
                        title: "Finished reasoning".to_string(),
                        secondary_title: String::new(),
                        message: None,
                        message_chunk: None,
                        status: Some("completed".to_string()),
                    });

                    let reasoning_container =
                        BusterContainer::ReasoningMessage(BusterReasoningMessageContainer {
                            reasoning: reasoning_message,
                            chat_id: *chat_id,
                            message_id: *message_id,
                        });

                    // Send the finished reasoning message separately
                    if let Some(tx) = tx {
                        if let Err(e) = tx
                            .send(Ok((
                                reasoning_container,
                                ThreadEvent::GeneratingReasoningMessage,
                            )))
                            .await
                        {
                            tracing::warn!("Failed to send finished reasoning message: {:?}", e);
                        }
                    }
                }

                return Ok((containers, ThreadEvent::GeneratingResponseMessage));
            }

            if let Some(tool_calls) = tool_calls {
                let mut containers = Vec::new();

                // Transform tool messages
                match transform_assistant_tool_message(
                    tool_calls.clone(),
                    progress,
                    initial,
                    *chat_id,
                    *message_id,
                ) {
                    Ok(messages) => {
                        for reasoning_container in messages {
                            // If this is a completed file reasoning message, send the file response separately
                            if let BusterReasoningMessage::File(ref file) =
                                reasoning_container.reasoning
                            {
                                if file.status == "completed" && file.message_type == "files" {
                                    // For each completed file, create and send a file response message
                                    for (file_id, file_content) in &file.files {
                                        let response_message = BusterChatMessage::File {
                                            id: file_content.id.clone(),
                                            file_type: file_content.file_type.clone(),
                                            file_name: file_content.file_name.clone(),
                                            version_number: file_content.version_number,
                                            version_id: file_content.version_id.clone(),
                                            filter_version_id: None,
                                            metadata: Some(vec![BusterChatResponseFileMetadata {
                                                status: "completed".to_string(),
                                                message: format!(
                                                    "File {} completed",
                                                    file_content.file_name
                                                ),
                                                timestamp: Some(Utc::now().timestamp()),
                                            }]),
                                        };

                                        let file_container = BusterContainer::ChatMessage(
                                            BusterChatMessageContainer {
                                                response_message,
                                                chat_id: *chat_id,
                                                message_id: *message_id,
                                            },
                                        );

                                        // Send file response message separately with GeneratingResponseMessage event
                                        if let Some(tx) = tx {
                                            let _ = tx
                                                .send(Ok((
                                                    file_container.clone(),
                                                    ThreadEvent::GeneratingResponseMessage,
                                                )))
                                                .await;
                                        }

                                        // Add to containers so it gets saved to the database
                                        containers.push(file_container);
                                    }
                                }
                            }
                            containers.push(BusterContainer::ReasoningMessage(reasoning_container));
                        }
                    }
                    Err(e) => {
                        tracing::warn!("Error transforming assistant tool message: {:?}", e);
                        println!(
                            "MESSAGE_STREAM: Error transforming assistant tool message: {:?}",
                            e
                        );
                    }
                };

                return Ok((containers, ThreadEvent::GeneratingReasoningMessage));
            }

            Ok((vec![], ThreadEvent::GeneratingResponseMessage))
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
                    *chat_id,
                    *message_id,
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
    let tracker = get_chunk_tracker();

    match progress {
        MessageProgress::InProgress => {
            let filtered_content = tracker.add_chunk(id.clone(), content.clone());
            Ok(vec![BusterChatMessage::Text {
                id: id.clone(),
                message: None,
                message_chunk: Some(filtered_content),
                is_final_message: Some(false),
            }])
        }
        MessageProgress::Complete => {
            let complete_text = tracker.get_complete_text(id.clone()).unwrap_or(content.clone());
            tracker.clear_chunk(id.clone());
            Ok(vec![BusterChatMessage::Text {
                id: id.clone(),
                message: Some(complete_text),
                message_chunk: None,
                is_final_message: Some(true),
            }])
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
    let tracker = get_chunk_tracker();
    let reasoning_containers = messages
        .into_iter()
        .map(|reasoning| {
            let updated_reasoning = if let BusterReasoningMessage::Text(mut text) = reasoning {
                if let Some(chunk) = text.message_chunk.clone() {
                    let filtered_content = tracker.add_chunk(text.id.clone(), chunk.clone());
                    println!("MESSAGE_STREAM: Filtered content: {:?}", filtered_content);
                    text.message_chunk = Some(filtered_content);
                }
                if text.status == Some("completed".to_string()) {
                    tracker.clear_chunk(text.id.clone());
                }
                BusterReasoningMessage::Text(text)
            } else {
                reasoning
            };

            BusterReasoningMessageContainer {
                reasoning: updated_reasoning,
                chat_id,
                message_id,
            }
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

    let mut dataset_pills = Vec::new();

    // Create a pill for each result
    for result in results.results {
        dataset_pills.push(BusterThoughtPill {
            id: result.id.to_string(),
            text: result.name.clone().unwrap_or_default(),
            thought_file_type: "dataset".to_string(), // Set type to "dataset" for all pills
        });
    }

    // Create a single container with all dataset pills
    let container = BusterThoughtPillContainer {
        title: String::from("Datasets"),
        pills: dataset_pills,
    };

    Ok(vec![container])
}

fn transform_assistant_tool_message(
    tool_calls: Vec<ToolCall>,
    progress: MessageProgress,
    initial: bool,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterReasoningMessageContainer>> {
    let mut all_messages = Vec::new();
    let tracker = get_chunk_tracker();

    for tool_call in &tool_calls {
        let tool_id = tool_call.id.clone();

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
            _ => vec![],
        };

        let containers: Vec<BusterReasoningMessageContainer> = messages
            .into_iter()
            .map(|reasoning| {
                let updated_reasoning = match reasoning {
                    BusterReasoningMessage::Text(mut text) => {
                        if let Some(chunk) = text.message_chunk.clone() {
                            println!("CHUNK DEBUG [{}] Before filtering:", text.id);
                            println!("  Incoming chunk length: {}", chunk.len());
                            println!("  Incoming chunk: {}", chunk);
                            
                            let delta = tracker.add_chunk(text.id.clone(), chunk);
                            
                            println!("CHUNK DEBUG [{}] After filtering:", text.id);
                            println!("  Delta content length: {}", delta.len());
                            println!("  Delta content: {}", delta);
                            
                            if !delta.is_empty() {
                                text.message_chunk = Some(delta);
                                text.message = None; // Clear message field while streaming
                            } else if text.status != Some("completed".to_string()) {
                                // If there's no new content and it's not complete, don't send a message
                                return None;
                            }
                        }
                        
                        if text.status == Some("completed".to_string()) {
                            println!("CHUNK DEBUG [{}] Completing message", text.id);
                            // For completed messages, either use accumulated text or the final message
                            text.message = tracker.get_complete_text(text.id.clone())
                                .or(text.message)
                                .or(text.message_chunk.clone());
                            text.message_chunk = None;
                            tracker.clear_chunk(text.id.clone());
                        }
                        
                        Some(BusterReasoningMessage::Text(text))
                    }
                    BusterReasoningMessage::File(mut file) => {
                        let mut has_updates = false;
                        let mut updated_files = std::collections::HashMap::new();
                        
                        // Process each file's chunks
                        for (file_id, file_content) in file.files.iter() {
                            // Generate a consistent temporary ID for files during creation
                            // This ensures the same file gets the same ID throughout the creation process
                            let temp_file_id = if file.message_type == "files" && file.status != "completed" {
                                // For files being created, use a hash of the file name as a temporary ID
                                use std::collections::hash_map::DefaultHasher;
                                use std::hash::{Hash, Hasher};
                                let mut hasher = DefaultHasher::new();
                                file_content.file_name.hash(&mut hasher);
                                format!("temp_{}", hasher.finish())
                            } else {
                                file_id.clone()
                            };
                            
                            // Use consistent ID for chunk tracking
                            let chunk_id = format!("{}_{}", file.id, file_content.file_name);
                            
                            if let Some(chunk) = &file_content.file.text_chunk {
                                println!("FILE CHUNK DEBUG [{}] Before filtering:", chunk_id);
                                println!("  Incoming chunk length: {}", chunk.len());
                                println!("  Incoming chunk: {}", chunk);
                                
                                let delta = tracker.add_chunk(chunk_id.clone(), chunk.clone());
                                
                                println!("FILE CHUNK DEBUG [{}] After filtering:", chunk_id);
                                println!("  Delta content length: {}", delta.len());
                                println!("  Delta content: {}", delta);
                                
                                if !delta.is_empty() {
                                    // Only include files that have new content
                                    let mut updated_content = file_content.clone();
                                    updated_content.file.text_chunk = Some(delta);
                                    updated_content.file.text = None; // Clear text field while streaming
                                    updated_content.id = temp_file_id.clone(); // Use the consistent temporary ID
                                    updated_files.insert(temp_file_id, updated_content);
                                    has_updates = true;
                                }
                            }
                        }
                        
                        if file.status == "completed" {
                            // When completed, send all files with their complete text
                            for (file_id, file_content) in file.files.iter() {
                                let chunk_id = format!("{}_{}", file.id, file_content.file_name);
                                let complete_text = tracker.get_complete_text(chunk_id.clone())
                                    .unwrap_or_else(|| file_content.file.text_chunk.clone().unwrap_or_default());
                                
                                let mut completed_content = file_content.clone();
                                completed_content.file.text = Some(complete_text);
                                completed_content.file.text_chunk = None;
                                updated_files.insert(file_id.clone(), completed_content);
                                
                                tracker.clear_chunk(chunk_id);
                            }
                            has_updates = true;
                        }
                        
                        if has_updates {
                            let mut updated_file = file.clone();
                            updated_file.files = updated_files;
                            Some(BusterReasoningMessage::File(updated_file))
                        } else {
                            None
                        }
                    }
                    other => Some(other),
                };

                updated_reasoning.map(|reasoning| BusterReasoningMessageContainer {
                    reasoning,
                    chat_id,
                    message_id,
                })
            })
            .filter_map(|container| container)
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

            // Update status based on message type
            match message {
                BusterReasoningMessage::Text(mut text) => {
                    text.status = Some(status.to_string());
                    Ok(vec![BusterReasoningMessage::Text(text)])
                }
                _ => Ok(vec![message]),
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
type BusterContainerResult = Result<(BusterContainer, ThreadEvent)>;

pub async fn generate_conversation_title(
    messages: &[AgentMessage],
    message_id: &Uuid,
    user_id: &Uuid,
    session_id: &Uuid,
    tx: Option<mpsc::Sender<BusterContainerResult>>,
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

async fn initialize_chat(
    request: &ChatCreateNewChat,
    user: &User,
    user_org_id: Uuid,
) -> Result<(Uuid, Uuid, ChatWithMessages)> {
    let message_id = request.message_id.unwrap_or_else(Uuid::new_v4);

    if let Some(existing_chat_id) = request.chat_id {
        // Get existing chat - no need to create new chat in DB
        let mut existing_chat = get_chat_handler(&existing_chat_id, &user.id).await?;

        // Create new message
        let message = ChatMessage::new_with_messages(
            message_id,
            ChatUserMessage {
                request: request.prompt.clone(),
                sender_id: user.id.clone(),
                sender_name: user.name.clone().unwrap_or_default(),
                sender_avatar: None,
            },
            Vec::new(),
            Vec::new(),
            None,
        );

        // Add message to existing chat
        existing_chat.add_message(message);

        Ok((existing_chat_id, message_id, existing_chat))
    } else {
        // Create new chat since we don't have an existing one
        let chat_id = Uuid::new_v4();
        let chat = Chat {
            id: chat_id,
            title: request.prompt.clone(),
            organization_id: user_org_id,
            created_by: user.id.clone(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            updated_by: user.id.clone(),
        };

        // Create initial message
        let message = ChatMessage::new_with_messages(
            message_id,
            ChatUserMessage {
                request: request.prompt.clone(),
                sender_id: user.id.clone(),
                sender_name: user.name.clone().unwrap_or_default(),
                sender_avatar: None,
            },
            Vec::new(),
            Vec::new(),
            None,
        );

        let mut chat_with_messages = ChatWithMessages::new(
            request.prompt.clone(),
            user.id.to_string(),
            user.name.clone().unwrap_or_default(),
            None,
        );
        chat_with_messages.id = chat_id;
        chat_with_messages.add_message(message);

        // Only create new chat in DB if this is a new chat
        let mut conn = get_pg_pool().get().await?;
        insert_into(chats::table)
            .values(&chat)
            .execute(&mut conn)
            .await?;

        Ok((chat_id, message_id, chat_with_messages))
    }
}
