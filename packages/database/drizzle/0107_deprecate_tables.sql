DO $$
BEGIN
IF NOT EXISTS (
  SELECT 1
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typnamespace = 'public'::regnamespace
    AND t.typname = 'team_role_enum'
    AND e.enumlabel = 'none'
) THEN
  ALTER TYPE "public"."team_role_enum" ADD VALUE 'none';
END IF;
END $$;--> statement-breakpoint
ALTER TABLE IF EXISTS "dashboard_versions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "dashboards" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "dataset_columns" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "__diesel_schema_migrations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "entity_relationship" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "messages_deprecated" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "sql_evaluations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "stored_values_sync_jobs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "terms" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "terms_to_datasets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "threads_deprecated" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "threads_to_dashboards" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "database_metadata" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "schema_metadata" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "deprecated";--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dashboard_versions') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."dashboard_versions" (LIKE "public"."dashboard_versions" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."dashboard_versions") THEN
INSERT INTO "deprecated"."dashboard_versions" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."dashboard_versions";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dashboards') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."dashboards" (LIKE "public"."dashboards" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."dashboards") THEN
INSERT INTO "deprecated"."dashboards" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."dashboards";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dataset_columns') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."dataset_columns" (LIKE "public"."dataset_columns" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."dataset_columns") THEN
INSERT INTO "deprecated"."dataset_columns" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."dataset_columns";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__diesel_schema_migrations') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."__diesel_schema_migrations" (LIKE "public"."__diesel_schema_migrations" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."__diesel_schema_migrations") THEN
INSERT INTO "deprecated"."__diesel_schema_migrations" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."__diesel_schema_migrations";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entity_relationship') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."entity_relationship" (LIKE "public"."entity_relationship" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."entity_relationship") THEN
INSERT INTO "deprecated"."entity_relationship" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."entity_relationship";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages_deprecated') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."messages_deprecated" (LIKE "public"."messages_deprecated" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."messages_deprecated") THEN
INSERT INTO "deprecated"."messages_deprecated" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."messages_deprecated";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sql_evaluations') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."sql_evaluations" (LIKE "public"."sql_evaluations" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."sql_evaluations") THEN
INSERT INTO "deprecated"."sql_evaluations" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."sql_evaluations";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stored_values_sync_jobs') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."stored_values_sync_jobs" (LIKE "public"."stored_values_sync_jobs" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."stored_values_sync_jobs") THEN
INSERT INTO "deprecated"."stored_values_sync_jobs" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."stored_values_sync_jobs";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'terms') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."terms" (LIKE "public"."terms" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."terms") THEN
INSERT INTO "deprecated"."terms" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."terms";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'terms_to_datasets') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."terms_to_datasets" (LIKE "public"."terms_to_datasets" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."terms_to_datasets") THEN
INSERT INTO "deprecated"."terms_to_datasets" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."terms_to_datasets";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'threads_deprecated') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."threads_deprecated" (LIKE "public"."threads_deprecated" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."threads_deprecated") THEN
INSERT INTO "deprecated"."threads_deprecated" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."threads_deprecated";
END IF;
END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'threads_to_dashboards') THEN
CREATE TABLE IF NOT EXISTS "deprecated"."threads_to_dashboards" (LIKE "public"."threads_to_dashboards" INCLUDING ALL);
IF NOT EXISTS (SELECT 1 FROM "deprecated"."threads_to_dashboards") THEN
INSERT INTO "deprecated"."threads_to_dashboards" OVERRIDING SYSTEM VALUE SELECT * FROM "public"."threads_to_dashboards";
END IF;
END IF;
END $$;--> statement-breakpoint
DROP TABLE IF EXISTS "dashboard_versions" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "dashboards" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "dataset_columns" CASCADE;--> statement-breakpoint
DO $$
BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__diesel_schema_migrations') THEN
  DROP POLICY IF EXISTS "diesel_schema_migrations_policy" ON "__diesel_schema_migrations" CASCADE;
  DROP TABLE IF EXISTS "__diesel_schema_migrations" CASCADE;
END IF;
END $$;--> statement-breakpoint
DROP TABLE IF EXISTS "database_metadata" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "schema_metadata" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "entity_relationship" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "messages_deprecated" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "sql_evaluations" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "stored_values_sync_jobs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "terms" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "terms_to_datasets" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "threads_deprecated" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "threads_to_dashboards" CASCADE;--> statement-breakpoint
ALTER TABLE "asset_permissions" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."asset_permission_role_enum";--> statement-breakpoint
CREATE TYPE "public"."asset_permission_role_enum" AS ENUM('owner', 'viewer', 'can_view', 'can_filter', 'can_edit', 'full_access');--> statement-breakpoint
ALTER TABLE "asset_permissions" ALTER COLUMN "role" SET DATA TYPE "public"."asset_permission_role_enum" USING "role"::"public"."asset_permission_role_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "suggested_prompts" SET DEFAULT '{"suggestedPrompts":{"report":["provide a trend analysis of quarterly profits","evaluate product performance across regions"],"dashboard":["create a sales performance dashboard","design a revenue forecast dashboard"],"visualization":["create a metric for monthly sales","show top vendors by purchase volume"],"help":["what types of analyses can you perform?","what questions can I as buster?","what data models are available for queries?","can you explain your forecasting capabilities?"]},"updatedAt":"2025-09-19T19:10:16.634Z"}'::jsonb;