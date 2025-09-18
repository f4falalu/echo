-- Custom SQL migration file, put your code below! --

-- Migration to update file_type values in the reasoning JSONB column
-- This migration updates the following mappings in the reasoning column:
-- 'metric' -> 'metric_file'
-- 'dashboard' -> 'dashboard_file' 
-- 'report' -> 'report_file'

DO $$
BEGIN
    RAISE NOTICE 'Updating messages.reasoning JSONB file_type values...';
    
    UPDATE public.messages 
    SET reasoning = (
        SELECT jsonb_agg(
            CASE 
                WHEN reasoning_item ? 'files' THEN
                    -- Handle the files object structure
                    jsonb_set(
                        reasoning_item,
                        '{files}',
                        (
                            SELECT jsonb_object_agg(
                                file_key,
                                CASE 
                                    WHEN file_value->>'file_type' = 'metric' THEN
                                        jsonb_set(file_value, '{file_type}', '"metric_file"')
                                    WHEN file_value->>'file_type' = 'dashboard' THEN
                                        jsonb_set(file_value, '{file_type}', '"dashboard_file"')
                                    WHEN file_value->>'file_type' = 'report' THEN
                                        jsonb_set(file_value, '{file_type}', '"report_file"')
                                    ELSE file_value
                                END
                            )
                            FROM jsonb_each(reasoning_item->'files') AS files_obj(file_key, file_value)
                        )
                    )
                WHEN reasoning_item ? 'file_type' THEN
                    -- Handle direct file_type field
                    CASE 
                        WHEN reasoning_item->>'file_type' = 'metric' THEN
                            jsonb_set(reasoning_item, '{file_type}', '"metric_file"')
                        WHEN reasoning_item->>'file_type' = 'dashboard' THEN
                            jsonb_set(reasoning_item, '{file_type}', '"dashboard_file"')
                        WHEN reasoning_item->>'file_type' = 'report' THEN
                            jsonb_set(reasoning_item, '{file_type}', '"report_file"')
                        ELSE reasoning_item
                    END
                ELSE reasoning_item
            END
        )
        FROM jsonb_array_elements(reasoning) AS reasoning_item
    )
    WHERE jsonb_typeof(reasoning) = 'array' 
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(reasoning) AS reasoning_item
        WHERE (
            -- Check for file_type in files object
            reasoning_item ? 'files' 
            AND EXISTS (
                SELECT 1 
                FROM jsonb_each(reasoning_item->'files') AS files_obj(file_key, file_value)
                WHERE file_value->>'file_type' IN ('metric', 'dashboard', 'report')
            )
        )
        OR (
            -- Check for direct file_type field
            reasoning_item ? 'file_type' 
            AND reasoning_item->>'file_type' IN ('metric', 'dashboard', 'report')
        )
    )
    AND deleted_at IS NULL;
    
    RAISE NOTICE 'Reasoning column file_type migration completed successfully!';
END $$;