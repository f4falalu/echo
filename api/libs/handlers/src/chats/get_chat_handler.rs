use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::prelude::Queryable;
use diesel::{ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde_json::Value;
use tokio;
use uuid::Uuid;

use crate::chats::types::{BusterShareIndividual, ChatWithMessages};
use crate::messages::types::{ChatMessage, ChatUserMessage};
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, chats, messages, users};

#[derive(Queryable)]
pub struct ChatWithUser {
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

#[derive(Queryable)]
struct AssetPermissionInfo {
    identity_id: Uuid,
    role: AssetPermissionRole,
    email: String,
    name: Option<String>,
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
                .first::<ChatWithUser>(&mut conn)
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
                .order_by(messages::created_at.asc())
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

    // Run permission query concurrently as well
    let permissions_future = {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
        };

        let chat_id = chat_id.clone();
        
        tokio::spawn(async move {
            // Query individual permissions for this chat
            let permissions = asset_permissions::table
                .inner_join(users::table.on(users::id.eq(asset_permissions::identity_id)))
                .filter(asset_permissions::asset_id.eq(chat_id))
                .filter(asset_permissions::asset_type.eq(AssetType::Chat))
                .filter(asset_permissions::identity_type.eq(IdentityType::User))
                .filter(asset_permissions::deleted_at.is_null())
                .select((
                    asset_permissions::identity_id,
                    asset_permissions::role,
                    users::email,
                    users::name,
                ))
                .load::<AssetPermissionInfo>(&mut conn)
                .await;
                
            // Query publicly_accessible and related fields
            let public_info = chats::table
                .filter(chats::id.eq(chat_id))
                .select((
                    chats::publicly_accessible,
                    chats::publicly_enabled_by,
                    chats::public_expiry_date,
                ))
                .first::<(bool, Option<Uuid>, Option<DateTime<Utc>>)>(&mut conn)
                .await;
                
            // Return both results
            (permissions, public_info)
        })
    };

    // Wait for all queries and handle errors
    let (thread, messages, permissions_and_public_info) = tokio::try_join!(
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
        },
        async move {
            permissions_future
                .await
                .map_err(|e| anyhow!("Permissions task failed: {}", e))
        }
    )?;

    // Unpack the permissions and public info results
    let (permissions_result, public_info_result) = permissions_and_public_info;

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
                msg.created_at,
            )
        })
        .collect();

    // Get avatar from creator attributes
    let created_by_avatar = thread
        .user_attributes
        .get("avatar")
        .and_then(|v| v.as_str())
        .map(String::from);

    // Process permissions data
    let individual_permissions = match permissions_result {
        Ok(permissions) => {
            if permissions.is_empty() {
                None
            } else {
                Some(
                    permissions
                        .into_iter()
                        .map(|p| BusterShareIndividual {
                            email: p.email,
                            role: p.role,
                            name: p.name,
                        })
                        .collect::<Vec<BusterShareIndividual>>(),
                )
            }
        }
        Err(_) => None,
    };

    // Get public access info
    let (publicly_accessible, publicly_enabled_by, public_expiry_date) = match public_info_result {
        Ok((accessible, enabled_by_id, expiry)) => {
            // Get the user info for publicly_enabled_by if it exists
            let enabled_by_email = if let Some(enabled_by_id) = enabled_by_id {
                let mut conn = match get_pg_pool().get().await {
                    Ok(conn) => conn,
                    Err(_) => return Err(anyhow!("Failed to get database connection")),
                };
                
                users::table
                    .filter(users::id.eq(enabled_by_id))
                    .select(users::email)
                    .first::<String>(&mut conn)
                    .await
                    .ok()
            } else {
                None
            };
            
            (accessible, enabled_by_email, expiry)
        }
        Err(_) => (false, None, None),
    };

    // Construct and return the ChatWithMessages with permissions
    let chat = ChatWithMessages::new_with_messages(
        thread.id,
        thread.title,
        thread_messages,
        false, // is_favorited not implemented in current schema
        thread.user_id.to_string(),
        thread.user_name.unwrap_or_else(|| "Unknown".to_string()),
        created_by_avatar,
    );
    
    // Add permissions
    Ok(chat.with_permissions(
        individual_permissions,
        publicly_accessible,
        public_expiry_date,
        publicly_enabled_by
    ))
}
