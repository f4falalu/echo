ALTER TABLE "messages" ALTER COLUMN "response_messages" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "reasoning" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "raw_llm_messages" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
CREATE INDEX "messages_deleted_at_idx" ON "messages" USING btree ("deleted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "messages_raw_llm_messages_gin_idx" ON "messages" USING gin ("raw_llm_messages" jsonb_ops);--> statement-breakpoint
CREATE INDEX "messages_response_messages_gin_idx" ON "messages" USING gin ("response_messages" jsonb_ops);--> statement-breakpoint
CREATE INDEX "messages_reasoning_gin_idx" ON "messages" USING gin ("reasoning" jsonb_ops);--> statement-breakpoint
CREATE INDEX "messages_id_deleted_at_idx" ON "messages" USING btree ("id" uuid_ops,"deleted_at" timestamptz_ops);