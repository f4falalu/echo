-- Your SQL goes here

-- Create secrets in vault with IDs matching data source IDs
-- This allows direct lookup of secrets using the data source ID
INSERT INTO vault.secrets (id, value, created_at, updated_at)
SELECT 
    ds.id, 
    COALESCE(
        (SELECT value FROM vault.secrets WHERE id = ds.secret_id),
        '{}'::jsonb
    ),
    NOW(),
    NOW()
FROM 
    public.data_sources ds
WHERE 
    NOT EXISTS (SELECT 1 FROM vault.secrets WHERE id = ds.id)
ON CONFLICT (id) DO NOTHING;

-- Note: We're not updating the secret_id in data_sources as the application
-- will directly reference data_source.id to lookup secrets

-- Clean up any orphaned secrets that aren't being used anymore
-- Only run this if you want to remove unused secrets
-- DELETE FROM vault.secrets 
-- WHERE id NOT IN (SELECT secret_id FROM public.data_sources WHERE deleted_at IS NULL);
