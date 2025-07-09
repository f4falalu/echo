ALTER TABLE "asset_permissions" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."asset_permission_role_enum";--> statement-breakpoint
CREATE TYPE "public"."asset_permission_role_enum" AS ENUM('owner', 'viewer', 'full_access', 'can_edit', 'can_filter', 'can_view');--> statement-breakpoint
ALTER TABLE "asset_permissions" ALTER COLUMN "role" SET DATA TYPE "public"."asset_permission_role_enum" USING "role"::"public"."asset_permission_role_enum";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "post_processing_message" jsonb;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "domains" text[];--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "restrict_new_user_invitations" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "default_role" "user_organization_role_enum" DEFAULT 'restricted_querier' NOT NULL;