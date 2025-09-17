-- Custom SQL migration file, put your code below! --

-- Migration to update asset type values and clean up invalid data
-- This migration updates the following mappings:
-- 'metric' -> 'metric_file'
-- 'dashboard' -> 'dashboard_file' 
-- And HARD DELETES any rows with asset types not in the current enum

DO $$
BEGIN
    -- Update user_favorites table
    RAISE NOTICE 'Updating user_favorites table...';
    
    -- Update asset types
    UPDATE user_favorites 
    SET asset_type = 'metric_file' 
    WHERE asset_type = 'metric' AND deleted_at IS NULL;
    
    UPDATE user_favorites 
    SET asset_type = 'dashboard_file' 
    WHERE asset_type = 'dashboard' AND deleted_at IS NULL;

    
    -- Hard delete rows with invalid asset types (not in enum)
    DELETE FROM user_favorites 
    WHERE asset_type NOT IN ('chat', 'metric_file', 'dashboard_file', 'report_file', 'collection');
    

    -- Update collections_to_assets table
    RAISE NOTICE 'Updating collections_to_assets table...';
    
    UPDATE collections_to_assets 
    SET asset_type = 'metric_file' 
    WHERE asset_type = 'metric' AND deleted_at IS NULL;
    
    UPDATE collections_to_assets 
    SET asset_type = 'dashboard_file' 
    WHERE asset_type = 'dashboard' AND deleted_at IS NULL;

    
    -- Hard delete rows with invalid asset types
    DELETE FROM collections_to_assets 
    WHERE asset_type NOT IN ('chat', 'metric_file', 'dashboard_file', 'report_file', 'collection');
    

    -- Update asset_permissions table
    RAISE NOTICE 'Updating asset_permissions table...';
    
    UPDATE asset_permissions 
    SET asset_type = 'metric_file' 
    WHERE asset_type = 'metric' AND deleted_at IS NULL;
    
    UPDATE asset_permissions 
    SET asset_type = 'dashboard_file' 
    WHERE asset_type = 'dashboard' AND deleted_at IS NULL;

    
    -- Hard delete rows with invalid asset types
    DELETE FROM asset_permissions 
    WHERE asset_type NOT IN ('chat', 'metric_file', 'dashboard_file', 'report_file', 'collection');
    

    -- Update text_search table
    RAISE NOTICE 'Updating text_search table...';
    
    UPDATE text_search 
    SET asset_type = 'metric_file' 
    WHERE asset_type = 'metric' AND deleted_at IS NULL;
    
    UPDATE text_search 
    SET asset_type = 'dashboard_file' 
    WHERE asset_type = 'dashboard' AND deleted_at IS NULL;

    
    -- Hard delete rows with invalid asset types
    DELETE FROM text_search 
    WHERE asset_type NOT IN ('chat', 'metric_file', 'dashboard_file', 'report_file', 'collection');
    

    -- Update asset_search table (text field, not enum)
    RAISE NOTICE 'Updating asset_search table...';
    
    UPDATE asset_search 
    SET asset_type = 'metric_file' 
    WHERE asset_type = 'metric';
    
    UPDATE asset_search 
    SET asset_type = 'dashboard_file' 
    WHERE asset_type = 'dashboard';

    
    -- Hard delete rows with invalid asset types
    DELETE FROM asset_search 
    WHERE asset_type NOT IN ('chat', 'metric_file', 'dashboard_file', 'report_file', 'collection');
    

    -- Update chats.most_recent_file_type table (varchar field)
    RAISE NOTICE 'Updating chats.most_recent_file_type field...';
    
    UPDATE chats 
    SET most_recent_file_type = 'metric_file' 
    WHERE most_recent_file_type = 'metric' AND deleted_at IS NULL;
    
    UPDATE chats 
    SET most_recent_file_type = 'dashboard_file' 
    WHERE most_recent_file_type = 'dashboard' AND deleted_at IS NULL;

    
    -- Set invalid file types to NULL (since this is an optional field)
    UPDATE chats 
    SET most_recent_file_type = NULL 
    WHERE most_recent_file_type IS NOT NULL 
    AND most_recent_file_type NOT IN ('chat', 'metric_file', 'dashboard_file', 'report_file', 'collection', 'reasoning') 
    AND deleted_at IS NULL;
    

    -- Update messages.response_messages JSONB column
    RAISE NOTICE 'Updating messages.response_messages JSONB file_type values...';
    
    UPDATE messages 
    SET response_messages = (
        SELECT jsonb_agg(
            CASE 
                WHEN message_item->>'type' = 'file' THEN
                    CASE 
                        WHEN message_item->>'file_type' = 'metric' THEN
                            jsonb_set(message_item, '{file_type}', '"metric_file"')
                        WHEN message_item->>'file_type' = 'dashboard' THEN
                            jsonb_set(message_item, '{file_type}', '"dashboard_file"')
                        WHEN message_item->>'file_type' = 'report' THEN
                            jsonb_set(message_item, '{file_type}', '"report_file"')
                        ELSE message_item
                    END
                ELSE message_item
            END
        )
        FROM jsonb_array_elements(response_messages) AS message_item
    )
    WHERE jsonb_typeof(response_messages) = 'array' 
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(response_messages) AS message_item
        WHERE message_item->>'type' = 'file' 
        AND message_item->>'file_type' IN ('metric', 'dashboard', 'report')
    )
    AND deleted_at IS NULL;
    

    RAISE NOTICE 'Asset type migration completed successfully!';
END $$;