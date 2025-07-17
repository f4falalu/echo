CREATE TYPE "public"."slack_chat_authorization_enum" AS ENUM('unauthorized', 'authorized', 'auto_added');--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "slack_chat_authorization" "slack_chat_authorization_enum";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "slack_thread_ts" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "slack_channel_id" text;