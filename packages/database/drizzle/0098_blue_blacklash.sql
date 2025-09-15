ALTER TYPE "public"."asset_type_enum" ADD VALUE 'message';--> statement-breakpoint
CREATE TABLE "text_search" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type" "asset_type_enum" NOT NULL,
	"asset_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"searchable_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "text_search_asset_type_asset_id_unique" UNIQUE("asset_id","asset_type")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "suggested_prompts" SET DEFAULT '{"suggestedPrompts":{"report":["provide a trend analysis of quarterly profits","evaluate product performance across regions"],"dashboard":["create a sales performance dashboard","design a revenue forecast dashboard"],"visualization":["create a metric for monthly sales","show top vendors by purchase volume"],"help":["what types of analyses can you perform?","what questions can I as buster?","what data models are available for queries?","can you explain your forecasting capabilities?"]},"updatedAt":"2025-09-15T19:58:42.363Z"}'::jsonb;--> statement-breakpoint
ALTER TABLE "text_search" ADD CONSTRAINT "text_search_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pgroonga_search_text_index" ON "text_search" USING pgroonga ("searchable_text" pgroonga_text_full_text_search_ops_v2);