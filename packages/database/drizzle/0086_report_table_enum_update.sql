ALTER TYPE "public"."asset_type_enum" ADD VALUE 'report_file';--> statement-breakpoint
-- Commented out bc asset search asset type should stay as text for now
-- ALTER TABLE "asset_search" ALTER COLUMN "asset_type" SET DATA TYPE "public"."asset_type_enum" USING "asset_type"::"public"."asset_type_enum";