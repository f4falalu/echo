-- Custom SQL migration file, put your code below! --

-- Function to populate metric_files_to_report_files table from existing report content
-- Extracts metric IDs from report content and creates relationships

-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS populate_metric_files_to_report_files();

-- Create the function with VOID return type
CREATE FUNCTION populate_metric_files_to_report_files()
RETURNS VOID AS $$
BEGIN
    -- Use CTE to extract all metric IDs from report content first
    INSERT INTO metric_files_to_report_files (
        metric_file_id,
        report_file_id,
        created_at,
        updated_at,
        deleted_at,
        created_by
    )
    WITH extracted_metrics AS (
        SELECT DISTINCT
            rf.id AS report_file_id,
            rf.created_by,
            (regexp_matches(rf.content, '<metric[^>]*metricId="([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"[^>]*>', 'g'))[1]::UUID AS metric_file_id
        FROM report_files rf
        WHERE rf.deleted_at IS NULL
            AND rf.content ~ '<metric[^>]*metricId="[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"[^>]*>'
    )
    SELECT 
        em.metric_file_id,
        em.report_file_id,
        CURRENT_TIMESTAMP AS created_at,
        CURRENT_TIMESTAMP AS updated_at,
        NULL AS deleted_at,
        em.created_by
    FROM extracted_metrics em
    WHERE EXISTS (
        SELECT 1 
        FROM metric_files mf 
        WHERE mf.id = em.metric_file_id
            AND mf.deleted_at IS NULL
    )
    ON CONFLICT (metric_file_id, report_file_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT populate_metric_files_to_report_files();
