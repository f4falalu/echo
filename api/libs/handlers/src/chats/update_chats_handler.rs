use anyhow::{anyhow, Result};
use chrono::Utc;
use database::models::{Chat, User};
use database::pool::get_pg_pool;
use diesel::prelude::*;
use diesel::pg::expression::dsl::any;
use diesel_async::RunQueryDsl;
use futures::future::try_join_all;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatUpdate {
    pub id: Uuid,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatUpdateResult {
    pub id: Uuid,
    pub success: bool,
    pub error: Option<String>,
}

/// Bulk update chat titles
/// 
/// This function efficiently updates the titles of multiple chats.
/// It validates that the user has permission to update each chat (they must be the creator)
/// in a single database query, then performs individual updates for each chat.
/// 
/// Returns a list of results indicating success or failure for each chat.
pub async fn update_chats_handler(
    updates: Vec<ChatUpdate>,
    user_id: &Uuid,
) -> Result<Vec<ChatUpdateResult>> {
    use database::schema::chats;
    
    // If no updates provided, return empty result
    if updates.is_empty() {
        return Ok(Vec::new());
    }
    
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    // Extract all chat IDs
    let chat_ids: Vec<Uuid> = updates.iter().map(|u| u.id).collect();
    
    // Find all chats that the user has permission to update in one query
    let user_chats: Vec<Chat> = chats::table
        .filter(chats::id.eq_any(chat_ids.clone()))
        .filter(chats::created_by.eq(user_id))
        .filter(chats::deleted_at.is_null())
        .load::<Chat>(&mut conn)
        .await?;
    
    // Create a set of authorized chat IDs for quick lookup
    let authorized_chat_ids: HashSet<Uuid> = 
        user_chats.iter().map(|c| c.id).collect();
    
    let mut update_results = Vec::with_capacity(updates.len());
    
    // Process each update
    for update in updates {
        if authorized_chat_ids.contains(&update.id) {
            // Update the chat title
            let result = diesel::update(chats::table)
                .filter(chats::id.eq(update.id))
                .set((
                    chats::title.eq(update.title.clone()),
                    chats::updated_at.eq(Utc::now()),
                ))
                .execute(&mut conn)
                .await;
            
            match result {
                Ok(_) => update_results.push(ChatUpdateResult {
                    id: update.id,
                    success: true,
                    error: None,
                }),
                Err(e) => update_results.push(ChatUpdateResult {
                    id: update.id,
                    success: false,
                    error: Some(format!("Failed to update chat: {}", e)),
                }),
            }
        } else {
            update_results.push(ChatUpdateResult {
                id: update.id,
                success: false,
                error: Some("Chat not found or you don't have permission to update it".to_string()),
            });
        }
    }
    
    Ok(update_results)
} 