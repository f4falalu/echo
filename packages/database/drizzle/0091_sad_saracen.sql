CREATE TABLE "shortcuts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"instructions" text NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"organization_id" uuid NOT NULL,
	"shared_with_workspace" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "shortcuts_personal_unique" UNIQUE("name","organization_id","created_by")
);
--> statement-breakpoint
ALTER TABLE "shortcuts" ADD CONSTRAINT "shortcuts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "shortcuts" ADD CONSTRAINT "shortcuts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "shortcuts" ADD CONSTRAINT "shortcuts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shortcuts_org_user_idx" ON "shortcuts" USING btree ("organization_id" uuid_ops,"created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "shortcuts_name_idx" ON "shortcuts" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "shortcuts_workspace_unique" ON "shortcuts" USING btree ("name","organization_id") WHERE "shortcuts"."shared_with_workspace" = true;