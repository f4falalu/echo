---
title: Chat Asset Restoration Implementation
author: Buster Engineering Team
date: 2025-03-25
status: Draft
parent_prd: restoration_project.md
---

# Chat Asset Restoration Implementation

## Overview
This document details the implementation of the chat restoration endpoint as part of the larger [Version Restoration Feature](restoration_project.md) project. This endpoint will allow users to restore previous versions of metrics and dashboards through the chat interface, creating appropriate chat messages to document the restoration.

## Technical Design

### New Chat Restoration Endpoint

A new REST endpoint will be created at `PUT /chats/{id}/restore` that:

1. Accepts a request with `asset_id`, `asset_type`, and `version_number`
2. Uses the same restoration logic as the metric and dashboard handlers
3. Creates appropriate chat messages documenting the restoration

### API Changes

#### Request Structure

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRestoreRequest {
    pub asset_id: Uuid,
    pub asset_type: AssetType,  // "metric" or "dashboard"
    pub version_number: i32,
}
```

#### Response Structure

```rust
// Will return the updated chat with messages
pub type ChatRestoreResponse = ChatWithMessages;
```

### Implementation Details

#### 1. Create the Handler

Create a new file `restore_chat_handler.rs` in the `api/libs/handlers/src/chats` directory with the following implementation:

```rust
use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType},
    models::{Message, MessageToFile},
    pool::get_pg_pool,
    schema::{messages, messages_to_files},
};
use diesel::{insert_into, ExpressionMethods};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::chats::types::ChatWithMessages;
use crate::chats::get_chat_handler::get_chat_handler;
use crate::dashboards::update_dashboard_handler::{update_dashboard_handler, DashboardUpdateRequest};
use crate::metrics::update_metric_handler::{update_metric_handler, UpdateMetricRequest};

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRestoreRequest {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub version_number: i32,
}

pub async fn restore_chat_handler(
    chat_id: &Uuid,
    user: &AuthenticatedUser,
    request: ChatRestoreRequest,
) -> Result<ChatWithMessages> {
    let mut conn = get_pg_pool().get().await?;
    
    // Step 1: Restore the asset using the appropriate handler
    let (file_type, file_name, version_id, version_number) = match request.asset_type {
        AssetType::Metric => {
            // Create a metric update request with only the restore_to_version parameter
            let metric_request = UpdateMetricRequest {
                restore_to_version: Some(request.version_number),
                ..Default::default()
            };
            
            // Call the metric update handler
            let updated_metric = update_metric_handler(&request.asset_id, user, metric_request).await?;
            
            // Return the file information
            (
                "metric".to_string(),
                updated_metric.name,
                updated_metric.id,
                updated_metric.version
            )
        },
        AssetType::Dashboard => {
            // Create a dashboard update request with only the restore_to_version parameter
            let dashboard_request = DashboardUpdateRequest {
                restore_to_version: Some(request.version_number),
                ..Default::default()
            };
            
            // Call the dashboard update handler
            let updated_dashboard = update_dashboard_handler(
                request.asset_id,
                dashboard_request,
                user
            ).await?;
            
            // Return the file information
            (
                "dashboard".to_string(),
                updated_dashboard.dashboard.name,
                updated_dashboard.dashboard.id,
                updated_dashboard.dashboard.version
            )
        },
        _ => return Err(anyhow!("Unsupported asset type for restoration: {:?}", request.asset_type)),
    };
    
    // Step 2: Create a text message in the chat about the restoration
    let restoration_message = format!(
        "Version {} was created by restoring version {}",
        version_number,
        request.version_number
    );
    
    let message_id = Uuid::new_v4();
    let now = Utc::now();
    
    // Insert the text message
    insert_into(messages::table)
        .values((
            messages::id.eq(message_id),
            messages::chat_id.eq(chat_id),
            messages::created_at.eq(now),
            messages::user_id.eq(user.id),
            messages::message_type.eq("text"),
            messages::message.eq(restoration_message),
            messages::is_final_message.eq(true),
        ))
        .execute(&mut conn)
        .await?;
    
    // Step 3: Create a file message referencing the restored file
    let file_message_id = Uuid::new_v4();
    
    // Insert the file message
    insert_into(messages::table)
        .values((
            messages::id.eq(file_message_id),
            messages::chat_id.eq(chat_id),
            messages::created_at.eq(now),
            messages::user_id.eq(user.id),
            messages::message_type.eq("file"),
            messages::file_name.eq(file_name),
            messages::file_type.eq(file_type),
            messages::version_id.eq(version_id),
            messages::version_number.eq(version_number),
            messages::is_final_message.eq(true),
        ))
        .execute(&mut conn)
        .await?;
    
    // Step 4: Create the message-to-file association
    insert_into(messages_to_files::table)
        .values((
            messages_to_files::message_id.eq(file_message_id),
            messages_to_files::file_id.eq(version_id),
            messages_to_files::file_type.eq(file_type),
        ))
        .execute(&mut conn)
        .await?;
    
    // Step 5: Return the updated chat with messages
    get_chat_handler(chat_id, user).await
}

## Testing

### Unit Tests

The following unit tests should be implemented to ensure the chat version restoration functionality works correctly:

#### Basic Functionality Tests
1. **Test Successful Restoration**: Verify that a specific version can be restored successfully
   - Create a chat with multiple versions
   - Restore an earlier version
   - Verify a new version is created with content matching the restored version
   - Verify the version number is incremented appropriately
   - Verify a restoration message is added to the chat

2. **Test Version Not Found**: Verify appropriate error handling when trying to restore a non-existent version
   - Attempt to restore a version number that doesn't exist
   - Verify an appropriate error is returned

#### Permission Tests
3. **Test Permission Check - Authorized**: Verify users with appropriate permissions can restore versions
   - Test with users having CanEdit, FullAccess, and Owner permissions
   - Verify restoration succeeds

4. **Test Permission Check - Unauthorized**: Verify users without appropriate permissions cannot restore versions
   - Test with users having ReadOnly or no permissions
   - Verify appropriate error is returned

#### Edge Cases
5. **Test Restoring Latest Version**: Verify behavior when restoring the current version
   - Attempt to restore the most recent version
   - Verify a new version is still created with the same content

6. **Test With Empty Version History**: Verify behavior for chats with no version history
   - Create a chat with minimal version history
   - Attempt restoration
   - Verify appropriate error handling

7. **Test Message Integrity**: Verify all messages are properly restored
   - Create a chat with multiple messages
   - Modify the chat significantly by adding/removing messages
   - Restore the original version
   - Verify all messages match the original version

8. **Test With Multiple Recipients**: Verify restoration behavior with chats that have multiple recipients
   - Create a chat with multiple recipients
   - Update the chat and then restore
   - Verify all recipients can see the restored content

9. **Test Metadata Restoration**: Verify that chat metadata is properly restored
   - Create a chat with specific metadata (title, description, etc.)
   - Update the metadata
   - Restore the original version
   - Verify that the metadata is correctly restored

10. **Test With Attachments**: Verify that attachments are properly handled during restoration
    - Create a chat with attachments
    - Update the chat by removing attachments
    - Restore the original version
    - Verify all attachments are accessible in the restored version

### Integration Tests

The following integration tests should verify end-to-end functionality:

1. **Full Restoration Flow**: Test the complete chat restoration process
   - Create a chat through the API
   - Add multiple messages to create versions
   - Send a restoration request through the API
   - Verify the response contains the correctly restored content
   - Fetch the chat again to confirm persistence

2. **Authorization Flow**: Test authorization rules throughout the complete process
   - Create a chat owned by user A
   - Share it with user B with CanEdit permissions
   - Share it with user C with ReadOnly permissions
   - Have each user attempt restoration
   - Verify only authorized users succeed

3. **Concurrent Operations**: Test behavior with concurrent chat operations
   - Initiate a restoration operation
   - Before it completes, send a new message operation
   - Verify both operations are properly sequenced without data corruption

4. **Error Recovery**: Test system recovery from errors during restoration
   - Simulate database errors during restoration
   - Verify the system handles errors gracefully without corrupting data
   - Verify appropriate error responses

5. **UI Integration**: Test that the restoration feature works properly from the UI
   - Create and update a chat through the UI
   - Use the UI controls to restore a previous version
   - Verify the chat is properly restored in the UI
   - Verify the restoration message is displayed correctly

### Example Unit Test Code

```rust
#[tokio::test]
async fn test_restore_chat_version() {
    // Set up test environment
    let pool = setup_test_db().await;
    let user = create_test_user().await;
    
    // Create a chat with initial messages
    let chat_id = create_test_chat(&user).await;
    
    // Add initial messages
    let message1 = ChatMessage {
        content: "Initial message 1".to_string(),
        sender_id: user.id,
        sent_at: Utc::now(),
        message_type: MessageType::Text,
        // Other fields...
    };
    
    let message2 = ChatMessage {
        content: "Initial message 2".to_string(),
        sender_id: user.id,
        sent_at: Utc::now() + Duration::seconds(1),
        message_type: MessageType::Text,
        // Other fields...
    };
    
    add_message_to_chat(chat_id, message1).await;
    add_message_to_chat(chat_id, message2).await;
    
    // Get the current version
    let initial_chat = get_chat(chat_id).await.unwrap();
    assert_eq!(initial_chat.version, 2); // Initial + 2 messages
    
    // Add more messages to create version 3, 4
    let message3 = ChatMessage {
        content: "New message 3".to_string(),
        sender_id: user.id,
        sent_at: Utc::now() + Duration::seconds(2),
        message_type: MessageType::Text,
        // Other fields...
    };
    
    let message4 = ChatMessage {
        content: "New message 4".to_string(),
        sender_id: user.id,
        sent_at: Utc::now() + Duration::seconds(3),
        message_type: MessageType::Text,
        // Other fields...
    };
    
    add_message_to_chat(chat_id, message3).await;
    add_message_to_chat(chat_id, message4).await;
    
    // Restore to version 2
    let restore_request = RestoreChatRequest {
        version: 2,
    };
    
    let result = restore_chat_handler(chat_id, restore_request, &user).await;
    
    // Assertions
    assert!(result.is_ok());
    
    let restored_chat = result.unwrap();
    
    // Verify a new version was created
    assert_eq!(restored_chat.version, 5);
    
    // Verify the content matches the original version
    assert_eq!(restored_chat.messages.len(), 2);
    assert_eq!(restored_chat.messages[0].content, "Initial message 1");
    assert_eq!(restored_chat.messages[1].content, "Initial message 2");
    
    // Verify a restoration message was added
    let all_messages = get_chat_messages(chat_id).await.unwrap();
    assert_eq!(all_messages.len(), 3); // 2 original + 1 restoration message
    assert!(all_messages[2].content.contains("restored"));
    assert_eq!(all_messages[2].message_type, MessageType::System);
}

### Example Integration Test Code

```rust
#[tokio::test]
async fn test_chat_restore_integration() {
    // Set up test server with routes
    let app = create_test_app().await;
    let client = TestClient::new(app);
    
    // Create a test user and authenticate
    let (user, token) = create_and_login_test_user().await;
    
    // Create a chat
    let create_response = client
        .post("/chats")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "title": "Test Chat",
            "recipients": [user.id]
        }))
        .send()
        .await;
    
    assert_eq!(create_response.status(), StatusCode::OK);
    let chat: BusterChatResponse = create_response.json().await;
    
    // Add messages to the chat
    let message1_response = client
        .post(&format!("/chats/{}/messages", chat.id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "content": "Initial message 1",
            "message_type": "text"
        }))
        .send()
        .await;
    
    assert_eq!(message1_response.status(), StatusCode::OK);
    
    let message2_response = client
        .post(&format!("/chats/{}/messages", chat.id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "content": "Initial message 2",
            "message_type": "text"
        }))
        .send()
        .await;
    
    assert_eq!(message2_response.status(), StatusCode::OK);
    
    // Add more messages to create newer versions
    let message3_response = client
        .post(&format!("/chats/{}/messages", chat.id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "content": "New message 3",
            "message_type": "text"
        }))
        .send()
        .await;
    
    assert_eq!(message3_response.status(), StatusCode::OK);
    
    // Get the chat to check version before restoration
    let get_response_before = client
        .get(&format!("/chats/{}", chat.id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await;
    
    assert_eq!(get_response_before.status(), StatusCode::OK);
    let chat_before: BusterChatResponse = get_response_before.json().await;
    
    // Check version is 3 (initial + 3 messages)
    assert_eq!(chat_before.version, 3);
    
    // Restore to version 2
    let restore_response = client
        .put(&format!("/chats/{}/restore", chat.id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "version": 2
        }))
        .send()
        .await;
    
    assert_eq!(restore_response.status(), StatusCode::OK);
    let restored_chat: BusterChatResponse = restore_response.json().await;
    
    // Verify the chat was restored properly
    assert_eq!(restored_chat.version, 4); // New version created
    
    // Verify by fetching the chat again
    let get_response = client
        .get(&format!("/chats/{}", chat.id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await;
    
    assert_eq!(get_response.status(), StatusCode::OK);
    let fetched_chat: BusterChatResponse = get_response.json().await;
    
    // Verify the fetched chat matches the restored version
    assert_eq!(fetched_chat.version, 4);
    
    // Verify messages - should be 2 initial messages plus a system message about restoration
    let messages_response = client
        .get(&format!("/chats/{}/messages", chat.id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await;
    
    assert_eq!(messages_response.status(), StatusCode::OK);
    let messages: Vec<ChatMessage> = messages_response.json().await;
    
    assert_eq!(messages.len(), 3); // 2 original + 1 system message about restoration
    assert_eq!(messages[0].content, "Initial message 1");
    assert_eq!(messages[1].content, "Initial message 2");
    assert!(messages[2].content.contains("restored"));
    assert_eq!(messages[2].message_type, "system");
}

## Security Considerations

- Ensure proper permission checks for both the chat and the asset being restored
- Verify that users can only restore versions of assets they have access to
- Consider audit logging for restoration actions
