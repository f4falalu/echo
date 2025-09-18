-- Custom SQL migration file, put your code below! --

-- Migration to fix most_recent_file_type for report files
-- This migration iterates over each row in public.chats and checks if:
-- 1. most_recent_file_type is not empty/null
-- 2. most_recent_file_id exists in public.report_files.id
-- 3. most_recent_file_id doesn't exist in public.dashboard_files.id this is because old logic added as dashboard_file
-- If both conditions are met, update most_recent_file_type to 'report_file'

DO $$
DECLARE
    updated_count INTEGER := 0;
    total_checked INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting migration to fix most_recent_file_type for report files...';
    
    -- Update chats where most_recent_file_id exists in report_files
    UPDATE public.chats 
    SET most_recent_file_type = 'report_file'
    WHERE most_recent_file_type IS NOT NULL 
    AND most_recent_file_type != ''
    AND most_recent_file_id IS NOT NULL
    AND most_recent_file_type != 'report_file'  -- Don't update if already correct
    AND EXISTS (
        SELECT 1 
        FROM public.report_files rf 
        WHERE rf.id = public.chats.most_recent_file_id 
        AND rf.deleted_at IS NULL  -- Only consider non-deleted report files
    )
    AND NOT EXISTS (
        SELECT 1 
        FROM public.dashboard_files df 
        WHERE df.id = public.chats.most_recent_file_id 
    )
    AND deleted_at IS NULL;  -- Only update non-deleted chats
END $$;