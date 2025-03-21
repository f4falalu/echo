use anyhow::Result;
use chrono::Utc;
use database::models::Chat;
use database::pool::get_pg_pool;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatDeleteResult {
    pub id: Uuid,
    pub success: bool,
    pub error: Option<String>,
}

/// Bulk delete chats (soft delete by setting deleted_at)
/// 
/// This function efficiently soft deletes multiple chats using a bulk update operation.
/// It validates that the user has permission to delete each chat (they must be the creator).
/// 
/// Returns a list of results indicating success or failure for each chat.
pub async fn delete_chats_handler(
    chat_ids: Vec<Uuid>,
    user_id: &Uuid,
) -> Result<Vec<ChatDeleteResult>> {
    use database::schema::chats;
    
    // If no chat IDs provided, return empty result
    if chat_ids.is_empty() {
        return Ok(Vec::new());
    }
    
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    // Find all chats that the user has permission to delete in one query
    let user_chats: Vec<Chat> = chats::table
        .filter(chats::id.eq_any(chat_ids.clone()))
        .filter(chats::created_by.eq(user_id))
        .filter(chats::deleted_at.is_null())
        .load::<Chat>(&mut conn)
        .await?;
    
    // Create a set of authorized chat IDs for quick lookup
    let authorized_chat_ids: HashSet<Uuid> = 
        user_chats.iter().map(|c| c.id).collect();
    
    // Prepare results for unauthorized chats
    let mut delete_results: Vec<ChatDeleteResult> = chat_ids
        .iter()
        .filter(|id| !authorized_chat_ids.contains(id))
        .map(|id| ChatDeleteResult {
            id: *id,
            success: false,
            error: Some("Chat not found or you don't have permission to delete it".to_string()),
        })
        .collect();
    
    // If we have authorized deletes, perform them in bulk
    if !authorized_chat_ids.is_empty() {
        let authorized_ids: Vec<Uuid> = authorized_chat_ids.into_iter().collect();
        
        // Perform a bulk update for all authorized chats at once
        let result = diesel::update(chats::table)
            .filter(chats::id.eq_any(authorized_ids.clone()))
            .set((
                chats::deleted_at.eq(Some(Utc::now())),
                chats::updated_at.eq(Utc::now()),
            ))
            .execute(&mut conn)
            .await;
            
        match result {
            Ok(_) => {
                // Add success results for all authorized chats
                let success_results: Vec<ChatDeleteResult> = authorized_ids
                    .into_iter()
                    .map(|id| ChatDeleteResult {
                        id,
                        success: true,
                        error: None,
                    })
                    .collect();
                
                delete_results.extend(success_results);
            },
            Err(e) => {
                // Add error results for all authorized chats
                let error_results: Vec<ChatDeleteResult> = authorized_ids
                    .into_iter()
                    .map(|id| ChatDeleteResult {
                        id,
                        success: false,
                        error: Some(format!("Failed to delete chat: {}", e)),
                    })
                    .collect();
                
                delete_results.extend(error_results);
            }
        }
    }
    
    Ok(delete_results)
} 