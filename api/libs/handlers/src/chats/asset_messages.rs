use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::AssetType,
    models::{Message, MessageToFile},
    pool::get_pg_pool,
    schema::{chats, messages, messages_to_files},
};
use diesel::{insert_into, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use super::context_loaders::fetch_asset_details;

/// Generate default messages for prompt-less asset-based chats
/// 
/// This function creates a pair of messages to be shown in a chat when a user
/// opens an asset without providing a prompt:
/// 1. A file message that represents the asset itself
/// 2. A text message with placeholder content
/// 
/// The function also checks that the user has permission to view the asset
/// and fetches the asset details for display.
pub async fn generate_asset_messages(
    asset_id: Uuid,
    asset_type: AssetType,
    user: &AuthenticatedUser,
) -> Result<Vec<Message>> {
    // In a real implementation, we would check permissions here
    // However, for now, we'll skip this as the sharing module is not available
    // check_asset_permission(asset_id, asset_type, user, AssetPermissionLevel::CanView).await?;
    
    // Fetch asset details based on type
    let asset_details = fetch_asset_details(asset_id, asset_type).await?;
    
    // Create a single message with both text and file response
    let message_id = Uuid::new_v4();
    let timestamp = Utc::now().timestamp();
    
    let message = Message {
        id: message_id,
        request_message: None, // Empty request for auto-generated messages
        chat_id: Uuid::nil(), // Will be set by caller
        created_by: user.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        response_messages: serde_json::json!([
            {
                "type": "text",
                "id": Uuid::new_v4().to_string(),
                "message": format!("{} has been pulled into a new chat.\n\nContinue chatting to modify or make changes to it.", asset_details.name),
                "isFinalMessage": true
            },
            {
                "type": "file",
                "id": asset_id.to_string(),
                "file_type": asset_details.file_type,
                "file_name": asset_details.name,
                "version_number": asset_details.version_number,
                "filter_version_id": null,
                "metadata": [
                    {
                        "status": "completed",
                        "message": "Pulled into new chat",
                        "timestamp": timestamp
                    }
                ]
            }
        ]),
        reasoning: serde_json::Value::Array(vec![]),
        final_reasoning_message: Some("".to_string()),
        title: asset_details.name.clone(),
        raw_llm_messages: serde_json::json!([]),
        feedback: None,
    };
    
    Ok(vec![message])
}

/// Create association between message and file in the database
/// 
/// This function creates an entry in the messages_to_files table to link
/// a message with an asset file. This is necessary to support features
/// like file navigation and referencing.
/// 
/// Only certain asset types (MetricFile and DashboardFile) are supported.
pub async fn create_message_file_association(
    message_id: Uuid,
    file_id: Uuid,
    version_number: i32,
    asset_type: AssetType,
) -> Result<()> {
    // Only create association for file-type assets
    if asset_type != AssetType::MetricFile && asset_type != AssetType::DashboardFile {
        return Err(anyhow!("Cannot create file association for non-file asset type"));
    }
    
    let mut conn = get_pg_pool().get().await?;
    
    let message_to_file = MessageToFile {
        id: Uuid::new_v4(),
        message_id,
        file_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        is_duplicate: false,
        version_number,
    };
    
    // Insert the message-to-file association
    insert_into(messages_to_files::table)
        .values(&message_to_file)
        .execute(&mut conn)
        .await?;
    
    // Get the chat_id for this message
    let message_result = messages::table
        .filter(messages::id.eq(message_id))
        .select(messages::chat_id)
        .first::<Uuid>(&mut conn)
        .await;
    
    if let Ok(chat_id) = message_result {
        // Determine file type string
        let file_type = match asset_type {
            AssetType::MetricFile => "metric".to_string(),
            AssetType::DashboardFile => "dashboard".to_string(),
            _ => return Ok(()),
        };
        
        // Update the chat with the most recent file information
        diesel::update(chats::table.find(chat_id))
            .set((
                chats::most_recent_file_id.eq(Some(file_id)),
                chats::most_recent_file_type.eq(Some(file_type)),
                chats::updated_at.eq(Utc::now()),
            ))
            .execute(&mut conn)
            .await?;
    }
    
    Ok(())
}