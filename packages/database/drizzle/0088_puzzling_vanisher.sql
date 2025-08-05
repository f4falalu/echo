ALTER TABLE "asset_search" ALTER COLUMN "asset_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "dashboard_files" ALTER COLUMN "content" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "report_files" ALTER COLUMN "content" SET DATA TYPE text;