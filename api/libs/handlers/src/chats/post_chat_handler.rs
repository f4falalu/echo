use dashmap::DashMap;
use middleware::AuthenticatedUser;
use std::collections::HashSet;
use std::{collections::HashMap, time::Instant};

use agents::{
    tools::{
        file_tools::{
            common::ModifyFilesOutput, create_dashboards::CreateDashboardFilesOutput,
            create_metrics::CreateMetricFilesOutput, search_data_catalog::SearchDataCatalogOutput,
        },
        // Remove the old import
        // planning_tools::CreatePlanOutput,
    },
    AgentExt, AgentMessage, AgentThread, BusterMultiAgent,
};

use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, Chat, Message, MessageToFile},
    pool::get_pg_pool,
    schema::{
        asset_permissions, chats, dashboard_files, messages, messages_to_files, metric_files,
    },
};
use diesel::{insert_into, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use litellm::{
    AgentMessage as LiteLLMAgentMessage, ChatCompletionRequest, LiteLLMClient, MessageProgress,
    Metadata, ToolCall,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::chats::{
    asset_messages::{create_message_file_association, generate_asset_messages},
    context_loaders::{
        chat_context::ChatContextLoader, create_asset_context_loader,
        dashboard_context::DashboardContextLoader, fetch_asset_details,
        metric_context::MetricContextLoader, validate_context_request, ContextLoader,
    },
    get_chat_handler,
    streaming_parser::StreamingParser,
};
use crate::messages::types::{ChatMessage, ChatUserMessage};

use super::types::ChatWithMessages;
use tokio::sync::mpsc;

use database::types::dashboard_yml::DashboardYml;

use database::pool::PgPool;
use diesel::OptionalExtension;
use diesel_async::AsyncPgConnection; // Import PgPool

// Add imports for version history types
use database::types::version_history::{VersionContent, VersionHistory};

// Define the helper struct at the module level
#[derive(Debug, Clone)]
struct CompletedFileInfo {
    id: String,
    file_type: String, // "metric" or "dashboard"
    file_name: String,
    version_number: i32,
    content: String, // Added to store file content for parsing
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
    pub prompt: Option<String>,
    pub chat_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
    // Generic asset reference
    pub asset_id: Option<Uuid>,
    pub asset_type: Option<database::enums::AssetType>,
    // Legacy specific asset types (for backward compatibility)
    pub metric_id: Option<Uuid>,
    pub dashboard_id: Option<Uuid>,
}

// Replace mutex-based chunk tracker with DashMap for lock-free concurrent access
pub struct ChunkTracker {
    chunks: DashMap<String, ChunkState>,
}

#[derive(Clone)]
struct ChunkState {
    complete_text: String,
    last_seen_content: String,
}

impl Default for ChunkTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl ChunkTracker {
    pub fn new() -> Self {
        Self {
            chunks: DashMap::new(),
        }
    }

    pub fn add_chunk(&self, chunk_id: String, new_chunk: String) -> String {
        // Compute delta and update in one operation using DashMap
        let mut delta_to_return = String::new();

        {
            self.chunks
                .entry(chunk_id.clone())
                .or_insert_with(|| ChunkState {
                    complete_text: String::new(),
                    last_seen_content: String::new(),
                });

            // Now that we've initialized the entry if needed, get mutable access to update it
            if let Some(mut entry) = self.chunks.get_mut(&chunk_id) {
                // Calculate the delta
                let delta = if entry.last_seen_content.is_empty() {
                    // First chunk, use it as is
                    new_chunk.clone()
                } else if new_chunk.starts_with(&entry.last_seen_content) {
                    // New chunk contains all previous content at the start, extract only the new part
                    new_chunk[entry.last_seen_content.len()..].to_string()
                } else {
                    // If we can't find the previous content, try to find where the new content starts
                    match new_chunk.find(&entry.last_seen_content) {
                        Some(pos) => new_chunk[pos + entry.last_seen_content.len()..].to_string(),
                        None => {
                            // If we can't find any overlap, this might be completely new content
                            new_chunk.clone()
                        }
                    }
                };

                delta_to_return = delta.clone();

                // Update tracking state only if we found new content
                if !delta.is_empty() {
                    entry.complete_text.push_str(&delta);
                    entry.last_seen_content = new_chunk;
                }
            }
        }

        delta_to_return
    }

    pub fn get_complete_text(&self, chunk_id: String) -> Option<String> {
        self.chunks
            .get(&chunk_id)
            .map(|state| state.complete_text.clone())
    }

    pub fn clear_chunk(&self, chunk_id: String) {
        self.chunks.remove(&chunk_id);
    }
}

pub async fn post_chat_handler(
    request: ChatCreateNewChat,
    user: AuthenticatedUser,
    tx: Option<mpsc::Sender<Result<(BusterContainer, ThreadEvent)>>>,
) -> Result<ChatWithMessages> {
    let chunk_tracker = ChunkTracker::new();
    let reasoning_duration = Instant::now();
    let (asset_id, asset_type) = normalize_asset_fields(&request);
    validate_context_request(
        request.chat_id,
        asset_id,
        asset_type,
        request.metric_id,
        request.dashboard_id,
    )?;
    let user_org_id = match user.attributes.get("organization_id") {
        Some(Value::String(org_id)) => Uuid::parse_str(org_id).unwrap_or_default(),
        _ => {
            tracing::error!("User has no organization ID");
            return Err(anyhow!("User has no organization ID"));
        }
    };
    let (chat_id, message_id, mut chat_with_messages) =
        initialize_chat(&request, &user, user_org_id).await?;

    tracing::info!(
        "Starting post_chat_handler for chat_id: {}, message_id: {}, organization_id: {}, user_id: {}",
        chat_id, message_id, user_org_id, user.id
    );

    if let Some(tx) = tx.clone() {
        tx.send(Ok((
            BusterContainer::Chat(chat_with_messages.clone()),
            ThreadEvent::InitializeChat,
        )))
        .await?;
    }

    if request.prompt.is_none() && asset_id.is_some() && asset_type.is_some() {
        // Remove the initial empty message added by initialize_chat in this specific case
        let message_id_str = message_id.to_string();
        chat_with_messages.messages.remove(&message_id_str);
        chat_with_messages.message_ids.retain(|id| id != &message_id_str);

        let asset_id_value = asset_id.unwrap();
        let asset_type_value = asset_type.unwrap();

        let messages = generate_asset_messages(asset_id_value, asset_type_value, &user).await?;

        println!("messages: {:?}", messages);

        // Add messages to chat and associate with chat_id
        let mut updated_messages = Vec::new();
        for mut message in messages {
            message.chat_id = chat_id;

            // Insert message into database first
            let mut conn = get_pg_pool().get().await?;
            insert_into(database::schema::messages::table)
                .values(&message)
                .execute(&mut conn)
                .await?;

            // After message is inserted, create file association if needed
            if message.response_messages.is_array() {
                let response_arr = message.response_messages.as_array().unwrap();

                // Find a file response in the array
                for response in response_arr {
                    if response.get("type").map_or(false, |t| t == "file") {
                        // Extract version_number from response, default to 1 if not found
                        let asset_version_number = response
                            .get("version_number")
                            .and_then(|v| v.as_i64())
                            .map(|v| v as i32)
                            .unwrap_or(1);

                        // Ensure the response id matches the asset_id
                        let response_id = response
                            .get("id")
                            .and_then(|id| id.as_str())
                            .and_then(|id_str| Uuid::parse_str(id_str).ok())
                            .unwrap_or(asset_id_value);

                        // Verify the response ID matches the asset ID
                        if response_id == asset_id_value {
                            // Create association in database - now the message exists in DB
                            if let Err(e) = create_message_file_association(
                                message.id,
                                asset_id_value,
                                asset_version_number,
                                asset_type_value,
                            )
                            .await
                            {
                                tracing::warn!("Failed to create message file association: {}", e);
                            }
                        }

                        // We only need to process one file association
                        break;
                    }
                }
            }

            // Add to updated messages for the response
            updated_messages.push(message);
        }

        // Transform DB messages to ChatMessage format for response
        for message in updated_messages {
            let chat_message = ChatMessage::new_with_messages(
                message.id,
                Some(ChatUserMessage {
                    request: "".to_string(),
                    sender_id: user.id,
                    sender_name: user.name.clone().unwrap_or_default(),
                    sender_avatar: None,
                }),
                // Use the response_messages from the DB
                serde_json::from_value(message.response_messages).unwrap_or_default(),
                vec![],
                None,
                message.created_at,
            );

            chat_with_messages.add_message(chat_message);

            // We don't need to process the raw_llm_messages here
            // The ChatContextLoader.update_context_from_tool_calls function will handle the asset state
            // when the agent is initialized and loads the context
        }

        // Explicitly update the chat in the database with most_recent_file information
        // to ensure it behaves like files generated in a chat
        let asset_type_string = match asset_type_value {
            AssetType::MetricFile => Some("metric".to_string()),
            AssetType::DashboardFile => Some("dashboard".to_string()),
            _ => None,
        };

        if let Some(file_type) = asset_type_string {
            // Update the chat directly to ensure it has the most_recent_file information
            let mut conn = get_pg_pool().get().await?;
            diesel::update(chats::table.find(chat_id))
                .set((
                    chats::most_recent_file_id.eq(Some(asset_id_value)),
                    chats::most_recent_file_type.eq(Some(file_type.clone())),
                    chats::updated_at.eq(Utc::now()),
                ))
                .execute(&mut conn)
                .await?;

            tracing::info!(
                "Updated chat {} with most_recent_file_id: {}, most_recent_file_type: {}",
                chat_id,
                asset_id_value,
                file_type
            );
        }

        // Return early with auto-generated messages - no need for agent processing
        return Ok(chat_with_messages);
    }

    let mut initial_messages = vec![];
    // Determine if this is a follow-up message based on chat_id presence
    let is_follow_up = request.chat_id.is_some();
    let agent = BusterMultiAgent::new(user.id, chat_id, is_follow_up).await?;

    // Load context if provided (combines both legacy and new asset references)
    if let Some(existing_chat_id) = request.chat_id {
        let context_loader = ChatContextLoader::new(existing_chat_id);
        let context_messages = context_loader
            .load_context(&user, agent.get_agent())
            .await?;
        initial_messages.extend(context_messages);
    } else if let Some(id) = asset_id {
        if let Some(asset_type_val) = asset_type {
            // Use the generic context loader with factory
            let context_loader = create_asset_context_loader(id, asset_type_val);
            let context_messages = context_loader
                .load_context(&user, agent.get_agent())
                .await?;
            initial_messages.extend(context_messages);
        }
    } else if let Some(metric_id) = request.metric_id {
        // Legacy metric loading
        let context_loader = MetricContextLoader::new(metric_id);
        let context_messages = context_loader
            .load_context(&user, agent.get_agent())
            .await?;
        initial_messages.extend(context_messages);
    } else if let Some(dashboard_id) = request.dashboard_id {
        // Legacy dashboard loading
        let context_loader = DashboardContextLoader::new(dashboard_id);
        let context_messages = context_loader
            .load_context(&user, agent.get_agent())
            .await?;
        initial_messages.extend(context_messages);
    }

    // Add the new user message (now with unwrap_or_default for optional prompt)
    initial_messages.push(AgentMessage::user(
        request.prompt.clone().unwrap_or_default(),
    ));

    // Initialize raw_llm_messages with initial_messages
    let mut raw_llm_messages = initial_messages.clone();
    let _raw_response_message = String::new();

    // Initialize the agent thread
    let mut chat = AgentThread::new(Some(chat_id), user.id, initial_messages);

    let title_handle = {
        let tx = tx.clone();
        let user_id = user.id;
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
    let mut sent_initial_files = false; // Flag to track if initial files have been sent
    let mut early_sent_file_messages: Vec<Value> = Vec::new(); // Store file messages sent early

    // --- START: Load History and Find Context Dashboard ---
    let mut context_dashboard_id: Option<Uuid> = None;
    if let Some(existing_chat_id) = request.chat_id {
        // Fetch the most recent message for this chat to find the last dashboard shown
        let pool = get_pg_pool();
        let mut conn = pool.get().await?;

        let last_message_result = messages::table
            .filter(messages::chat_id.eq(existing_chat_id))
            .order(messages::created_at.desc())
            .first::<Message>(&mut conn)
            .await
            .optional()?; // Use optional() to handle chats with no previous messages gracefully

        if let Some(last_message) = last_message_result {
            if let Ok(last_response_values) =
                serde_json::from_value::<Vec<Value>>(last_message.response_messages)
            {
                for value in last_response_values {
                    if let Ok(response_msg) = serde_json::from_value::<BusterChatMessage>(value) {
                        if let BusterChatMessage::File { id, file_type, .. } = response_msg {
                            if file_type == "dashboard" {
                                if let Ok(uuid) = Uuid::parse_str(&id) {
                                    context_dashboard_id = Some(uuid);
                                    tracing::debug!("Found context dashboard ID: {}", uuid);
                                    break; // Found the most recent dashboard
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    // --- END: Load History and Find Context Dashboard ---

    // Process all messages from the agent
    while let Ok(message_result) = rx.recv().await {
        match message_result {
            Ok(AgentMessage::Done) => {
                // Agent has finished processing, break the loop
                break;
            }
            Ok(msg) => {
                // Store the original message for file processing
                all_messages.push(msg.clone());

                // Only store completed messages in raw_llm_messages
                match &msg {
                    AgentMessage::Assistant {
                        progress,
                        content,
                        id,
                        ..
                    } => {
                        // Store chunks in the tracker to ensure deduplication
                        if let Some(content_str) = content {
                            // Use message ID as chunk ID, or generate a consistent one if missing
                            let chunk_id = id
                                .clone()
                                .unwrap_or_else(|| "assistant_message".to_string());
                            // Add to chunk tracker to handle deduplication
                            chunk_tracker.add_chunk(chunk_id.clone(), content_str.clone());
                        }

                        if matches!(progress, MessageProgress::Complete) {
                            if let Some(content_str) = content {
                                // Use message ID as chunk ID, or generate a consistent one if missing
                                let chunk_id = id
                                    .clone()
                                    .unwrap_or_else(|| "assistant_message".to_string());

                                // Get the complete deduplicated text from the chunk tracker
                                let complete_text = chunk_tracker
                                    .get_complete_text(chunk_id.clone())
                                    .unwrap_or_else(|| content_str.clone());

                                // Create a new message with the deduplicated content
                                raw_llm_messages.push(AgentMessage::Assistant {
                                    id: id.clone(),
                                    content: Some(complete_text),
                                    name: None,
                                    tool_calls: None,
                                    progress: MessageProgress::Complete,
                                    initial: false,
                                });

                                // Clear the chunk from the tracker
                                chunk_tracker.clear_chunk(chunk_id);
                            } else {
                                // If there's no content, just use the original message
                                raw_llm_messages.push(msg.clone());
                            }
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

                // Store transformed containers BEFORE potential early file sending
                // This ensures the files are based on the most up-to-date reasoning
                let transformed_results = transform_message(
                    &chat_id,
                    &message_id,
                    msg.clone(),
                    tx.as_ref(),
                    &chunk_tracker,
                )
                .await;

                match transformed_results {
                    Ok(containers) => {
                        // Store all transformed containers first
                        all_transformed_containers
                            .extend(containers.iter().map(|(c, _)| c.clone()));

                        // --- START: Early File Sending Logic ---
                        // Check if this is the first text chunk and we haven't sent files yet
                        if !sent_initial_files {
                            // Look for an incoming text chunk within the *current* message `msg`
                            if let AgentMessage::Assistant {
                                content: Some(_),
                                progress: MessageProgress::InProgress,
                                ..
                            } = &msg
                            {
                                if let Some(tx_channel) = &tx {
                                    // Set flag immediately to prevent re-entry
                                    sent_initial_files = true;

                                    // Perform filtering based on containers received SO FAR
                                    let current_completed_files =
                                        collect_completed_files(&all_transformed_containers);
                                    // Pass context_dashboard_id and pool, await the async function
                                    match apply_file_filtering_rules(
                                        &current_completed_files,
                                        context_dashboard_id,
                                        &get_pg_pool(),
                                    )
                                    .await
                                    {
                                        Ok(filtered_files_info) => {
                                            early_sent_file_messages =
                                                generate_file_response_values(&filtered_files_info);

                                            // Send the filtered file messages FIRST
                                            for file_value in &early_sent_file_messages {
                                                if let Ok(buster_chat_message) =
                                                    serde_json::from_value::<BusterChatMessage>(
                                                        file_value.clone(),
                                                    )
                                                {
                                                    let file_container =
                                                        BusterContainer::ChatMessage(
                                                            BusterChatMessageContainer {
                                                                response_message:
                                                                    buster_chat_message,
                                                                chat_id,
                                                                message_id,
                                                            },
                                                        );
                                                    if tx_channel
                                                        .send(Ok((
                                                            file_container,
                                                            ThreadEvent::GeneratingResponseMessage,
                                                        )))
                                                        .await
                                                        .is_err()
                                                    {
                                                        tracing::warn!("Client disconnected while sending early file messages");
                                                        // Setting the flag ensures we don't retry, but allows loop to continue processing other messages if needed
                                                        // Potentially break here if sending is critical: break;
                                                    }
                                                } else {
                                                    tracing::error!("Failed to deserialize early file message value: {:?}", file_value);
                                                }
                                            }
                                        }
                                        Err(e) => {
                                            tracing::error!(
                                                "Error applying file filtering rules early: {}",
                                                e
                                            );
                                            // Optionally send an error over tx_channel or handle otherwise
                                            // For now, proceed without sending early files if filtering fails
                                            early_sent_file_messages = vec![]; // Ensure list is empty
                                        }
                                    }
                                }
                            }
                        }
                        // --- END: Early File Sending Logic ---

                        // Now send the transformed containers for the current message
                        if let Some(tx_channel) = &tx {
                            for (container, thread_event) in containers {
                                if tx_channel
                                    .send(Ok((container, thread_event)))
                                    .await
                                    .is_err()
                                {
                                    tracing::warn!(
                                        "Client disconnected, but continuing to process messages"
                                    );
                                    // Don't break immediately, allow storing final state
                                }
                            }
                        }
                    }
                    Err(e) => {
                        tracing::error!("Error transforming message: {}", e);
                        if let Some(tx_channel) = &tx {
                            let _ = tx_channel.send(Err(e)).await;
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

    // Format reasoning duration
    let formatted_reasoning_duration = if reasoning_duration < 60 {
        format!("Reasoned for {} seconds", reasoning_duration)
    } else {
        let minutes = reasoning_duration / 60;
        if minutes == 1 {
            "Reasoned for 1 minute".to_string() // Singular minute
        } else {
            format!("Reasoned for {} min", minutes) // Plural minutes (abbreviated)
        }
    };

    // Transform all messages for final storage
    // Get initial response messages (text, etc.) and reasoning messages separately
    let (mut text_and_other_response_messages, reasoning_messages) =
        prepare_final_message_state(&all_transformed_containers)?;

    // Create the final response message list: Start with filtered files, then add text/other messages
    // Use the file messages that were generated and sent early
    let mut final_response_messages = early_sent_file_messages; // Use early sent files
    final_response_messages.append(&mut text_and_other_response_messages);

    // Update chat_with_messages with final state (now including filtered files first)
    let final_message = ChatMessage::new_with_messages(
        message_id,
        Some(ChatUserMessage {
            request: request.prompt.clone().unwrap_or_default(),
            sender_id: user.id,
            sender_name: user.name.clone().unwrap_or_default(),
            sender_avatar: None,
        }),
        final_response_messages.clone(), // Use the reordered list
        reasoning_messages.clone(),
        Some(formatted_reasoning_duration.clone()), // Use formatted reasoning duration for regular messages
        Utc::now(),
    );

    chat_with_messages.update_message(final_message);

    // Create and store message in the database with final state
    let db_message = Message {
        id: message_id,
        request_message: Some(request.prompt.unwrap_or_default()),
        chat_id,
        created_by: user.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        response_messages: serde_json::to_value(&final_response_messages)?, // Use the reordered list
        reasoning: serde_json::to_value(&reasoning_messages)?,
        final_reasoning_message: Some(formatted_reasoning_duration), // Use formatted reasoning duration for regular messages
        title: title.title.clone().unwrap_or_default(),
        raw_llm_messages: serde_json::to_value(&raw_llm_messages)?,
        feedback: None,
    };

    let mut conn = get_pg_pool().get().await?;

    // Insert message into database
    insert_into(messages::table)
        .values(&db_message)
        .execute(&mut conn)
        .await?;

    // First process completed files (database updates only)
    // Use a separate connection scope to ensure prompt release
    {
        process_completed_files(
            &mut conn,
            &db_message,
            &all_messages,
            &user_org_id,
            &user.id,
            &chunk_tracker,
        )
        .await?;
    }

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
        chat_with_messages.title = title.clone();
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
    // Use a Vec to maintain order, with a HashMap to track latest version of each message
    let mut reasoning_map: std::collections::HashMap<String, (usize, Value)> =
        std::collections::HashMap::new();
    let mut reasoning_order = Vec::new();

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
                // Only include reasoning messages that are explicitly marked as completed
                let should_include = match &reasoning.reasoning {
                    BusterReasoningMessage::Pill(thought) => thought.status == "completed",
                    BusterReasoningMessage::File(file) => file.status == "completed",
                    BusterReasoningMessage::Text(text) => {
                        text.status.as_deref() == Some("completed")
                    }
                };

                if should_include {
                    if let Ok(value) = serde_json::to_value(&reasoning.reasoning) {
                        // Get the ID from the reasoning message
                        let id = match &reasoning.reasoning {
                            BusterReasoningMessage::Pill(thought) => thought.id.clone(),
                            BusterReasoningMessage::File(file) => file.id.clone(),
                            BusterReasoningMessage::Text(text) => text.id.clone(),
                        };

                        // If this is a new message ID, add it to the order tracking
                        if !reasoning_map.contains_key(&id) {
                            reasoning_order.push(id.clone());
                        }

                        // Store or update the message in the map with its position
                        reasoning_map.insert(id, (reasoning_order.len() - 1, value));
                    }
                }
            }
            _ => {}
        }
    }

    // Convert the map values into the final vector, maintaining order
    let mut reasoning_messages = vec![Value::Null; reasoning_order.len()];
    for id in reasoning_order {
        if let Some((pos, value)) = reasoning_map.get(&id) {
            reasoning_messages[*pos] = value.clone();
        }
    }

    // Remove any null values (shouldn't happen, but just in case)
    reasoning_messages.retain(|v| !v.is_null());

    Ok((response_messages, reasoning_messages))
}

/// Process any completed files and create necessary database records
async fn process_completed_files(
    conn: &mut diesel_async::AsyncPgConnection,
    message: &Message,
    messages: &[AgentMessage], // Use original AgentMessages for context if needed
    _organization_id: &Uuid,
    _user_id: &Uuid,
    chunk_tracker: &ChunkTracker, // Pass tracker if needed for transforming messages again
) -> Result<()> {
    // Transform messages again specifically for DB processing if needed,
    // or directly use reasoning messages if they contain enough info.
    let mut transformed_messages_for_db = Vec::new();
    for msg in messages {
        // Use a temporary tracker instance if needed, or reuse the main one
        if let Ok(containers) = transform_message(
            &message.chat_id,
            &message.id,
            msg.clone(),
            None,
            chunk_tracker,
        )
        .await
        {
            transformed_messages_for_db.extend(containers.into_iter().map(|(c, _)| c));
        }
    }

    let mut processed_file_ids = std::collections::HashSet::new();

    for container in transformed_messages_for_db {
        // Use the re-transformed messages
        if let BusterContainer::ReasoningMessage(msg) = container {
            match &msg.reasoning {
                BusterReasoningMessage::File(file)
                    if file.message_type == "files" && file.status == "completed" =>
                {
                    for (file_id_key, file_content) in &file.files {
                        if file_content.status == "completed" {
                            // Ensure inner file is also complete
                            let file_uuid = match Uuid::parse_str(file_id_key) {
                                Ok(uuid) => uuid,
                                Err(_) => {
                                    tracing::warn!(
                                        "Invalid UUID format for file ID in reasoning: {}",
                                        file_id_key
                                    );
                                    continue; // Skip this file
                                }
                            };

                            // Skip if we've already processed this file ID
                            if !processed_file_ids.insert(file_uuid) {
                                continue;
                            }

                            // Create message-to-file association
                            let message_to_file = MessageToFile {
                                id: Uuid::new_v4(),
                                message_id: message.id,
                                file_id: file_uuid,
                                created_at: Utc::now(),
                                updated_at: Utc::now(),
                                deleted_at: None,
                                is_duplicate: false, // Determine duplication logic if needed
                                version_number: file_content.version_number,
                            };

                            // Insert the message to file association
                            if let Err(e) = diesel::insert_into(messages_to_files::table)
                                .values(&message_to_file)
                                .execute(conn)
                                .await
                            {
                                tracing::error!(
                                    "Failed to insert message_to_file link for file {}: {}",
                                    file_uuid,
                                    e
                                );
                                continue; // Skip chat update if DB link fails
                            }

                            // Determine file type for chat update
                            let file_type_for_chat = match file_content.file_type.as_str() {
                                "dashboard" => Some("dashboard".to_string()),
                                "metric" => Some("metric".to_string()),
                                _ => None,
                            };

                            // Update the chat with the most recent file info
                            if let Err(e) = diesel::update(chats::table.find(message.chat_id))
                                .set((
                                    chats::most_recent_file_id.eq(Some(file_uuid)),
                                    chats::most_recent_file_type.eq(file_type_for_chat),
                                    // chats::most_recent_version_number implicitly handled by file version
                                    chats::updated_at.eq(Utc::now()),
                                ))
                                .execute(conn)
                                .await
                            {
                                tracing::error!("Failed to update chat {} with most recent file info for {}: {}", message.chat_id, file_uuid, e);
                            }
                        }
                    }
                }
                _ => (),
            }
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

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct BusterChatResponseFileMetadata {
    pub status: String,
    pub message: String,
    pub timestamp: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
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
    _tx: Option<&mpsc::Sender<Result<(BusterContainer, ThreadEvent)>>>,
    tracker: &ChunkTracker,
) -> Result<Vec<(BusterContainer, ThreadEvent)>> {
    match message {
        AgentMessage::Assistant {
            id,
            content,
            name: _name,
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
                    tracker,
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
                containers.extend(
                    chat_messages
                        .into_iter()
                        .map(|container| (container, ThreadEvent::GeneratingResponseMessage)),
                );

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

                    containers.push((reasoning_container, ThreadEvent::GeneratingResponseMessage));
                }

                Ok(containers)
            } else if let Some(tool_calls) = tool_calls {
                let mut containers = Vec::new();

                // Transform tool messages
                match transform_assistant_tool_message(
                    tool_calls.clone(),
                    progress.clone(),
                    initial,
                    *chat_id,
                    *message_id,
                    tracker,
                ) {
                    Ok(messages) => {
                        for reasoning_container in messages {
                            // No longer generate response messages here, only reasoning

                            containers.push((
                                BusterContainer::ReasoningMessage(
                                    BusterReasoningMessageContainer {
                                        reasoning: reasoning_container,
                                        chat_id: *chat_id,
                                        message_id: *message_id,
                                    },
                                ),
                                ThreadEvent::GeneratingReasoningMessage,
                            ));
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

                Ok(containers)
            } else {
                Ok(vec![])
            }
        }
        AgentMessage::Tool {
            id: _id,
            content,
            tool_call_id,
            name,
            progress,
        } => {
            if let Some(name) = name {
                let name_str = name.clone();
                let mut containers = Vec::new();

                match transform_tool_message(
                    tool_call_id,
                    name,
                    content.clone(),
                    *chat_id,
                    *message_id,
                ) {
                    Ok(messages) => {
                        for reasoning_container in messages {
                            // No longer generate response messages here, only reasoning

                            containers.push((
                                BusterContainer::ReasoningMessage(
                                    BusterReasoningMessageContainer {
                                        reasoning: reasoning_container,
                                        chat_id: *chat_id,
                                        message_id: *message_id,
                                    },
                                ),
                                ThreadEvent::GeneratingReasoningMessage,
                            ));
                        }
                    }
                    Err(e) => {
                        tracing::warn!("Error transforming tool message '{}': {:?}", name_str, e);
                        println!("MESSAGE_STREAM: Error transforming tool message: {:?}", e);
                    }
                };

                Ok(containers)
            } else {
                Ok(vec![])
            }
        }
        _ => Ok(vec![]),
    }
}

fn transform_text_message(
    id: String,
    content: String,
    progress: MessageProgress,
    _chat_id: Uuid,
    _message_id: Uuid,
    tracker: &ChunkTracker,
) -> Result<Vec<BusterChatMessage>> {
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
            // First try to get the complete accumulated text from the tracker
            let complete_text = tracker
                .get_complete_text(id.clone())
                .unwrap_or_else(|| content.clone());

            // Clear the tracker for this chunk
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
    _chat_id: Uuid,
    _message_id: Uuid,
) -> Result<Vec<BusterReasoningMessage>> {
    // Use required ID (tool call ID) for all function calls
    let messages = match name.as_str() {
        "search_data_catalog" => tool_data_catalog_search(id.clone(), content)?,
        "create_metrics" => tool_create_metrics(id.clone(), content)?,
        "update_metrics" => tool_modify_metrics(id.clone(), content)?,
        "create_dashboards" => tool_create_dashboards(id.clone(), content)?,
        "update_dashboards" => tool_modify_dashboards(id.clone(), content)?,
        // Handle both new plan tools here
        "create_plan_straightforward" | "create_plan_investigative" => tool_create_plan(id.clone(), content)?,
        _ => vec![],
    };

    Ok(messages)
}

// Structs to parse the output of the new tools
#[derive(Deserialize)]
struct GenericPlanOutput {
    plan: String,
}

fn tool_create_plan(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    // Define a struct to parse the success status (optional)
    #[derive(Deserialize)]
    struct PlanOutput {
        success: bool,
    }

    // Attempt to parse the success field (optional validation)
    match serde_json::from_str::<PlanOutput>(&content) {
        Ok(output) if output.success => {
            // Successfully completed, no need to return a message
            // as assistant_create_plan_input already created it.
            tracing::debug!("Tool create_plan {} completed successfully.", id);
            Ok(vec![])
        }
        Ok(_) => {
            tracing::warn!(
                "Tool create_plan {} output indicates failure: {}.",
                id,
                content
            );
            // Optionally return an error message here if needed
            Ok(vec![])
        }
        Err(e) => {
            // Log the parsing error, but still return Ok([]) as the primary
            // purpose is just acknowledging completion.
            tracing::error!(
                "Failed to parse tool_create_plan output for {}: {}. Content: {}",
                id,
                e,
                content
            );
            Ok(vec![])
        }
    }
}

// Update tool_create_metrics to require ID
fn tool_create_metrics(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    // Parse the CreateMetricFilesOutput from content
    let create_metrics_result = match serde_json::from_str::<CreateMetricFilesOutput>(&content) {
        Ok(result) => result,
        Err(e) => {
            println!("Failed to parse CreateMetricFilesOutput: {:?}", e);
            return Ok(vec![]);
        }
    };

    let duration = (create_metrics_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;
    let files_count = create_metrics_result.files.len();

    // Create a map of files
    let mut files_map = std::collections::HashMap::new();
    let mut file_ids = Vec::new();

    // Process each file
    for file in create_metrics_result.files {
        let file_id = file.id.to_string();
        file_ids.push(file_id.clone());

        let buster_file = BusterFile {
            id: file_id.clone(),
            file_type: "metric".to_string(),
            file_name: file.name.clone(),
            version_number: 1,
            status: "completed".to_string(),
            file: BusterFileContent {
                text: Some(file.yml_content),
                text_chunk: None,
                modifided: None,
            },
            metadata: Some(vec![]),
        };

        files_map.insert(file_id, buster_file);
    }

    // Create the BusterReasoningFile
    let buster_file = BusterReasoningMessage::File(BusterReasoningFile {
        id,
        message_type: "files".to_string(),
        title: format!("Created {} metric files", files_count),
        secondary_title: format!("{} seconds", duration),
        status: "completed".to_string(),
        file_ids,
        files: files_map,
    });

    Ok(vec![buster_file])
}

// Update tool_modify_metrics to require ID
fn tool_modify_metrics(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    // Parse the ModifyFilesOutput from content
    let modify_metrics_result = match serde_json::from_str::<ModifyFilesOutput>(&content) {
        Ok(result) => result,
        Err(e) => {
            println!("Failed to parse ModifyFilesOutput: {:?}", e);
            return Ok(vec![]);
        }
    };

    let duration = (modify_metrics_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;
    let files_count = modify_metrics_result.files.len();

    // Create a map of files
    let mut files_map = std::collections::HashMap::new();
    let mut file_ids = Vec::new();

    // Process each file
    for file in modify_metrics_result.files {
        let file_id = file.id.to_string();
        file_ids.push(file_id.clone());

        let buster_file = BusterFile {
            id: file_id.clone(),
            file_type: "metric".to_string(),
            file_name: file.name.clone(), // Use the updated name from the file
            version_number: file.version_number,
            status: "completed".to_string(),
            file: BusterFileContent {
                text: Some(file.yml_content),
                text_chunk: None,
                modifided: None,
            },
            metadata: Some(vec![]),
        };

        files_map.insert(file_id, buster_file);
    }

    // Create the BusterReasoningFile
    let buster_file = BusterReasoningMessage::File(BusterReasoningFile {
        id,
        message_type: "files".to_string(),
        title: format!("Modified {} metric files", files_count),
        secondary_title: format!("{} seconds", duration),
        status: "completed".to_string(),
        file_ids,
        files: files_map,
    });

    Ok(vec![buster_file])
}

// Update tool_create_dashboards to require ID
fn tool_create_dashboards(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    // Parse the CreateDashboardFilesOutput from content
    let create_dashboards_result =
        match serde_json::from_str::<CreateDashboardFilesOutput>(&content) {
            Ok(result) => result,
            Err(e) => {
                println!("Failed to parse CreateDashboardFilesOutput: {:?}", e);
                return Ok(vec![]);
            }
        };

    let duration = (create_dashboards_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;
    let files_count = create_dashboards_result.files.len();

    // Create a map of files
    let mut files_map = std::collections::HashMap::new();
    let mut file_ids = Vec::new();

    // Process each file
    for file in create_dashboards_result.files {
        let file_id = file.id.to_string();
        file_ids.push(file_id.clone());

        let buster_file = BusterFile {
            id: file_id.clone(),
            file_type: "dashboard".to_string(),
            file_name: file.name.clone(),
            version_number: 1,
            status: "completed".to_string(),
            file: BusterFileContent {
                text: Some(file.yml_content),
                text_chunk: None,
                modifided: None,
            },
            metadata: Some(vec![]),
        };

        files_map.insert(file_id, buster_file);
    }

    // Create the BusterReasoningFile
    let buster_file = BusterReasoningMessage::File(BusterReasoningFile {
        id,
        message_type: "files".to_string(),
        title: format!("Created {} dashboard files", files_count),
        secondary_title: format!("{} seconds", duration),
        status: "completed".to_string(),
        file_ids,
        files: files_map,
    });

    Ok(vec![buster_file])
}

// Update tool_modify_dashboards to require ID
fn tool_modify_dashboards(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    // Parse the ModifyFilesOutput from content
    let modify_dashboards_result = match serde_json::from_str::<ModifyFilesOutput>(&content) {
        Ok(result) => result,
        Err(e) => {
            println!("Failed to parse ModifyFilesOutput: {:?}", e);
            return Ok(vec![]);
        }
    };

    let duration = (modify_dashboards_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;
    let files_count = modify_dashboards_result.files.len();

    // Create a map of files
    let mut files_map = std::collections::HashMap::new();
    let mut file_ids = Vec::new();

    // Process each file
    for file in modify_dashboards_result.files {
        let file_id = file.id.to_string();
        file_ids.push(file_id.clone());

        let buster_file = BusterFile {
            id: file_id.clone(),
            file_type: "dashboard".to_string(),
            file_name: file.name.clone(),
            version_number: file.version_number,
            status: "completed".to_string(),
            file: BusterFileContent {
                text: Some(file.yml_content),
                text_chunk: None,
                modifided: None,
            },
            metadata: Some(vec![]),
        };

        files_map.insert(file_id, buster_file);
    }

    // Create the BusterReasoningFile
    let buster_file = BusterReasoningMessage::File(BusterReasoningFile {
        id,
        message_type: "files".to_string(),
        title: format!("Modified {} dashboard files", files_count),
        secondary_title: format!("{} seconds", duration),
        status: "completed".to_string(),
        file_ids,
        files: files_map,
    });

    Ok(vec![buster_file])
}

// Restore the original tool_data_catalog_search function
fn tool_data_catalog_search(id: String, content: String) -> Result<Vec<BusterReasoningMessage>> {
    let data_catalog_result = match serde_json::from_str::<SearchDataCatalogOutput>(&content) {
        Ok(result) => result,
        Err(e) => {
            println!("Failed to parse SearchDataCatalogOutput: {}. Content: {}", e, content);
            return Ok(vec![]);
        }
    };

    let duration = (data_catalog_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;
    let result_count = data_catalog_result.results.len();
    let input_queries = data_catalog_result.queries.join(", "); // Join queries for display

    let thought_pill_containers = match proccess_data_catalog_search_results(data_catalog_result) {
        Ok(containers) => containers,
        Err(e) => {
            println!("Failed to process data catalog search results: {}", e);
            return Ok(vec![]);
        }
    };

    let buster_thought = if result_count > 0 {
        BusterReasoningMessage::Pill(BusterReasoningPill {
            id: id.clone(),
            thought_type: "pills".to_string(),
            title: "Data Catalog Search Results".to_string(), // Updated title
            secondary_title: format!("Searched for: {}", input_queries), // Display input queries
            pill_containers: Some(thought_pill_containers),
            status: "completed".to_string(),
        })
    } else {
        BusterReasoningMessage::Pill(BusterReasoningPill {
            id: id.clone(),
            thought_type: "pills".to_string(),
            title: "No data catalog items found".to_string(),
            secondary_title: format!("Searched for: {}", input_queries), // Display input queries even if no results
            pill_containers: Some(vec![BusterThoughtPillContainer {
                title: "No results found".to_string(),
                pills: vec![], // Keep pills empty as no results were found
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
    _chat_id: Uuid,
    _message_id: Uuid,
    tracker: &ChunkTracker,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut all_messages = Vec::new();

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
            "update_metrics" => assistant_modify_metrics(
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
            "update_dashboards" => assistant_modify_dashboards(
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
            "create_plan_investigative" => assistant_create_plan_input(
                tool_id,
                tool_call.function.arguments.clone(),
                progress.clone(),
            )?,
            "create_plan_straightforward" => assistant_create_plan_input(
                tool_id,
                tool_call.function.arguments.clone(),
                progress.clone(),
            )?,
            _ => vec![],
        };

        let containers: Vec<BusterReasoningMessage> = messages
            .into_iter()
            .filter_map(|reasoning| {
                match reasoning {
                    BusterReasoningMessage::Text(mut text) => {
                        match progress {
                            MessageProgress::Complete => {
                                // For completed messages, use accumulated text or final message
                                text.message = tracker
                                    .get_complete_text(text.id.clone())
                                    .or(text.message)
                                    .or(text.message_chunk.clone());
                                text.message_chunk = None;
                                // Always set status to loading for assistant messages
                                text.status = Some("loading".to_string());
                                tracker.clear_chunk(text.id.clone());
                                Some(BusterReasoningMessage::Text(text))
                            }
                            MessageProgress::InProgress => {
                                if let Some(chunk) = text.message_chunk.clone() {
                                    let delta = tracker.add_chunk(text.id.clone(), chunk);
                                    if !delta.is_empty() {
                                        text.message_chunk = Some(delta);
                                        text.message = None;
                                        text.status = Some("loading".to_string());
                                        Some(BusterReasoningMessage::Text(text))
                                    } else {
                                        None
                                    }
                                } else {
                                    None
                                }
                            }
                        }
                    }
                    BusterReasoningMessage::File(mut file) => {
                        match progress {
                            MessageProgress::Complete => {
                                let mut updated_files = std::collections::HashMap::new();

                                for (file_id, file_content) in file.files.iter() {
                                    let chunk_id =
                                        format!("{}_{}", file.id, file_content.file_name);
                                    let complete_text = tracker
                                        .get_complete_text(chunk_id.clone())
                                        .unwrap_or_else(|| {
                                            file_content.file.text_chunk.clone().unwrap_or_default()
                                        });

                                    let mut completed_content = file_content.clone();
                                    completed_content.file.text = Some(complete_text);
                                    completed_content.file.text_chunk = None;
                                    // Always set status to loading
                                    completed_content.status = "loading".to_string();
                                    updated_files.insert(file_id.clone(), completed_content);

                                    tracker.clear_chunk(chunk_id);
                                }

                                // Always set status to loading
                                file.status = "loading".to_string();
                                file.files = updated_files;
                                Some(BusterReasoningMessage::File(file))
                            }
                            MessageProgress::InProgress => {
                                let mut has_updates = false;
                                let mut updated_files = std::collections::HashMap::new();

                                for (file_id, file_content) in file.files.iter() {
                                    let chunk_id =
                                        format!("{}_{}", file.id, file_content.file_name);

                                    if let Some(chunk) = &file_content.file.text_chunk {
                                        let delta =
                                            tracker.add_chunk(chunk_id.clone(), chunk.clone());

                                        if !delta.is_empty() {
                                            let mut updated_content = file_content.clone();
                                            updated_content.file.text_chunk = Some(delta);
                                            updated_content.file.text = None;
                                            updated_content.id = file_id.clone();
                                            updated_content.status = "loading".to_string();
                                            updated_files.insert(file_id.clone(), updated_content);
                                            has_updates = true;
                                        }
                                    }
                                }

                                if has_updates {
                                    file.status = "loading".to_string();
                                    file.files = updated_files;
                                    Some(BusterReasoningMessage::File(file))
                                } else {
                                    None
                                }
                            }
                        }
                    }
                    BusterReasoningMessage::Pill(mut pill) => {
                        // Always set status to loading for pills
                        pill.status = "loading".to_string();
                        Some(BusterReasoningMessage::Pill(pill))
                    }
                }
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
    _progress: MessageProgress,
    _initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    if let Ok(Some(message)) = parser.process_search_data_catalog_chunk(id.clone(), &content) {
        match message {
            BusterReasoningMessage::Text(mut text) => {
                text.status = Some("loading".to_string());
                return Ok(vec![BusterReasoningMessage::Text(text)]);
            }
            _ => {
                // Log unexpected type if needed
                tracing::warn!("Unexpected message type from search data catalog chunk processing: {:?}", message);
                return Ok(vec![]) // Don't proceed if the type is unexpected
            }
        }
    }

    // No need for fallback parsing logic here anymore, the parser handles the stream start
    Ok(vec![])
}

fn assistant_create_metrics(
    id: String,
    content: String,
    _progress: MessageProgress,
    _initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    match parser.process_metric_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            // Always set status to loading, regardless of progress
            match message {
                BusterReasoningMessage::File(mut file) => {
                    file.status = "loading".to_string();
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
    _progress: MessageProgress,
    _initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    match parser.process_metric_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            // Always set status to loading, regardless of progress
            match message {
                BusterReasoningMessage::File(mut file) => {
                    file.status = "loading".to_string();
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
    _progress: MessageProgress,
    _initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    match parser.process_dashboard_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            // Always set status to loading, regardless of progress
            match message {
                BusterReasoningMessage::File(mut file) => {
                    file.status = "loading".to_string();
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
    _progress: MessageProgress,
    _initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    match parser.process_dashboard_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            // Always set status to loading, regardless of progress
            match message {
                BusterReasoningMessage::File(mut file) => {
                    file.status = "loading".to_string();
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
    _progress: MessageProgress,
    _initial: bool,
) -> Result<Vec<BusterReasoningMessage>> {
    let mut parser = StreamingParser::new();

    // Directly call process_plan_chunk which handles parsing the 'plan' field
    match parser.process_plan_chunk(id.clone(), &content) {
        Ok(Some(message)) => {
            // The parser returns the correct BusterReasoningMessage structure
            // Ensure the status is loading as it's an assistant message
            match message {
                BusterReasoningMessage::Text(mut text) => {
                    text.status = Some("loading".to_string());
                    Ok(vec![BusterReasoningMessage::Text(text)])
                }
                 // Handle other types potentially returned by the parser if necessary
                _ => Ok(vec![message]),
            }
        }
        Ok(None) => Ok(vec![]), // No complete message chunk parsed yet
        Err(e) => {
             tracing::error!("Failed to parse plan arguments chunk for {}: {}. Content: {}", id, e, content);
             Err(e) // Propagate the error
        }
    }
}

// Create a new function to handle the plan from tool input arguments
fn assistant_create_plan_input(
    id: String,
    arguments_json: String, // This is the potentially partial JSON chunk
    _progress: MessageProgress, // Keep progress for potential future use
) -> Result<Vec<BusterReasoningMessage>> {
    // Use the streaming parser to handle potentially incomplete JSON chunks
    let mut parser = StreamingParser::new();

    // Call process_plan_chunk which handles parsing the 'plan' field from chunks
    match parser.process_plan_chunk(id.clone(), &arguments_json) {
        Ok(Some(message)) => {
            // The parser returns the correct BusterReasoningMessage structure with message_chunk
            // Ensure the status is loading as it's an assistant message
            match message {
                BusterReasoningMessage::Text(mut text) => {
                    // Parser sets message_chunk, we ensure status is loading
                    text.status = Some("loading".to_string());
                    Ok(vec![BusterReasoningMessage::Text(text)])
                }
                 // Handle other types potentially returned by the parser if necessary (though unlikely for plan)
                _ => {
                    tracing::warn!("StreamingParser::process_plan_chunk returned unexpected type for {}", id);
                    Ok(vec![])
                }
            }
        }
        Ok(None) => Ok(vec![]), // No complete message chunk parsed yet or not a plan structure
        Err(e) => {
             tracing::error!("Failed to parse plan arguments chunk for {}: {}. Content: {}", id, e, arguments_json);
             Err(e) // Propagate the error
        }
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

/// Helper function to normalize legacy and new asset fields
///
/// This function converts legacy asset fields (metric_id, dashboard_id) to the new
/// generic asset_id/asset_type format. It ensures backward compatibility while
/// using a single code path for processing assets.
///
/// Returns a tuple of (Option<Uuid>, Option<AssetType>) representing the normalized
/// asset reference.
pub fn normalize_asset_fields(request: &ChatCreateNewChat) -> (Option<Uuid>, Option<AssetType>) {
    // If asset_id/asset_type are directly provided, use them
    if request.asset_id.is_some() && request.asset_type.is_some() {
        return (request.asset_id, request.asset_type);
    }

    // If legacy fields are provided, convert them to the new format
    if let Some(metric_id) = request.metric_id {
        return (Some(metric_id), Some(AssetType::MetricFile));
    }

    if let Some(dashboard_id) = request.dashboard_id {
        return (Some(dashboard_id), Some(AssetType::DashboardFile));
    }

    // No asset references
    (None, None)
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

// The implementation has been moved to ChatContextLoader.update_context_from_tool_calls

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
        model: "gpt-4o-mini".to_string(),
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
        chat_id: *session_id,
        message_id: *message_id,
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

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(anyhow::anyhow!("Failed to get database connection: {}", e));
        }
    };

    diesel::update(chats::table)
        .filter(chats::id.eq(*session_id))
        .set((
            chats::title.eq(title.title.clone().unwrap_or_default()),
            chats::updated_at.eq(Utc::now()),
        ))
        .execute(&mut conn)
        .await?;

    Ok(title)
}

async fn initialize_chat(
    request: &ChatCreateNewChat,
    user: &AuthenticatedUser,
    user_org_id: Uuid,
) -> Result<(Uuid, Uuid, ChatWithMessages)> {
    let message_id = request.message_id.unwrap_or_else(Uuid::new_v4);

    // Get a default title for chats
    let default_title = {
        // Try to derive title from asset if available
        let (asset_id, asset_type) = normalize_asset_fields(request);
        if let (Some(asset_id), Some(asset_type)) = (asset_id, asset_type) {
            match fetch_asset_details(asset_id, asset_type).await {
                Ok(details) => details.name.clone(),
                Err(_) => "New Chat".to_string(),
            }
        } else {
            "".to_string()
        }
    };

    // Get the actual prompt or empty string if None
    let prompt_text = request.prompt.clone().unwrap_or_default();

    if let Some(existing_chat_id) = request.chat_id {
        // Get existing chat - no need to create new chat in DB
        let mut existing_chat = get_chat_handler(&existing_chat_id, &user, true).await?;

        // Create new message
        let message = ChatMessage::new_with_messages(
            message_id,
            Some(ChatUserMessage {
                request: prompt_text,
                sender_id: user.id,
                sender_name: user.name.clone().unwrap_or_default(),
                sender_avatar: None,
            }),
            Vec::new(),
            Vec::new(),
            None,
            Utc::now(),
        );

        // Add message to existing chat
        existing_chat.add_message(message);

        Ok((existing_chat_id, message_id, existing_chat))
    } else {
        // Create new chat since we don't have an existing one
        let chat_id = Uuid::new_v4();
        let chat = Chat {
            id: chat_id,
            title: default_title.clone(),
            organization_id: user_org_id,
            created_by: user.id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            updated_by: user.id,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            most_recent_file_id: None,
            most_recent_file_type: None,
            most_recent_version_number: None,
        };

        // Create initial message
        let message = ChatMessage::new_with_messages(
            message_id,
            Some(ChatUserMessage {
                request: prompt_text,
                sender_id: user.id,
                sender_name: user.name.clone().unwrap_or_default(),
                sender_avatar: None,
            }),
            Vec::new(),
            Vec::new(),
            None,
            Utc::now(),
        );

        let mut chat_with_messages = ChatWithMessages::new(
            default_title,
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

        insert_into(asset_permissions::table)
            .values(&AssetPermission {
                asset_id: chat_id,
                asset_type: AssetType::Chat,
                identity_id: user.id,
                identity_type: IdentityType::User,
                role: AssetPermissionRole::Owner,
                created_by: user.id,
                updated_by: user.id,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted_at: None,
            })
            .execute(&mut conn)
            .await?;

        Ok((chat_id, message_id, chat_with_messages))
    }
}

// Helper function to encapsulate file collection
fn collect_completed_files(containers: &[BusterContainer]) -> Vec<CompletedFileInfo> {
    let mut completed_files = Vec::new();
    for container in containers {
        if let BusterContainer::ReasoningMessage(reasoning_msg) = container {
            if let BusterReasoningMessage::File(file_reasoning) = &reasoning_msg.reasoning {
                if file_reasoning.message_type == "files" && file_reasoning.status == "completed" {
                    for (_file_id_key, file_detail) in &file_reasoning.files {
                        if file_detail.status == "completed" {
                            // Extract content, default to empty string if None
                            let content = file_detail.file.text.clone().unwrap_or_default();

                            completed_files.push(CompletedFileInfo {
                                id: file_detail.id.clone(),
                                file_type: file_detail.file_type.clone(),
                                file_name: file_detail.file_name.clone(),
                                version_number: file_detail.version_number,
                                content, // Populate the content field
                            });
                        }
                    }
                }
            }
        }
    }
    completed_files
}

// --- START: New Helper Function ---
// Fetches dashboard details from the database
async fn fetch_dashboard_details(
    id: Uuid,
    conn: &mut AsyncPgConnection,
) -> Result<Option<CompletedFileInfo>> {
    match dashboard_files::table
        .filter(dashboard_files::id.eq(id))
        // Select id, name, and version_history
        .select((dashboard_files::id, dashboard_files::name, dashboard_files::version_history))
        // Adjust expected tuple type
        .first::<(Uuid, String, VersionHistory)>(conn)
        .await
        .optional()? // Handle case where dashboard might not be found
    {
        Some((db_id, name, version_history)) => {
                if let Some(latest_version) = version_history.get_latest_version() {
                    // Extract dashboard_yml content and serialize it back to string
                    if let VersionContent::DashboardYml(dashboard_yml) = &latest_version.content {
                        match serde_json::to_string(dashboard_yml) { // Serialize to JSON string
                            Ok(content_string) => {
                                Ok(Some(CompletedFileInfo {
                                    id: db_id.to_string(),
                                    file_type: "dashboard".to_string(),
                                    file_name: name,
                                    version_number: latest_version.version_number,
                                    content: content_string, // Use serialized string
                                }))
                            }
                            Err(e) => {
                                tracing::error!("Failed to serialize DashboardYml content for {}: {}", db_id, e);
                                Ok(None) // Treat serialization error as unable to fetch details
                            }
                        }
                    } else {
                        // Content was not DashboardYml, unexpected
                        tracing::warn!("Latest version content for dashboard {} is not DashboardYml type.", db_id);
                        Ok(None)
                    }
                } else {
                    // Version history exists but has no versions
                    tracing::warn!("Version history for dashboard {} has no versions.", db_id);
                    Ok(None)
                }
        }
        None => Ok(None), // Dashboard not found in the table
    }
}
// --- END: New Helper Function ---

// Helper function to encapsulate filtering rules - NOW ASYNC
async fn apply_file_filtering_rules(
    completed_files_this_turn: &[CompletedFileInfo],
    context_dashboard_id: Option<Uuid>,
    pool: &PgPool, // Pass pool
) -> Result<Vec<CompletedFileInfo>> {
    // Return Result

    let metrics_this_turn: Vec<_> = completed_files_this_turn
        .iter()
        .filter(|f| f.file_type == "metric")
        .cloned()
        .collect();
    let dashboards_this_turn: Vec<_> = completed_files_this_turn
        .iter()
        .filter(|f| f.file_type == "dashboard")
        .cloned()
        .collect();

    match context_dashboard_id {
        // --- Context Exists ---
        Some(ctx_id) => {
            // Fetch context dashboard details once upfront
            let mut conn = pool.get().await?;
            let context_dashboard_info_opt = fetch_dashboard_details(ctx_id, &mut conn).await?;

            // If context dashboard couldn't be fetched (e.g., deleted), treat as no context
            if context_dashboard_info_opt.is_none() {
                tracing::warn!(
                    "Context dashboard ID {} not found, falling back to current turn logic.",
                    ctx_id
                );
                return process_current_turn_files(&metrics_this_turn, &dashboards_this_turn);
            }
            let context_dashboard_info = context_dashboard_info_opt.unwrap(); // Safe unwrap due to check above

            // Case 2 Check: Only context metrics modified, no new dashboards?
            if dashboards_this_turn.is_empty() && !metrics_this_turn.is_empty() {
                // Parse context dashboard to see if *all* modified metrics belong to it
                let mut all_metrics_belong_to_context = true;
                let context_metric_ids = match DashboardYml::new(
                    context_dashboard_info.content.clone(),
                ) {
                    Ok(yml) => yml
                        .rows
                        .iter()
                        .flat_map(|r| r.items.iter().map(|i| i.id))
                        .collect::<HashSet<Uuid>>(),
                    Err(e) => {
                        tracing::warn!("Failed to parse context dashboard {} for Case 2 check: {}. Assuming metrics might not belong.", ctx_id, e);
                        all_metrics_belong_to_context = false; // Cannot confirm, assume they don't all belong
                        HashSet::new()
                    }
                };

                if all_metrics_belong_to_context {
                    // Only proceed if context dashboard parsed
                    for metric in &metrics_this_turn {
                        if let Ok(metric_uuid) = Uuid::parse_str(&metric.id) {
                            if !context_metric_ids.contains(&metric_uuid) {
                                all_metrics_belong_to_context = false;
                                break;
                            }
                        }
                    }
                }

                // If all modified metrics seem to belong to the context dashboard, return only it.
                if all_metrics_belong_to_context {
                    tracing::debug!(
                        "Context dashboard {} exists, only metrics belonging to it were modified. Returning context dashboard.",
                         ctx_id
                    );
                    return Ok(vec![context_dashboard_info]);
                }
                // If not all metrics belong, fall through to Case 3 logic below
            }

            // Case 1 & 3: New dashboard created OR complex state (metrics modified don't all belong to context).
            tracing::debug!(
                "New dashboard created or metrics modified don't all belong to context dashboard {}. Checking for modified context metrics.", 
                ctx_id
            );

            // Check if any metric modified *this turn* belongs to the context dashboard.
            let mut modified_context_metric_this_turn = false;
            let context_metric_ids = match DashboardYml::new(context_dashboard_info.content.clone())
            {
                Ok(yml) => yml
                    .rows
                    .iter()
                    .flat_map(|r| r.items.iter().map(|i| i.id))
                    .collect::<HashSet<Uuid>>(),
                Err(e) => {
                    tracing::warn!("Failed to parse context dashboard {} for Case 3 check: {}. Assuming no context metrics modified.", ctx_id, e);
                    HashSet::new() // Assume no overlap if parsing fails
                }
            };

            for metric in &metrics_this_turn {
                if let Ok(metric_uuid) = Uuid::parse_str(&metric.id) {
                    if context_metric_ids.contains(&metric_uuid) {
                        modified_context_metric_this_turn = true;
                        break;
                    }
                }
            }

            // If a context metric was modified AND other assets exist this turn...
            if modified_context_metric_this_turn {
                tracing::debug!("Context metric modified alongside other assets. Combining context dashboard with current turn processing.");
                // Process current turn files
                let new_filtered_assets =
                    process_current_turn_files(&metrics_this_turn, &dashboards_this_turn)?;
                // Return context dashboard first, then the processed new assets
                Ok(vec![context_dashboard_info]
                    .into_iter()
                    .chain(new_filtered_assets.into_iter())
                    .collect())
            } else {
                // No context metric modified, or context parsing failed. Process current turn only.
                tracing::debug!("No context metric modified (or context parse failed). Processing current turn files only.");
                process_current_turn_files(&metrics_this_turn, &dashboards_this_turn)
            }
        }
        // --- No Context ---
        None => {
            // Case 1 (No context): Process current turn's files normally.
            tracing::debug!("No context dashboard ID found. Processing current turn files only.");
            process_current_turn_files(&metrics_this_turn, &dashboards_this_turn)
        }
    }
}

// Helper for the previous filtering logic (refactored, kept synchronous as it doesn't do IO)
fn process_current_turn_files(
    metrics: &[CompletedFileInfo],
    dashboards: &[CompletedFileInfo],
) -> Result<Vec<CompletedFileInfo>> {
    // Return Result for consistency
    let contains_metrics = !metrics.is_empty();
    let contains_dashboards = !dashboards.is_empty();

    if contains_metrics && contains_dashboards {
        // Parse dashboards, find referenced metrics, filter unreferenced, combine
        let mut metric_uuids = HashSet::new();
        for metric in metrics {
            if let Ok(uuid) = Uuid::parse_str(&metric.id) {
                metric_uuids.insert(uuid);
            }
        }

        let mut referenced_metric_uuids = HashSet::new();
        for dashboard_info in dashboards {
            match DashboardYml::new(dashboard_info.content.clone()) {
                Ok(dashboard_yml) => {
                    for row in dashboard_yml.rows {
                        for item in row.items {
                            referenced_metric_uuids.insert(item.id);
                        }
                    }
                }
                Err(e) => {
                    tracing::warn!(
                        "Failed to parse dashboard YML content for ID {} during current turn processing: {}. Skipping for metric reference check.",
                        dashboard_info.id,
                        e
                    );
                }
            }
        }

        let unreferenced_metric_uuids: HashSet<_> = metric_uuids
            .difference(&referenced_metric_uuids)
            .copied()
            .collect();

        if unreferenced_metric_uuids.is_empty() {
            // All metrics referenced, return only dashboards
            Ok(dashboards.to_vec())
        } else {
            let unreferenced_metrics: Vec<_> = metrics
                .iter()
                .filter(|m| {
                    Uuid::parse_str(&m.id)
                        .map_or(false, |uuid| unreferenced_metric_uuids.contains(&uuid))
                })
                .cloned()
                .collect();

            // Return unreferenced metrics first, then dashboards
            let mut combined = unreferenced_metrics;
            combined.extend(dashboards.iter().cloned());
            Ok(combined)
        }
    } else if contains_dashboards {
        // Only dashboards
        Ok(dashboards.to_vec())
    } else if contains_metrics {
        // Only metrics
        Ok(metrics.to_vec())
    } else {
        // Neither
        Ok(vec![])
    }
}

// Helper function to generate response message JSON values
fn generate_file_response_values(filtered_files: &[CompletedFileInfo]) -> Vec<Value> {
    let mut file_response_values = Vec::new();
    for file_info in filtered_files {
        let response_message = BusterChatMessage::File {
            id: file_info.id.clone(),
            file_type: file_info.file_type.clone(),
            file_name: file_info.file_name.clone(),
            version_number: file_info.version_number,
            filter_version_id: None,
            metadata: Some(vec![BusterChatResponseFileMetadata {
                status: "completed".to_string(),
                message: "Generated by Buster".to_string(),
                timestamp: Some(Utc::now().timestamp()),
            }]),
        };
        if let Ok(value) = serde_json::to_value(&response_message) {
            file_response_values.push(value);
        }
    }
    file_response_values
}
