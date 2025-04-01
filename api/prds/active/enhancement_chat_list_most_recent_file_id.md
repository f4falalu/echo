# PRD: Add Most Recent File ID and Type to Chat Listing

## Problem Statement ✅
Currently, the chat listing (`list_chats_handler.rs` and `list_chats.rs`) does not efficiently display information about the most recent file associated with a chat. Users need to open individual chats to determine if relevant files (and their types) have been added or updated recently. This requires fetching and joining data across multiple tables (`chats`, `messages`, `messages_to_files`, `metric_files`, `dashboard_files`) on each request, which is inefficient, especially for users with many chats.

Key issues:
- Inefficient retrieval of the most recent file ID and type for the chat list.
- Users cannot quickly identify chats with recent file activity and the type of file without opening them.
- Potential performance degradation as chat and message volume increases.

### Current Limitations
- No direct fields on the `chats` table to indicate the most recent file ID and type.
- Requires complex joins or multiple queries to derive this information.

### Impact
- User Impact: Slower loading times for the chat list, reduced productivity when searching for chats with specific file activity.
- System Impact: Increased database load due to repeated complex queries for file information.

## Requirements

### Functional Requirements ✅
- Add optional `most_recent_file_id` and `most_recent_file_type` columns to the `chats` table.
  - Details: These columns will store the `UUID` and type (e.g., 'metric', 'dashboard') of the file associated with the most recently created message within that chat that has a file attached.
  - Acceptance Criteria: The `chats` table has new nullable `most_recent_file_id` (UUID) and `most_recent_file_type` (VARCHAR or ENUM) columns.
  - Dependencies: Database migration capabilities.

- Update the `chats` table whenever a message with a file is added.
  - Details: Modify the logic where messages are created (`post_chat_handler.rs` or similar) to update the corresponding chat's `most_recent_file_id` and `most_recent_file_type`. Only update if the new message is more recent than the one currently associated with the chat's `most_recent_file_id`.
  - Acceptance Criteria: The `chats.most_recent_file_id` and `chats.most_recent_file_type` are accurately updated upon the creation of a new message with an associated file.
  - Dependencies: Access to message creation logic and file type information during creation.

- Include `latest_file_id` and `latest_file_type` in the `ChatListItem` response.
  - Details: Modify `list_chats_handler.rs` to select the `most_recent_file_id` and `most_recent_file_type` from the `chats` table and include them in the `ChatListItem` struct.
  - Acceptance Criteria: The `/chats` API response includes optional `latest_file_id` and `latest_file_type` fields for each chat item.
  - Dependencies: Existing `ChatListItem` struct and `list_chats_handler.rs`.

### Non-Functional Requirements ✅
- Performance: Chat list retrieval should be fast, leveraging the direct column lookup. Query time should not increase significantly.
- Data Integrity: Ensure the `most_recent_file_id` and `most_recent_file_type` are reliably updated and kept consistent.
- Maintainability: The update logic should be centralized or clearly documented.

## Technical Design ✅

### System Architecture
Add denormalized columns to the `chats` table to optimize read performance. Updates occur during message/file creation.

### Core Components ✅

#### Component 1: Chat Model Update
```rust
// libs/database/src/models.rs
#[derive(Queryable, Insertable, Identifiable, Associations, Debug, Clone, Serialize)]
#[diesel(belongs_to(Organization))]
#[diesel(belongs_to(User, foreign_key = created_by))]
#[diesel(table_name = chats)]
pub struct Chat {
    pub id: Uuid,
    pub title: String,
    pub organization_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub publicly_accessible: bool,
    pub publicly_enabled_by: Option<Uuid>,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub most_recent_file_id: Option<Uuid>,
    pub most_recent_file_type: Option<String>,
}
```

#### Component 2: ChatListItem Update
```rust
// libs/handlers/src/chats/list_chats_handler.rs
#[derive(Debug, Serialize, Deserialize)]
pub struct ChatListItem {
    pub id: String,
    pub name: String,
    pub is_favorited: bool,
    pub updated_at: String,
    pub created_at: String,
    pub created_by: String,
    pub created_by_id: String,
    pub created_by_name: String,
    pub created_by_avatar: Option<String>,
    pub last_edited: String,
    pub latest_file_id: Option<String>,
    pub latest_file_type: Option<String>,
}

// Updated Queryable struct
#[derive(Queryable)]
struct ChatWithUser {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Uuid,
    pub most_recent_file_id: Option<Uuid>,
    pub most_recent_file_type: Option<String>,
    pub user_name: Option<String>,
    pub user_attributes: Value,
}
```

### Database Changes (If applicable) ✅

- **New Columns**: Add `most_recent_file_id` (UUID, nullable) and `most_recent_file_type` (VARCHAR, nullable) to the `chats` table.
- **Foreign Key**: Omitted for `most_recent_file_id` for simplicity as discussed.
- **Index**: Add indices on `most_recent_file_id` and potentially `most_recent_file_type` if filtering/sorting by type is anticipated.

```sql
-- Migration: up.sql
ALTER TABLE chats
ADD COLUMN most_recent_file_id UUID NULL,
ADD COLUMN most_recent_file_type VARCHAR(255) NULL; -- Adjust VARCHAR size or use ENUM if available

-- Optional: Add indices
CREATE INDEX idx_chats_most_recent_file_id ON chats(most_recent_file_id);
CREATE INDEX idx_chats_most_recent_file_type ON chats(most_recent_file_type);

-- Data Migration (Run once after adding the columns)
-- This needs refinement based on how file type is determined.
-- Assuming file type can be retrieved by joining messages_to_files.file_id
-- with the actual file tables (e.g., metric_files, dashboard_files)
WITH LatestFilePerChat AS (
    SELECT DISTINCT ON (m.chat_id)
        m.chat_id,
        mtf.file_id,
        -- Need to determine file type here, example placeholder:
        CASE
            WHEN mf.id IS NOT NULL THEN 'metric'
            WHEN df.id IS NOT NULL THEN 'dashboard'
            ELSE NULL
        END AS file_type
    FROM messages m
    JOIN messages_to_files mtf ON m.id = mtf.message_id
    LEFT JOIN metric_files mf ON mtf.file_id = mf.id -- Join to determine type
    LEFT JOIN dashboard_files df ON mtf.file_id = df.id -- Join to determine type
    WHERE m.deleted_at IS NULL AND mtf.deleted_at IS NULL
    ORDER BY m.chat_id, m.created_at DESC
)
UPDATE chats c
SET
    most_recent_file_id = lfpc.file_id,
    most_recent_file_type = lfpc.file_type
FROM LatestFilePerChat lfpc
WHERE c.id = lfpc.chat_id;

-- Migration: down.sql
ALTER TABLE chats
DROP COLUMN IF EXISTS most_recent_file_id,
DROP COLUMN IF EXISTS most_recent_file_type;

-- Optional: Drop indices
DROP INDEX IF EXISTS idx_chats_most_recent_file_id;
DROP INDEX IF EXISTS idx_chats_most_recent_file_type;
```

### API Changes (If applicable) ✅
- **Response Modification**: The `GET /chats` endpoint response will include `latest_file_id: Option<String>` and `latest_file_type: Option<String>` in each `ChatListItem`.

### File Changes (If applicable) ✅

#### New Files
- `migrations/YYYY-MM-DD-HHMMSS_add_file_info_to_chats/up.sql`
- `migrations/YYYY-MM-DD-HHMMSS_add_file_info_to_chats/down.sql`

#### Modified Files
- `libs/database/src/schema.rs` (via `diesel print-schema`)
- `libs/database/src/models.rs` (Add fields to `Chat` struct)
- `libs/handlers/src/chats/post_chat_handler.rs` (Update chat on `MessageToFile` creation)
- `libs/handlers/src/chats/list_chats_handler.rs` (Select new fields, update `ChatWithUser`, update mapping to `ChatListItem`)

## Implementation Plan

### Phase 1: Database Migration & Model Update ✅

1. Generate Diesel migration: `diesel migration generate add_file_info_to_chats`
2. Implement `up.sql`: Add columns and indices.
3. Implement `down.sql`: Drop columns and indices.
4. Run `diesel print-schema`.
5. Update `Chat` struct in `models.rs`.
6. Run the migration: `diesel migration run`.
7. Run the data migration SQL (adjusting file type logic as needed).

### Phase 2: Update Message Creation Logic ✅

1. Modify `post_chat_handler.rs`:
   - Within the logic that processes completed files (e.g., `process_completed_files` function) after successfully inserting a `MessageToFile` record:
     - Retrieve the `chat_id` associated with the `message_id`.
     - Determine the `file_type` (e.g., from `BusterReasoningFile.file_type`).
     - Execute a Diesel update statement to set the `most_recent_file_id` and `most_recent_file_type` on the `chats` table for the specific `chat_id`.

   ```rust
   // Example Diesel update logic within post_chat_handler.rs 
   // (inside the loop processing completed files after MessageToFile insert)
   use crate::schema::chats;
   use diesel::prelude::*;
   use diesel_async::RunQueryDsl;

   let file_id_to_set = Uuid::parse_str(file_id)?;
   let file_type_to_set = file_content.file_type.clone(); // Assuming file_content is available
   let target_chat_id = message.chat_id;

   // Ensure this update only happens if the current message is indeed the latest
   // This might require fetching the current most_recent_file timestamp or message timestamp
   // For simplicity, this example updates unconditionally, but production code should verify.
   diesel::update(chats::table.find(target_chat_id))
       .set((
           chats::most_recent_file_id.eq(Some(file_id_to_set)),
           chats::most_recent_file_type.eq(Some(file_type_to_set)),
           chats::updated_at.eq(Utc::now()), // Also update the chat's updated_at timestamp
       ))
       .execute(conn) // Assuming conn is the AsyncPgConnection
       .await?;
   ```

### Phase 3: Update Chat Listing Logic ✅

1. Modify `list_chats_handler.rs`:
   - Add `chats::most_recent_file_id`, `chats::most_recent_file_type` to the `select` clause in the main Diesel query.
   - Add `most_recent_file_type: Option<String>` field to the `ChatWithUser` struct.
   - Update the `.map(|chat: ChatWithUser| { ... })` block to populate `ChatListItem.latest_file_id` and `ChatListItem.latest_file_type` from the `ChatWithUser` fields.

### Phase 4: Testing & Documentation ✅

1. Add unit tests for `post_chat_handler.rs` update logic (including type).
2. Update integration tests for `list_chats.rs` to verify `latest_file_id` and `latest_file_type`.
3. Test scenarios: chats with no files, different file types.
4. Document the new fields and update mechanism.

## Testing Strategy ✅

### Unit Tests
- Test the `post_chat_handler` logic:
  - Verify `most_recent_file_id` and `most_recent_file_type` are updated correctly.
  - Test with different file types.

### Integration Tests
- Test the `GET /chats` endpoint:
  - Verify `latest_file_id` and `latest_file_type` are present and correct.
  - Verify `null` values for chats without files.

## Security Considerations
- Ensure file type information is handled safely and doesn't introduce vulnerabilities (e.g., if using ENUMs, ensure proper validation).

## References
- @libs/handlers/src/chats/list_chats_handler.rs
- @src/routes/rest/routes/chats/list_chats.rs
- @libs/database/src/schema.rs
- @libs/database/src/models.rs
- @libs/handlers/src/chats/post_chat_handler.rs
- @libs/database/src/models.rs (MessageToFile struct)
- @libs/database/src/schema.rs (messages_to_files table)
- @libs/handlers/src/chats/post_chat_handler.rs (BusterReasoningFile struct for type info) 