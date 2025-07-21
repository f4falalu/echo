CREATE TYPE "public"."github_integration_status_enum" AS ENUM('pending', 'active', 'suspended', 'revoked');--> statement-breakpoint
CREATE TABLE "github_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"installation_id" varchar(255),
	"app_id" varchar(255),
	"github_org_id" varchar(255),
	"github_org_name" varchar(255),
	"token_vault_key" varchar(255),
	"webhook_secret_vault_key" varchar(255),
	"repository_permissions" jsonb DEFAULT '{}'::jsonb,
	"status" "github_integration_status_enum" DEFAULT 'pending' NOT NULL,
	"installed_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "github_integrations_token_vault_key_unique" UNIQUE("token_vault_key"),
	CONSTRAINT "github_integrations_org_installation_key" UNIQUE("organization_id","installation_id")
);
--> statement-breakpoint
ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_github_integrations_org_id" ON "github_integrations" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_github_integrations_installation_id" ON "github_integrations" USING btree ("installation_id" text_ops);
