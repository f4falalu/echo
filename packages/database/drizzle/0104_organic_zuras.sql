ALTER TABLE "asset_permissions" ALTER COLUMN "asset_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "collections_to_assets" ALTER COLUMN "asset_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "text_search" ALTER COLUMN "asset_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_favorites" ALTER COLUMN "asset_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."asset_type_enum";--> statement-breakpoint
CREATE TYPE "public"."asset_type_enum" AS ENUM('chat', 'metric_file', 'dashboard_file', 'report_file', 'collection');--> statement-breakpoint
ALTER TABLE "asset_permissions" ALTER COLUMN "asset_type" SET DATA TYPE "public"."asset_type_enum" USING "asset_type"::"public"."asset_type_enum";--> statement-breakpoint
ALTER TABLE "collections_to_assets" ALTER COLUMN "asset_type" SET DATA TYPE "public"."asset_type_enum" USING "asset_type"::"public"."asset_type_enum";--> statement-breakpoint
ALTER TABLE "text_search" ALTER COLUMN "asset_type" SET DATA TYPE "public"."asset_type_enum" USING "asset_type"::"public"."asset_type_enum";--> statement-breakpoint
ALTER TABLE "user_favorites" ALTER COLUMN "asset_type" SET DATA TYPE "public"."asset_type_enum" USING "asset_type"::"public"."asset_type_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "suggested_prompts" SET DEFAULT '{"suggestedPrompts":{"report":["provide a trend analysis of quarterly profits","evaluate product performance across regions"],"dashboard":["create a sales performance dashboard","design a revenue forecast dashboard"],"visualization":["create a metric for monthly sales","show top vendors by purchase volume"],"help":["what types of analyses can you perform?","what questions can I as buster?","what data models are available for queries?","can you explain your forecasting capabilities?"]},"updatedAt":"2025-09-17T20:41:10.972Z"}'::jsonb;