-- Your SQL goes here
-- Rename existing messages table to messages_deprecated
ALTER TABLE messages DROP CONSTRAINT messages_thread_id_fkey;

ALTER TABLE messages RENAME TO messages_deprecated;

-- Create new messages table with updated schema
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request TEXT NOT NULL,
    response JSONB NOT NULL,
    chat_id UUID NOT NULL REFERENCES chats(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), 
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id)
);


-- Create indexes for common query patterns
CREATE INDEX messages_chat_id_idx ON messages(chat_id);
CREATE INDEX messages_created_by_idx ON messages(created_by);
CREATE INDEX messages_created_at_idx ON messages(created_at);


