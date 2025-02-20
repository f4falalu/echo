use std::sync::Arc;

use crate::{database_dep::models::User, routes::ws::ws::SubscriptionRwLock};
use anyhow::Result;
use chrono::Utc;
use diesel::{insert_into, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::messages::types::{ThreadMessage, ThreadUserMessage};
use handlers::threads::types::ThreadWithMessages;
use serde_json::Value;
use uuid::Uuid;

use super::agent_thread::{AgentThreadHandler, ChatCreateNewChat};

use crate::{
    database_dep::{
        enums::Verification,
        lib::get_pg_pool,
        models::{DashboardFile, Message, MessageToFile, MetricFile, Thread},
        schema::{dashboard_files, messages, messages_to_files, metric_files, threads},
    },
    routes::ws::{
        threads_and_messages::{
            post_thread::agent_message_transformer::{BusterContainer, ReasoningMessage},
            threads_router::{ThreadEvent, ThreadRoute},
        },
        ws::{WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::send_ws_message,
    },
    utils::agent::manager_agent::{ManagerAgent, ManagerAgentInput},
};

/// This creates a new thread for a user.  It follows these steps:
///
/// 1. Subscribes the user to a thread channel
/// 2. Creates an empty thread object and returns to the user
/// 3. Saves the thread object and ownership to the database
/// 4. Sends the user progress messages. This consists of streams and such.
/// 5. Go along saving progress to ultimately write to the database

/// Creates a new thread for a user and processes their request
pub async fn post_thread(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &User,
    request: ChatCreateNewChat,
) -> Result<()> {
    let chat_id = request.chat_id.unwrap_or_else(|| Uuid::new_v4());
    let message_id = request.message_id.unwrap_or_else(|| Uuid::new_v4());

    let user_org_id = match user.attributes.get("organization_id") {
        Some(Value::String(org_id)) => Uuid::parse_str(&org_id).unwrap_or_default(),
        _ => {
            tracing::error!("User has no organization ID");
            return Err(anyhow::anyhow!("User has no organization ID"));
        }
    };

    // Create and store thread
    let thread = create_thread(&chat_id, &request.prompt, &user_org_id, &user.id)?;
    let init_response = create_initial_response(&thread, &message_id, &request.prompt, user)?;

    // Send initial response to client
    send_initial_response(&user.id.to_string(), &init_response).await?;

    // Store thread in database
    let mut conn = get_pg_pool().get().await?;
    store_thread(&mut conn, &thread).await?;

    // Process request using manager agent
    let agent = ManagerAgent::new(user.id.clone(), chat_id)?;
    let input = ManagerAgentInput {
        prompt: request.prompt.clone(),
        thread_id: Some(chat_id),
        message_id: Some(message_id),
    };

    let output = agent.process_request(input, user.id.clone()).await?;

    // Store message and process files
    store_message_and_files(
        &mut conn,
        message_id,
        chat_id,
        request.prompt,
        &output.messages,
        &user_org_id,
        &user.id,
    )
    .await?;

    Ok(())
}

/// Creates a new thread object
fn create_thread(
    chat_id: &Uuid,
    prompt: &str,
    org_id: &Uuid,
    user_id: &Uuid,
) -> Result<Thread> {
    Ok(Thread {
        id: chat_id.clone(),
        title: prompt.to_string(),
        organization_id: org_id.clone(),
        created_by: user_id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    })
}

/// Creates the initial response object
fn create_initial_response(
    thread: &Thread,
    message_id: &Uuid,
    prompt: &str,
    user: &User,
) -> Result<ThreadWithMessages> {
    Ok(ThreadWithMessages {
        id: thread.id,
        title: thread.title.clone(),
        is_favorited: false,
        messages: vec![ThreadMessage {
            id: message_id.clone(),
            request_message: ThreadUserMessage {
                request: prompt.to_string(),
                sender_id: user.id,
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
    })
}

/// Sends the initial response to the client
async fn send_initial_response(subscription: &str, init_response: &ThreadWithMessages) -> Result<()> {
    let response = WsResponseMessage::new_no_user(
        WsRoutes::Threads(ThreadRoute::Post),
        WsEvent::Threads(ThreadEvent::InitializeChat),
        init_response.clone(),
        None,
        WsSendMethod::All,
    );

    if let Err(e) = send_ws_message(subscription, &response).await {
        tracing::error!("Failed to send websocket message: {}", e);
    }
    Ok(())
}

/// Stores the thread in the database
async fn store_thread(conn: &mut diesel_async::AsyncPgConnection, thread: &Thread) -> Result<()> {
    insert_into(threads::table)
        .values(thread)
        .execute(conn)
        .await?;
    Ok(())
}

/// Stores the message and processes any files
async fn store_message_and_files(
    conn: &mut diesel_async::AsyncPgConnection,
    message_id: Uuid,
    thread_id: Uuid,
    request: String,
    messages: &[BusterContainer],
    org_id: &Uuid,
    user_id: &Uuid,
) -> Result<()> {
    // Create and store message
    let message = Message {
        id: message_id,
        request,
        response: serde_json::to_value(messages)?,
        thread_id,
        created_by: user_id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    insert_into(messages::table)
        .values(&message)
        .execute(conn)
        .await?;

    // Process any completed files
    for container in messages {
        match container {
            BusterContainer::ReasoningMessage(msg) => match &msg.reasoning {
                ReasoningMessage::File(file) if file.file_type == "metric" => {
                    store_metric_file(conn, &message, file, org_id, user_id).await?;
                }
                ReasoningMessage::File(file) if file.file_type == "dashboard" => {
                    store_dashboard_file(conn, &message, file, org_id, user_id).await?;
                }
                _ => (),
            },
            _ => (),
        }
    }

    Ok(())
}

/// Stores a metric file and creates the message link
async fn store_metric_file(
    conn: &mut diesel_async::AsyncPgConnection,
    message: &Message,
    file: &BusterFileMessage,
    org_id: &Uuid,
    user_id: &Uuid,
) -> Result<()> {
    let metric_file = MetricFile {
        id: Uuid::new_v4(),
        name: file.file_name.clone(),
        file_name: format!("{}.yml", file.file_name.to_lowercase().replace(' ', "_")),
        content: serde_json::to_value(&file.file.clone().unwrap_or_default())?,
        verification: Verification::NotRequested,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: org_id.clone(),
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

    Ok(())
}

/// Stores a dashboard file and creates the message link
async fn store_dashboard_file(
    conn: &mut diesel_async::AsyncPgConnection,
    message: &Message,
    file: &BusterFileMessage,
    org_id: &Uuid,
    user_id: &Uuid,
) -> Result<()> {
    let dashboard_file = DashboardFile {
        id: Uuid::new_v4(),
        name: file.file_name.clone(),
        file_name: format!("{}.yml", file.file_name.to_lowercase().replace(' ', "_")),
        content: serde_json::to_value(&file.file.clone().unwrap_or_default())?,
        filter: None,
        organization_id: org_id.clone(),
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

    Ok(())
}
