ALTER TABLE "organizations" ADD COLUMN "domains" text[];--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "restrict_new_user_invitations" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "default_role" "user_organization_role_enum" DEFAULT 'restricted_querier' NOT NULL;