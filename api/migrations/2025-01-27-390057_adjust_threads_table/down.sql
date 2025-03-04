-- This file should undo anything in `up.sql`
-- Drop indexes
DROP INDEX chats_organization_id_idx;
DROP INDEX chats_created_by_idx;
DROP INDEX chats_created_at_idx;

-- Drop new threads table
DROP TABLE chats;

-- Rename deprecated table back to threads
ALTER TABLE threads_deprecated RENAME TO threads;
