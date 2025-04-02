# Chat Duplication API Endpoint

## Overview
This PRD outlines the implementation of a new REST endpoint for duplicating chats in the Buster API. The endpoint will allow users to create a copy of an existing chat, including its messages and associated file references, while maintaining proper tracking of duplicated content.

## Problem Statement
Currently, there is no way to duplicate an existing chat in the system. Users who want to create variations of an existing chat or preserve a chat's state at a certain point need to manually recreate the chat and its contents. This is time-consuming and error-prone.

## Success Metrics
1. Successful duplication of chats with all associated messages and file references
2. Proper tracking of duplicated content through the new `is_duplicate` flag
3. Correct handling of partial chat duplication when a specific message ID is provided
4. Maintenance of proper access controls and permissions in duplicated chats

## Technical Design

### New Endpoint
```
POST /chats/duplicate
```

#### Request and Response Objects
```rust
// Request struct
#[derive(Deserialize)]
pub struct DuplicateChatRequest {
    pub id: Uuid,  // UUID of the source chat
    pub message_id: Option<Uuid>,  // Optional UUID of the message to start duplication from
}

// Response struct
#[derive(Serialize)]
pub struct DuplicateChatResponse {
    pub chat: ChatWithMessages,  // Standard chat response type
}
```

### Database Changes

1. Add `is_duplicate` column to `messages_to_files` table:
```sql
ALTER TABLE messages_to_files
ADD COLUMN is_duplicate BOOLEAN NOT NULL DEFAULT false;
```

2. Update `MessageToFile` struct in models.rs:
```rust
pub struct MessageToFile {
    pub id: Uuid,
    pub message_id: Uuid,
    pub file_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub is_duplicate: bool,  // New field
}
```

### Implementation Details

#### Handler Implementation
1. Create new handler file: `libs/handlers/src/chats/duplicate_chat_handler.rs`

```rust
use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::chats::get_chat_handler::get_chat_handler;
use crate::chats::types::ChatWithMessages;
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::helpers::chats::fetch_chat_with_permission;
use database::models::{AssetPermission, Chat, Message, MessageToFile};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, chats, messages, messages_to_files};
use sharing::check_permission_access;

pub async fn duplicate_chat_handler(
    chat_id: &Uuid,
    message_id: Option<&Uuid>,
    user: &AuthenticatedUser,
) -> Result<ChatWithMessages> {
    // First check if the user has permission to view the source chat
    let chat_with_permission = fetch_chat_with_permission(chat_id, &user.id).await?;

    // If chat not found, return error
    let chat_with_permission = match chat_with_permission {
        Some(cwp) => cwp,
        None => return Err(anyhow!("Chat not found")),
    };

    // Check if user has permission to view the chat
    // Users need at least CanView permission or any higher permission
    let has_permission = check_permission_access(
        chat_with_permission.permission,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        chat_with_permission.chat.organization_id,
        &user.organizations,
    );

    // If user is the creator, they automatically have access
    let is_creator = chat_with_permission.chat.created_by == user.id;

    if !has_permission && !is_creator {
        return Err(anyhow!("You don't have permission to view this chat"));
    }

    let mut conn = get_pg_pool().get().await?;

    // 1. Create a new chat record
    let source_chat = chat_with_permission.chat;
    let new_chat_id = Uuid::new_v4();
    let now = Utc::now();
    
    // Append (Copy) to the title
    let new_title = format!("{} (Copy)", source_chat.title);
    
    let new_chat = Chat {
        id: new_chat_id,
        title: new_title,
        organization_id: source_chat.organization_id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
        publicly_accessible: false, // Start with private access
        publicly_enabled_by: None,
        public_expiry_date: None,
        most_recent_file_id: source_chat.most_recent_file_id,
        most_recent_file_type: source_chat.most_recent_file_type.clone(),
    };
    
    // Insert the new chat record
    diesel::insert_into(chats::table)
        .values(&new_chat)
        .execute(&mut conn)
        .await?;
    
    // 2. Set permissions for the new chat (owner for the current user)
    let new_permission = AssetPermission {
        identity_id: user.id,
        identity_type: IdentityType::User,
        asset_id: new_chat_id,
        asset_type: AssetType::Chat,
        role: AssetPermissionRole::Owner,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
    };
    
    diesel::insert_into(asset_permissions::table)
        .values(&new_permission)
        .execute(&mut conn)
        .await?;
    
    // 3. Determine which messages to duplicate based on message_id parameter
    let messages_to_duplicate = match message_id {
        Some(msg_id) => {
            // Get the specific message and check if it belongs to the chat
            let message = messages::table
                .filter(messages::id.eq(msg_id))
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .first::<Message>(&mut conn)
                .await?;
                
            // Get all messages from this point back in time (inclusive)
            messages::table
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .filter(messages::created_at.ge(message.created_at))
                .order_by(messages::created_at.asc())
                .load::<Message>(&mut conn)
                .await?
        },
        None => {
            // Get all non-deleted messages from the chat
            messages::table
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .order_by(messages::created_at.asc())
                .load::<Message>(&mut conn)
                .await?
        }
    };
    
    // 4. Duplicate each message
    for source_message in messages_to_duplicate {
        let new_message_id = Uuid::new_v4();
        
        // Create a new message record
        let new_message = Message {
            id: new_message_id,
            request_message: source_message.request_message.clone(),
            response_messages: source_message.response_messages.clone(),
            reasoning: source_message.reasoning.clone(),
            title: source_message.title.clone(),
            raw_llm_messages: source_message.raw_llm_messages.clone(),
            final_reasoning_message: source_message.final_reasoning_message.clone(),
            chat_id: new_chat_id,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by: user.id,
            feedback: source_message.feedback.clone(),
        };
        
        // Insert the new message record
        diesel::insert_into(messages::table)
            .values(&new_message)
            .execute(&mut conn)
            .await?;
        
        // 5. Duplicate associated file references with is_duplicate flag
        let file_references = messages_to_files::table
            .filter(messages_to_files::message_id.eq(source_message.id))
            .filter(messages_to_files::deleted_at.is_null())
            .load::<MessageToFile>(&mut conn)
            .await?;
            
        for file_ref in file_references {
            let new_file_ref = MessageToFile {
                id: Uuid::new_v4(),
                message_id: new_message_id,
                file_id: file_ref.file_id,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                is_duplicate: true, // Mark as duplicate
            };
            
            diesel::insert_into(messages_to_files::table)
                .values(&new_file_ref)
                .execute(&mut conn)
                .await?;
        }
    }
    
    // 6. Return the new chat with all messages
    get_chat_handler(&new_chat_id, user, false).await
}
```

2. Create new route file: `src/routes/rest/routes/chats/duplicate_chat.rs`

```rust
use actix_web::{post, web, HttpResponse};
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use handlers::chats::duplicate_chat_handler;
use sharing::AppError;

#[derive(Deserialize)]
pub struct DuplicateChatRequest {
    pub id: Uuid,
    pub message_id: Option<Uuid>,
}

#[derive(Serialize)]
pub struct DuplicateChatResponse {
    pub chat: handlers::chats::types::ChatWithMessages,
}

#[post("/chats/duplicate")]
pub async fn duplicate_chat(
    request: web::Json<DuplicateChatRequest>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let result = duplicate_chat_handler::duplicate_chat_handler(
        &request.id,
        request.message_id.as_ref(),
        &user,
    )
    .await
    .map_err(AppError::from)?;

    Ok(HttpResponse::Ok().json(DuplicateChatResponse { chat: result }))
}
```

3. Update `src/routes/rest/routes/chats/mod.rs` to include the new route:

```rust
// Existing imports...
mod duplicate_chat;

pub fn configure(cfg: &mut web::ServiceConfig) {
    // Existing routes...
    cfg.service(duplicate_chat::duplicate_chat);
}
```

#### Duplication Process Flow

1. **Validate Source Chat**
   - Check that the source chat exists
   - Verify user has appropriate permissions
   - Validate optional message_id if provided

2. **Create New Chat Entity**
   - Generate new UUID for the chat
   - Copy details from source chat
   - Append "(Copy)" to the title
   - Set current user as owner
   - Initialize with private access (not publicly accessible)

3. **Set Permissions**
   - Grant Owner permission to the current user on the new chat
   - Maintain organization context from source chat

4. **Select Messages to Duplicate**
   - If message_id provided: Retrieve messages from that point chronologically
   - If no message_id: Retrieve all non-deleted messages
   - Order messages by creation time

5. **Duplicate Messages**
   - For each message:
     - Generate new UUID
     - Copy content (request_message, response_messages, reasoning, etc.)
     - Associate with new chat
     - Set creation time to current time
     - Set creator to current user

6. **Duplicate File References**
   - For each message:
     - Find all associated files via messages_to_files table
     - Create new references with is_duplicate=true
     - Maintain reference to original file_id (no file duplication)
     - Set new message_id for the reference

7. **Return Complete Chat**
   - Use existing get_chat_handler to fetch complete new chat with messages
   - Return standard ChatWithMessages response

### File Changes

1. New Files:
   - `libs/handlers/src/chats/duplicate_chat_handler.rs`
   - `src/routes/rest/routes/chats/duplicate_chat.rs`
   - `migrations/2025-04-02-030531_add_is_duplicate_to_messages_to_files/up.sql`
   - `migrations/2025-04-02-030531_add_is_duplicate_to_messages_to_files/down.sql`

2. Modified Files:
   - `libs/database/src/models.rs` - Added is_duplicate field to MessageToFile struct
   - `libs/database/src/schema.rs` - Auto-updated by diesel after migration
   - `src/routes/rest/routes/chats/mod.rs` - Added new duplicate_chat route

### Objects to Duplicate

1. **Chat Object**
   - Main chat record from `chats` table
   - Modified with "(Copy)" suffix in title

2. **Messages**
   - All message records for the chat from `messages` table
   - Contains request_message, response_messages, reasoning, etc.

3. **Message-to-File References**
   - All file references from `messages_to_files` table
   - References are duplicated, but actual files are not
   - New references are marked with is_duplicate=true

4. **Chat Permissions**
   - Only Owner permission for current user is created
   - Other permissions are not transferred

### Objects NOT to Duplicate

1. **Actual Files**
   - Files themselves are referenced but not duplicated
   - Only the message-to-file relationship is duplicated

2. **Dashboards and Metrics**
   - These are external assets and not directly duplicated
   - If referenced in messages, the references are maintained

3. **Public Access Settings**
   - New chat starts with publicly_accessible=false
   - No public expiry date or enabler is set

### Security Considerations

1. **Permission Verification**
   - Validate user has at least CanView access to source chat
   - Creator of chat automatically has access

2. **Permission Application**
   - Only Owner permission is applied to new chat for current user
   - Other permissions are not transferred from source chat

3. **Asset Reference Protection**
   - File references maintain existing access controls
   - Duplicated chat does not expose additional assets
   - The is_duplicate flag helps with tracking duplicated references

4. **Organization Context**
   - Maintain organization_id from source chat
   - Verify user has access to the organization

## Testing Strategy

### Unit Tests

1. Test duplicate_chat_handler:
   ```rust
   #[tokio::test]
   async fn test_duplicate_full_chat() {
       // Create a mock chat with messages
       // Call duplicate_chat_handler with just chat ID
       // Verify all messages were duplicated
       // Verify title has "(Copy)" suffix
       // Verify permissions are correct
   }

   #[tokio::test]
   async fn test_duplicate_partial_chat() {
       // Create a mock chat with multiple messages
       // Call duplicate_chat_handler with specific message ID
       // Verify only messages from that ID forward were duplicated
       // Verify title and permissions
   }

   #[tokio::test]
   async fn test_duplicate_chat_with_files() {
       // Create a mock chat with messages that have file references
       // Call duplicate_chat_handler
       // Verify all file references were duplicated
       // Verify is_duplicate flag is set to true
   }

   #[tokio::test]
   async fn test_duplicate_chat_no_permission() {
       // Create a mock chat owned by another user
       // Attempt to duplicate without proper permission
       // Verify appropriate error is returned
   }
   ```

2. Test route handler:
   ```rust
   #[actix_rt::test]
   async fn test_duplicate_chat_route() {
       // Setup mock app with route
       // Make POST request with valid chat ID
       // Verify 200 response with proper chat data
   }

   #[actix_rt::test]
   async fn test_duplicate_chat_route_invalid_id() {
       // Setup mock app with route
       // Make POST request with invalid chat ID
       // Verify appropriate error response
   }
   ```

### Integration Tests

1. End-to-end chat duplication:
   - Create test chat with multiple messages
   - Duplicate through API
   - Verify all content is duplicated correctly

2. File reference duplication:
   - Create test chat with file references
   - Duplicate through API
   - Verify references are marked as duplicates
   - Verify file access works properly

3. Permission propagation:
   - Verify only the current user gets Owner permission
   - Verify other users can't access without explicit permission

### Manual Testing Checklist

- [ ] Duplicate chat with multiple messages
- [ ] Duplicate chat from specific message ID
- [ ] Verify all file references are properly duplicated
- [ ] Verify "(Copy)" is appended to chat title
- [ ] Verify messages show correct content
- [ ] Verify permissions are properly set
- [ ] Verify is_duplicate flag is set correctly in all file references
- [ ] Test with chats containing different types of messages (text, files, reasoning)
- [ ] Verify performance with large chats

## Rollout Plan

1. Deploy database migration
   - Run on staging first to verify schema changes
   - Monitor for any issues with existing messages_to_files records

2. Deploy code changes
   - Deploy handler and route implementations
   - Enable feature on staging environment

3. Testing
   - Perform manual testing on staging
   - Verify all test cases pass

4. Production rollout
   - Execute migration on production database
   - Deploy code changes
   - Monitor for any performance issues or errors

5. Post-deployment
   - Monitor usage patterns
   - Gather user feedback
   - Track any issues with duplicated content

## Dependencies

- Diesel for database operations (already in use)
- Existing chat and message models
- Authentication middleware (AuthenticatedUser)
- Permission checking utilities
- UUID generation
- get_chat_handler for retrieving the final chat

## Rollback Plan

1. Code rollback:
   - Remove new endpoint
   - Remove new handler
   - Revert mod.rs changes

2. Database rollback:
   - Execute down migration to remove is_duplicate column:
   ```sql
   ALTER TABLE messages_to_files
   DROP COLUMN is_duplicate;
   ```

## Timeline

- Database migration: 1 day
- Handler implementation: 2 days
- Route implementation: 1 day
- Testing: 2 days
- Code review and fixes: 1 day
- Total: 1 week

## Future Considerations

1. Enhanced duplication options:
   - Custom naming for duplicated chats
   - Option to copy permissions from original chat
   - Selective message duplication (specific ranges)

2. Bulk operations:
   - Duplicate multiple chats at once
   - Merge selected messages from different chats

3. Advanced tracking:
   - Track lineage of duplicated chats
   - Visualize relationships between original and copies

4. Performance optimization:
   - Batch inserts for better performance with large chats
   - Background processing for very large chats 