-- Add trigger_run_id column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS trigger_run_id text;