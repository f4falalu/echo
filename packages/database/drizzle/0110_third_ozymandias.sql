-- Update existing values in chats table to match asset_type_enum values
UPDATE public"chats" SET "most_recent_file_type" = 'metric_file' WHERE "most_recent_file_type" = 'metric';--> statement-breakpoint
UPDATE public."chats" SET "most_recent_file_type" = 'dashboard_file' WHERE "most_recent_file_type" = 'dashboard';--> statement-breakpoint
UPDATE public."chats" SET "most_recent_file_type" = 'report_file' WHERE "most_recent_file_type" = 'report';--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "most_recent_file_type" SET DATA TYPE "public"."asset_type_enum" USING "most_recent_file_type"::"public"."asset_type_enum";--> statement-breakpoint
