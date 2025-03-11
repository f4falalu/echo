use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::prelude::Queryable;
use diesel::{ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde_json::Value;
use tokio;
use uuid::Uuid;

use crate::chats::types::ChatWithMessages;
use crate::messages::types::{ChatMessage, ChatUserMessage};
use database::pool::get_pg_pool;
use database::schema::{chats, messages, users};

#[derive(Queryable)]
pub struct ThreadWithUser {
    pub id: Uuid,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_id: Uuid,
    pub user_name: Option<String>,
    pub user_email: String,
    pub user_attributes: Value,
}

#[derive(Queryable)]
pub struct MessageWithUser {
    pub id: Uuid,
    pub request_message: String,
    pub response_messages: Value,
    pub reasoning: Value,
    pub final_reasoning_message: String,
    pub created_at: DateTime<Utc>,
    pub user_id: Uuid,
    pub user_name: Option<String>,
    pub user_attributes: Value,
}

pub async fn get_chat_handler(chat_id: &Uuid, user_id: &Uuid) -> Result<ChatWithMessages> {
    // Run thread and messages queries concurrently
    let thread_future = {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
        };

        let chat_id = chat_id.clone();
        let user_id = user_id.clone();

        tokio::spawn(async move {
            chats::table
                .inner_join(users::table.on(chats::created_by.eq(users::id)))
                .filter(chats::id.eq(chat_id))
                .filter(chats::created_by.eq(user_id))
                .filter(chats::deleted_at.is_null())
                .select((
                    chats::id,
                    chats::title,
                    chats::created_at,
                    chats::updated_at,
                    users::id,
                    users::name.nullable(),
                    users::email,
                    users::attributes,
                ))
                .first::<ThreadWithUser>(&mut conn)
                .await
        })
    };

    let messages_future = {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
        };

        let chat_id = chat_id.clone();

        tokio::spawn(async move {
            messages::table
                .inner_join(users::table.on(messages::created_by.eq(users::id)))
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .order_by(messages::created_at.desc())
                .select((
                    messages::id,
                    messages::request_message,
                    messages::response_messages,
                    messages::reasoning,
                    messages::final_reasoning_message,
                    messages::created_at,
                    users::id,
                    users::name.nullable(),
                    users::attributes,
                ))
                .load::<MessageWithUser>(&mut conn)
                .await
        })
    };

    // Wait for both queries and handle errors
    let (thread, messages) = tokio::try_join!(
        async move {
            thread_future
                .await
                .map_err(|e| anyhow!("Thread task failed: {}", e))?
                .map_err(|e| match e {
                    diesel::result::Error::NotFound => anyhow!("Thread not found or unauthorized"),
                    _ => anyhow!("Database error: {}", e),
                })
        },
        async move {
            messages_future
                .await
                .map_err(|e| anyhow!("Messages task failed: {}", e))?
                .map_err(|e| anyhow!("Failed to load messages: {}", e))
        }
    )?;

    // Transform messages into ThreadMessage format
    let thread_messages: Vec<ChatMessage> = messages
        .into_iter()
        .map(|msg| {
            let sender_avatar = msg
                .user_attributes
                .get("avatar")
                .and_then(|v| v.as_str())
                .map(String::from);

            // Convert response_messages and reasoning to Vec<Value>
            let response_messages = msg
                .response_messages
                .as_array()
                .map(|arr| arr.to_vec())
                .unwrap_or_default();

            let reasoning = msg
                .reasoning
                .as_array()
                .map(|arr| arr.to_vec())
                .unwrap_or_default();

            let request_message = ChatUserMessage {
                request: msg.request_message,
                sender_id: msg.user_id,
                sender_name: msg.user_name.unwrap_or_else(|| "Unknown".to_string()),
                sender_avatar,
            };

            ChatMessage::new_with_messages(
                msg.id,
                request_message,
                response_messages,
                reasoning,
                Some(msg.final_reasoning_message),
            )
        })
        .collect();

    // Get avatar from creator attributes
    let created_by_avatar = thread
        .user_attributes
        .get("avatar")
        .and_then(|v| v.as_str())
        .map(String::from);

    // Construct and return the ThreadWithMessages using new_with_messages
    Ok(ChatWithMessages::new_with_messages(
        thread.id,
        thread.title,
        thread_messages,
        false, // is_favorited not implemented in current schema
        thread.user_id.to_string(),
        thread.user_name.unwrap_or_else(|| "Unknown".to_string()),
        created_by_avatar,
    ))
}
