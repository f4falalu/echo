-- This file should undo anything in `up.sql`
-- Drop indexes
DROP INDEX threads_organization_id_idx;
DROP INDEX threads_created_by_idx;
DROP INDEX threads_created_at_idx;

-- Drop new threads table
DROP TABLE threads;

-- Rename deprecated table back to threads
ALTER TABLE threads_deprecated RENAME TO threads;
