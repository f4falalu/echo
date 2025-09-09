CREATE TYPE "public"."docs_type_enum" AS ENUM('analyst', 'normal');--> statement-breakpoint
CREATE TABLE "docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" "docs_type_enum" DEFAULT 'normal' NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "docs_name_organization_id_key" UNIQUE("name","organization_id")
);
--> statement-breakpoint
ALTER TABLE "docs" ADD CONSTRAINT "docs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;