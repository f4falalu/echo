-- Add default_channel column to slack_integrations table
ALTER TABLE "slack_integrations" 
ADD COLUMN "default_channel" jsonb DEFAULT '{}'::jsonb;