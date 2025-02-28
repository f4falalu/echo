-- This file should undo anything in `up.sql`

-- Remove any secrets that have IDs matching data source IDs
DELETE FROM vault.secrets 
WHERE id IN (SELECT id FROM public.data_sources);

-- Note: This assumes you have another way to access the original secrets if needed.
-- Since we didn't modify the secret_id in data_sources, those references still work.
