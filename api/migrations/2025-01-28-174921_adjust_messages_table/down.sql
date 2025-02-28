-- This file should undo anything in `up.sql`
-- Drop indexes
DROP INDEX messages_chat_id_idx;
DROP INDEX messages_created_by_idx;
DROP INDEX messages_created_at_idx;

-- Drop new messages table
DROP TABLE messages;

-- Rename deprecated table back to messages
ALTER TABLE messages_deprecated RENAME TO messages;
