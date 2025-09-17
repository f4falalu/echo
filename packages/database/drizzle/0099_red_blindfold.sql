-- Custom SQL migration file, put your code below! --

-- Add the 'message' value to asset_type_enum if it doesn't exist
-- This needs to be done first and committed before it can be used
-- Function for chats table

-- Commit the current transaction so the enum value addition in migration 0098_blue_blacklash.sql is committed
COMMIT;
BEGIN;

CREATE OR REPLACE FUNCTION sync_chats_to_text_search()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.text_search (
            asset_id, asset_type, searchable_text, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'chat', COALESCE(NEW.title, ''),
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            searchable_text = EXCLUDED.searchable_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.text_search
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
        INSERT INTO public.text_search (
            asset_id, asset_type, searchable_text, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'metric_file', COALESCE(NEW.name, ''),
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            searchable_text = EXCLUDED.searchable_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.text_search
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
        INSERT INTO public.text_search (
            asset_id, asset_type, searchable_text, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'dashboard_file', COALESCE(NEW.name, ''),
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            searchable_text = EXCLUDED.searchable_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.text_search
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'dashboard_file';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for report_files table
CREATE OR REPLACE FUNCTION sync_report_files_to_text_search()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.text_search (
            asset_id, asset_type, searchable_text, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'report_file', COALESCE(NEW.name, ''),
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            searchable_text = EXCLUDED.searchable_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.text_search
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'report_file';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for messages table
CREATE OR REPLACE FUNCTION sync_messages_to_text_search()
RETURNS TRIGGER AS $$
DECLARE
    org_id uuid;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Get organization_id from the chats table
        SELECT organization_id INTO org_id
        FROM public.chats 
        WHERE id = NEW.chat_id;
        
        -- Only proceed if we found the organization_id
        IF org_id IS NOT NULL THEN
            INSERT INTO public.text_search (
                asset_id, asset_type, searchable_text, organization_id,
                created_at, updated_at, deleted_at
            )
        VALUES (
            NEW.id, 'message', COALESCE(NEW.request_message, ''),
            org_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
            ON CONFLICT (asset_id, asset_type) DO UPDATE SET
                searchable_text = EXCLUDED.searchable_text,
                updated_at = EXCLUDED.updated_at,
                deleted_at = EXCLUDED.deleted_at;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.text_search
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'message';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_chats_text_search ON chats;
DROP TRIGGER IF EXISTS sync_metric_files_text_search ON metric_files;
DROP TRIGGER IF EXISTS sync_dashboard_files_text_search ON dashboard_files;
DROP TRIGGER IF EXISTS sync_report_files_text_search ON report_files;
DROP TRIGGER IF EXISTS sync_messages_text_search ON messages;

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

CREATE TRIGGER sync_messages_text_search
AFTER INSERT OR UPDATE OR DELETE ON messages
FOR EACH ROW EXECUTE FUNCTION sync_messages_to_text_search();

-- Populate existing data into text_search table
INSERT INTO public.text_search (
    asset_id, asset_type, searchable_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'chat', COALESCE(title, ''),
    organization_id,
    created_at, updated_at, deleted_at
FROM public.chats
WHERE deleted_at IS NULL AND title IS NOT NULL AND title != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;

INSERT INTO public.text_search (
    asset_id, asset_type, searchable_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'metric_file', COALESCE(name, ''),
    organization_id,
    created_at, updated_at, deleted_at
FROM public.metric_files
WHERE deleted_at IS NULL AND name IS NOT NULL AND name != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;

INSERT INTO public.text_search (
    asset_id, asset_type, searchable_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'dashboard_file', COALESCE(name, ''),
    organization_id,
    created_at, updated_at, deleted_at
FROM public.dashboard_files
WHERE deleted_at IS NULL AND name IS NOT NULL AND name != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;

INSERT INTO public.text_search (
    asset_id, asset_type, searchable_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'report_file', COALESCE(name, ''),
    organization_id,
    created_at, updated_at, deleted_at
FROM public.report_files
WHERE deleted_at IS NULL AND name IS NOT NULL AND name != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;

INSERT INTO public.text_search (
    asset_id, asset_type, searchable_text, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    m.id, 'message', COALESCE(m.request_message, ''),
    c.organization_id,
    m.created_at, m.updated_at, m.deleted_at
FROM public.messages m
JOIN public.chats c ON m.chat_id = c.id
WHERE m.deleted_at IS NULL AND m.request_message IS NOT NULL AND m.request_message != ''
ON CONFLICT (asset_id, asset_type) DO NOTHING;
