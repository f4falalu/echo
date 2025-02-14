-- Your SQL goes here
-- Rename existing threads table to threads_deprecated
ALTER TABLE threads RENAME TO threads_deprecated;

-- Create new threads table with updated schema
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id)
);

-- Create indexes for common query patterns
CREATE INDEX threads_organization_id_idx ON threads(organization_id);
CREATE INDEX threads_created_by_idx ON threads(created_by);
CREATE INDEX threads_created_at_idx ON threads(created_at);
