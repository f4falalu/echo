use anyhow::{anyhow, Result};
use axum::http::StatusCode;
use axum::Extension;
use axum::{response::IntoResponse, Json};
use chrono::Utc;
use diesel::{insert_into, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::messages::types::{ThreadMessage, ThreadUserMessage};
use handlers::threads::types::ThreadWithMessages;
use litellm::Message as AgentMessage;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use crate::utils::agent::AgentThread;
use crate::{
    database_dep::{
        enums::Verification,
        lib::get_pg_pool,
        models::{DashboardFile, Message, MessageToFile, MetricFile, Thread, User},
        schema::{dashboard_files, messages, messages_to_files, metric_files, threads},
    },
    utils::agent::manager_agent::{ManagerAgent, ManagerAgentInput},
};

use super::agent_message_transformer::{transform_message, BusterContainer, ReasoningMessage};

#[derive(Debug, Deserialize, Clone)]
pub struct ChatCreateNewChat {
    pub prompt: String,
    pub chat_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
}

async fn process_chat(request: ChatCreateNewChat, user: User) -> Result<ThreadWithMessages> {
    let chat_id = request.chat_id.unwrap_or_else(|| Uuid::new_v4());
    let message_id = request.message_id.unwrap_or_else(|| Uuid::new_v4());

    let user_org_id = match user.attributes.get("organization_id") {
        Some(Value::String(org_id)) => Uuid::parse_str(&org_id).unwrap_or_default(),
        _ => {
            tracing::error!("User has no organization ID");
            return Err(anyhow!("User has no organization ID"));
        }
    };

    // Create thread
    let thread = Thread {
        id: chat_id,
        title: request.prompt.clone(),
        organization_id: user_org_id,
        created_by: user.id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    let mut thread_with_messages = ThreadWithMessages {
        id: chat_id,
        title: request.prompt.clone(),
        is_favorited: false,
        messages: vec![ThreadMessage {
            id: message_id,
            request_message: ThreadUserMessage {
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

    // Create thread in database
    let mut conn = get_pg_pool().get().await?;
    insert_into(threads::table)
        .values(&thread)
        .execute(&mut conn)
        .await?;

    // Initialize agent and process request
    let agent = ManagerAgent::new(user.id, chat_id).await?;
    let mut thread = AgentThread::new(
        Some(chat_id),
        user.id,
        vec![AgentMessage::user(request.prompt.clone())],
    );

    // Get the receiver and collect all messages
    let mut rx = agent.run(&mut thread).await?;
    let mut messages = Vec::new();
    let mut final_message = None;

    // Process messages from the agent
    while let Ok(message) = rx.recv().await {
        match message {
            Ok(msg) => {
                match msg {
                    AgentMessage::Assistant {
                        name: Some(name),
                        content: Some(content),
                        tool_calls: None,
                        ..
                    } => {
                        if name == "manager_agent" {
                            // Store the final message and break immediately
                            final_message = Some(content);
                            break;
                        }
                    }
                    _ => messages.push(msg),
                }
            }
            Err(e) => return Err(e.into()),
        }
    }

    // Create and store initial message
    let message = Message {
        id: message_id,
        request: request.prompt,
        response: serde_json::to_value(&messages)?,
        thread_id: chat_id,
        created_by: user.id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    // Insert message and process files
    insert_into(messages::table)
        .values(&message)
        .execute(&mut conn)
        .await?;

    // Store final message state and process any completed files
    store_final_message_state(&mut conn, &message, &messages, &user_org_id, &user.id).await?;

    // Update thread_with_messages with processed messages
    if let Some(thread_message) = thread_with_messages.messages.first_mut() {
        let transformed_messages: Vec<BusterContainer> = messages
            .iter()
            .filter_map(|msg| {
                transform_message(&chat_id, &message_id, msg.clone())
                    .ok()
                    .map(|(containers, _)| containers)
            })
            .flatten()
            .collect();

        let (response_messages, reasoning_messages): (Vec<_>, Vec<_>) = transformed_messages
            .iter()
            .filter_map(|msg| match msg {
                BusterContainer::ChatMessage(chat) => chat
                    .response_message
                    .message
                    .as_ref()
                    .map(|m| (Some(m), None)),
                BusterContainer::ReasoningMessage(reasoning) => match &reasoning.reasoning {
                    ReasoningMessage::Thought(thought) => Some((
                        None,
                        Some(serde_json::to_value(thought).unwrap_or_default()),
                    )),
                    ReasoningMessage::File(file) => {
                        Some((None, Some(serde_json::to_value(file).unwrap_or_default())))
                    }
                },
            })
            .unzip();

        // Add the final message if it exists
        let mut final_response_messages = response_messages
            .into_iter()
            .flatten()
            .map(|m| serde_json::to_value(m).unwrap_or_default())
            .collect::<Vec<_>>();

        if let Some(final_msg) = final_message {
            final_response_messages.push(serde_json::to_value(final_msg).unwrap_or_default());
        }

        thread_message.response_messages = final_response_messages;
        thread_message.reasoning = reasoning_messages
            .into_iter()
            .flatten()
            .map(|m| serde_json::to_value(m).unwrap_or_default())
            .collect();
    }

    Ok(thread_with_messages)
}

pub async fn create_chat(
    Extension(user): Extension<User>,
    Json(request): Json<ChatCreateNewChat>,
) -> Result<ApiResponse<ThreadWithMessages>, (StatusCode, &'static str)> {
    match process_chat(request, user).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error processing chat: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to process chat"))
        }
    }
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
            transform_message(&message.thread_id, &message.id, msg.clone())
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
