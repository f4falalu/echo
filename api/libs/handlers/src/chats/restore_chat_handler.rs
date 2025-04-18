use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::AssetType,
    models::{Message, MessageToFile},
    pool::get_pg_pool,
    schema::{chats, messages, messages_to_files},
};
use diesel::{insert_into, update, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::chats::get_chat_handler::get_chat_handler;
use crate::chats::types::ChatWithMessages;
// Import public handler types directly
use crate::dashboards::{update_dashboard_handler, DashboardUpdateRequest};
use crate::metrics::{update_metric_handler, UpdateMetricRequest};

/// Request structure for restoring an asset (metric or dashboard) version in a chat
#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRestoreRequest {
    /// ID of the asset to restore
    pub asset_id: Uuid,
    /// Type of asset to restore (metric_file or dashboard_file)
    pub asset_type: AssetType,
    /// Version number to restore
    pub version_number: i32,
}

/// Handler for restoring a previous version of an asset (metric or dashboard) and documenting it in a chat
///
/// # Arguments
/// * `chat_id` - The UUID of the chat where the restoration will be documented
/// * `user` - The authenticated user making the request
/// * `request` - The restoration request with asset_id, asset_type, and version_number
///
/// # Returns
/// * `Result<ChatWithMessages>` - The updated chat with new messages documenting the restoration
///
/// # Process
/// 1. Restores the specified asset version using the appropriate handler
/// 2. Creates a text message in the chat documenting the restoration
/// 3. Creates a file message linking to the restored asset
/// 4. Updates the chat record with the latest file info
/// 5. Returns the updated chat with all messages
pub async fn restore_chat_handler(
    chat_id: &Uuid,
    user: &AuthenticatedUser,
    request: ChatRestoreRequest,
) -> Result<ChatWithMessages> {
    let mut conn = get_pg_pool().get().await?;

    // Step 1: Restore the asset using the appropriate handler
    let (file_type, file_name, file_id, version_number) = match request.asset_type {
        AssetType::MetricFile => {
            // Create a metric update request with only the restore_to_version parameter
            let metric_request = UpdateMetricRequest {
                restore_to_version: Some(request.version_number),
                ..Default::default()
            };

            // Call the metric update handler through the public module function
            let updated_metric =
                update_metric_handler(&request.asset_id, user, metric_request).await?;

            // Return the file information
            (
                "metric".to_string(),
                updated_metric.name,
                updated_metric.id,
                updated_metric.versions.len() as i32, // Get version number from versions length
            )
        }
        AssetType::DashboardFile => {
            // Create a dashboard update request with only the restore_to_version parameter
            let dashboard_request = DashboardUpdateRequest {
                restore_to_version: Some(request.version_number),
                ..Default::default()
            };

            // Call the dashboard update handler through the public module function
            let updated_dashboard =
                update_dashboard_handler(request.asset_id, dashboard_request, user).await?;

            // Return the file information
            (
                "dashboard".to_string(),
                updated_dashboard.dashboard.name,
                updated_dashboard.dashboard.id,
                updated_dashboard.dashboard.version_number,
            )
        }
        _ => {
            return Err(anyhow!(
                "Unsupported asset type for restoration: {:?}",
                request.asset_type
            ))
        }
    };

    // Step 2: Get the most recent message to copy raw_llm_messages
    // Fetch the most recent message for the chat to extract raw_llm_messages
    let last_message = messages::table
        .filter(messages::chat_id.eq(chat_id))
        .filter(messages::deleted_at.is_null())
        .limit(1)
        // We need to use order here to get the latest message
        .then_order_by(messages::created_at.desc())
        .first::<Message>(&mut conn)
        .await
        .ok();

    // Create raw_llm_messages by copying from the previous message and adding restoration entries
    let tool_call_id = format!("call_{}", Uuid::new_v4().to_string().replace("-", ""));

    // Start with copied raw_llm_messages or an empty array
    let mut raw_llm_messages = if let Some(last_msg) = &last_message {
        if let Ok(msgs) = serde_json::from_value::<Vec<Value>>(last_msg.raw_llm_messages.clone()) {
            msgs
        } else {
            Vec::new()
        }
    } else {
        Vec::new()
    };

    // Add tool call message and tool response message
    raw_llm_messages.push(json!({
        "name": "buster_super_agent",
        "role": "assistant",
        "tool_calls": [
          {
            "id": tool_call_id,
            "type": "function",
            "function": {
              "name": format!("restore_{}", file_type),
              "arguments": json!({
                "version_number": request.version_number
              }).to_string()
            }
          }
        ]
    }));

    // Add the tool response
    raw_llm_messages.push(json!({
        "name": format!("restore_{}", file_type),
        "role": "tool",
        "content": json!({
            "message": format!("Successfully restored 1 {} files.", file_type),
            "file_contents": file_name
        }).to_string(),
        "tool_call_id": tool_call_id
    }));

    // Step 3: Create a message with text and file responses

    let message_id = Uuid::new_v4();
    let now = Utc::now();
    let timestamp = now.timestamp();

    // Create response messages array with both text and file response
    let response_messages = json!([
        {
            "id": file_id.to_string(),
            "type": "file",
            "metadata": [
                {
                    "status": "completed",
                    "message": format!("Restored from version {}", request.version_number),
                    "timestamp": timestamp
                }
            ],
            "file_name": file_name,
            "file_type": file_type,
            "version_number": version_number,
            "filter_version_id": null
        }
    ]);

    // Create a Message object to insert
    let message = Message {
        id: message_id,
        request_message: None, // Empty request message as per requirement
        response_messages: response_messages,
        reasoning: json!([]),
        title: "Version Restoration".to_string(),
        raw_llm_messages: Value::Array(raw_llm_messages.clone()),
        final_reasoning_message: Some(format!(
            "v{} was created by restoring v{}",
            version_number, request.version_number
        )),
        chat_id: *chat_id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        feedback: None,
    };

    // Insert the message
    diesel::insert_into(messages::table)
        .values(&message)
        .execute(&mut conn)
        .await?;

    // Create the message-to-file association
    let message_to_file = MessageToFile {
        id: Uuid::new_v4(),
        message_id: message_id,
        file_id: file_id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        is_duplicate: false,
        version_number: version_number,
    };

    // Insert the message-to-file association into the database
    diesel::insert_into(messages_to_files::table)
        .values(&message_to_file)
        .execute(&mut conn)
        .await?;

    // Step 4: Update the chat record with the latest file info
    update(chats::table)
        .filter(chats::id.eq(chat_id))
        .set((
            chats::most_recent_file_id.eq(Some(file_id)),
            chats::most_recent_version_number.eq(Some(version_number)),
            chats::most_recent_file_type.eq(Some(request.asset_type.to_string())),
            chats::updated_at.eq(now),
        ))
        .execute(&mut conn)
        .await?;

    // Return the updated chat with messages
    get_chat_handler(chat_id, user, false).await
}
