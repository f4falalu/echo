-- Drop triggers created in 0099_red_blindfold.sql
DROP TRIGGER IF EXISTS sync_chats_text_search ON chats;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_metric_files_text_search ON metric_files;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_dashboard_files_text_search ON dashboard_files;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_report_files_text_search ON report_files;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_messages_text_search ON messages;--> statement-breakpoint
ALTER TABLE IF EXISTS "text_search" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE IF EXISTS "text_search" CASCADE;--> statement-breakpoint

CREATE TABLE "asset_search_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type" "asset_type_enum" NOT NULL,
	"asset_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"additional_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "asset_search_v2_asset_type_asset_id_unique" UNIQUE("asset_id","asset_type")
);
--> statement-breakpoint
ALTER TABLE "asset_search_v2" ADD CONSTRAINT "asset_search_v2_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pgroonga_search_title_description_index" ON "asset_search_v2" USING pgroonga ("title" pgroonga_text_full_text_search_ops_v2,"additional_text" pgroonga_text_full_text_search_ops_v2);

CREATE OR REPLACE FUNCTION sync_chats_to_text_search()
RETURNS TRIGGER AS $$
DECLARE
    messages_text text;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Get all request messages for this chat
        SELECT string_agg(COALESCE(request_message, ''), E'\n' ORDER BY created_at)
        INTO messages_text
        FROM public.messages
        WHERE chat_id = NEW.id AND deleted_at IS NULL AND request_message IS NOT NULL AND request_message != '';
        
        INSERT INTO public.asset_search_v2 (
            asset_id, asset_type, title, additional_text, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'chat', COALESCE(NEW.title, ''), messages_text,
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            title = EXCLUDED.title,
            additional_text = EXCLUDED.additional_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'chat';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for metric_files table
CREATE OR REPLACE FUNCTION sync_metric_files_to_text_search()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.asset_search_v2 (
            asset_id, asset_type, title, additional_text, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'metric_file', COALESCE(NEW.name, ''), 
            COALESCE(NEW.content ->> 'description', ''),
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            title = EXCLUDED.title,
            additional_text = EXCLUDED.additional_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'metric_file';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for dashboard_files table
CREATE OR REPLACE FUNCTION sync_dashboard_files_to_text_search()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.asset_search_v2 (
            asset_id, asset_type, title, additional_text, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'dashboard_file', COALESCE(NEW.name, ''), 
            COALESCE(NEW.content ->> 'description', ''),
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            title = EXCLUDED.title,
            additional_text = EXCLUDED.additional_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'dashboard_file';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for report_files table
CREATE OR REPLACE FUNCTION sync_report_files_to_text_search()
RETURNS TRIGGER AS $$
DECLARE
    cleaned_content text;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Remove <metric> tags (both self-closing and opening/closing pairs) and newlines
        cleaned_content := regexp_replace(COALESCE(NEW.content, ''), '<metric[^>]*(?:/>|>.*?</metric>)', '', 'g');
        cleaned_content := regexp_replace(cleaned_content, '\n', '', 'g');
        
        INSERT INTO public.asset_search_v2 (
            asset_id, asset_type, title, additional_text, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'report_file', COALESCE(NEW.name, ''), cleaned_content,
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            title = EXCLUDED.title,
            additional_text = EXCLUDED.additional_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'report_file';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- Create triggers for each table
CREATE TRIGGER sync_chats_text_search
AFTER INSERT OR UPDATE OR DELETE ON chats
FOR EACH ROW EXECUTE FUNCTION sync_chats_to_text_search();

CREATE TRIGGER sync_metric_files_text_search
AFTER INSERT OR UPDATE OR DELETE ON metric_files
FOR EACH ROW EXECUTE FUNCTION sync_metric_files_to_text_search();

CREATE TRIGGER sync_dashboard_files_text_search
AFTER INSERT OR UPDATE OR DELETE ON dashboard_files
FOR EACH ROW EXECUTE FUNCTION sync_dashboard_files_to_text_search();

CREATE TRIGGER sync_report_files_text_search
AFTER INSERT OR UPDATE OR DELETE ON report_files
FOR EACH ROW EXECUTE FUNCTION sync_report_files_to_text_search();

-- Populate existing data into asset_search_v2 table
INSERT INTO public.asset_search_v2 (
    asset_id, asset_type, title, additional_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    c.id, 'chat', COALESCE(c.title, ''),
    (
        SELECT string_agg(COALESCE(m.request_message, ''), E'\n' ORDER BY m.created_at)
        FROM public.messages m
        WHERE m.chat_id = c.id AND m.deleted_at IS NULL AND m.request_message IS NOT NULL AND m.request_message != ''
    ),
    c.organization_id,
    c.created_at, c.updated_at, c.deleted_at
FROM public.chats c
WHERE c.deleted_at IS NULL AND c.title IS NOT NULL AND c.title != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;

INSERT INTO public.asset_search_v2 (
    asset_id, asset_type, title, additional_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'metric_file', COALESCE(name, ''), COALESCE(content ->> 'description', ''),
    organization_id,
    created_at, updated_at, deleted_at
FROM public.metric_files
WHERE deleted_at IS NULL AND name IS NOT NULL AND name != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;

INSERT INTO public.asset_search_v2 (
    asset_id, asset_type, title, additional_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'dashboard_file', COALESCE(name, ''), COALESCE(content ->> 'description', ''),
    organization_id,
    created_at, updated_at, deleted_at
FROM public.dashboard_files
WHERE deleted_at IS NULL AND name IS NOT NULL AND name != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;

INSERT INTO public.asset_search_v2 (
    asset_id, asset_type, title, additional_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'report_file', COALESCE(name, ''),
    regexp_replace(regexp_replace(COALESCE(content, ''), '<metric[^>]*(?:/>|>.*?</metric>)', '', 'g'), '\n', '', 'g'),
    organization_id,
    created_at, updated_at, deleted_at
FROM public.report_files
WHERE deleted_at IS NULL AND name IS NOT NULL AND name != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;
