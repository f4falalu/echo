-- Add postProcessingMessage column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS post_processing_message jsonb;