CREATE TABLE "metric_files_to_report_files" (
	"metric_file_id" uuid NOT NULL,
	"report_file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	CONSTRAINT "metric_files_to_report_files_pkey" PRIMARY KEY("metric_file_id","report_file_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "suggested_prompts" SET DEFAULT '{"suggestedPrompts":{"report":["provide a trend analysis of quarterly profits","evaluate product performance across regions"],"dashboard":["create a sales performance dashboard","design a revenue forecast dashboard"],"visualization":["create a metric for monthly sales","show top vendors by purchase volume"],"help":["what types of analyses can you perform?","what questions can I as buster?","what data models are available for queries?","can you explain your forecasting capabilities?"]},"updatedAt":"2025-09-15T22:23:04.874Z"}'::jsonb;--> statement-breakpoint
ALTER TABLE "metric_files_to_report_files" ADD CONSTRAINT "metric_files_to_report_files_metric_file_id_fkey" FOREIGN KEY ("metric_file_id") REFERENCES "public"."metric_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_files_to_report_files" ADD CONSTRAINT "metric_files_to_report_files_report_file_id_fkey" FOREIGN KEY ("report_file_id") REFERENCES "public"."report_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_files_to_report_files" ADD CONSTRAINT "metric_files_to_report_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "metric_files_to_report_files_report_id_idx" ON "metric_files_to_report_files" USING btree ("report_file_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "metric_files_to_report_files_deleted_at_idx" ON "metric_files_to_report_files" USING btree ("deleted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "metric_files_to_report_files_metric_id_idx" ON "metric_files_to_report_files" USING btree ("metric_file_id" uuid_ops);