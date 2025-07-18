CREATE TYPE "public"."workspace_sharing_enum" AS ENUM('none', 'can_view', 'can_edit', 'full_access');--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "workspace_sharing" "workspace_sharing_enum" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "workspace_sharing_enabled_by" uuid;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "workspace_sharing_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "workspace_sharing" "workspace_sharing_enum" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "workspace_sharing_enabled_by" uuid;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "workspace_sharing_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD COLUMN "workspace_sharing" "workspace_sharing_enum" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD COLUMN "workspace_sharing_enabled_by" uuid;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD COLUMN "workspace_sharing_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "metric_files" ADD COLUMN "workspace_sharing" "workspace_sharing_enum" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "metric_files" ADD COLUMN "workspace_sharing_enabled_by" uuid;--> statement-breakpoint
ALTER TABLE "metric_files" ADD COLUMN "workspace_sharing_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_workspace_sharing_enabled_by_fkey" FOREIGN KEY ("workspace_sharing_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_workspace_sharing_enabled_by_fkey" FOREIGN KEY ("workspace_sharing_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD CONSTRAINT "dashboard_files_workspace_sharing_enabled_by_fkey" FOREIGN KEY ("workspace_sharing_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "metric_files" ADD CONSTRAINT "metric_files_workspace_sharing_enabled_by_fkey" FOREIGN KEY ("workspace_sharing_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;