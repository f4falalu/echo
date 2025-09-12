-- Simple optimization for report_files table - 80/20 solution

-- ============================================
-- 1. Add better index for the exact query pattern used
-- ============================================
-- The modify-reports-delta.ts does: WHERE id = ? AND deleted_at IS NULL
-- This composite index will make that exact query much faster
CREATE INDEX IF NOT EXISTS report_files_id_active_idx 
ON report_files(id) 
WHERE deleted_at IS NULL;

-- ============================================
-- 2. Add index for version_history JSONB queries
-- ============================================
-- Since we frequently access version_history to get version numbers
CREATE INDEX IF NOT EXISTS report_files_version_history_gin_idx 
ON report_files USING GIN (version_history);

-- ============================================
-- 3. Optimize the UPDATE pattern
-- ============================================
-- Create composite index for the UPDATE WHERE clause
CREATE INDEX IF NOT EXISTS report_files_id_deleted_at_idx 
ON report_files(id, deleted_at);

-- ============================================
-- 4. Add index for recent updates tracking
-- ============================================
-- Helps with finding recently modified reports
CREATE INDEX IF NOT EXISTS report_files_updated_at_idx 
ON report_files(updated_at DESC);

-- ============================================
-- 5. Optimize organization-based queries
-- ============================================
-- Many queries filter by org_id AND deleted_at
CREATE INDEX IF NOT EXISTS report_files_org_id_deleted_at_idx 
ON report_files(organization_id, deleted_at);

-- ============================================
-- 6. Update table statistics for query planner
-- ============================================
ANALYZE report_files;