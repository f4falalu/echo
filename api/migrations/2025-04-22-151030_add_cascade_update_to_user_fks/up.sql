-- Your SQL goes here

-- Function to safely drop and add foreign key constraints
-- We need this because constraint names might vary slightly depending on how they were created
-- or if they were manually named. This function finds the constraint by table and column.
CREATE OR REPLACE FUNCTION alter_fk_on_update(
    p_table_name TEXT,
    p_column_name TEXT,
    p_foreign_table_name TEXT,
    p_foreign_column_name TEXT,
    p_on_update_action TEXT -- 'CASCADE' or 'NO ACTION'
)
RETURNS VOID AS $$
DECLARE
    v_constraint_name TEXT;
BEGIN
    -- Find the existing constraint name
    SELECT conname
    INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = p_table_name::regclass
      AND conname LIKE p_table_name || '_' || p_column_name || '_fkey%' -- Handle potential suffix variations
      AND confrelid = p_foreign_table_name::regclass
      AND contype = 'f'
      AND p_column_name = ANY(SELECT attname FROM pg_attribute WHERE attrelid = conrelid AND attnum = ANY(conkey))
    LIMIT 1;

    -- If constraint exists, drop it
    IF v_constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE ' || quote_ident(p_table_name) || ' DROP CONSTRAINT ' || quote_ident(v_constraint_name);
    END IF;

    -- Add the new constraint with the specified ON UPDATE action
    EXECUTE 'ALTER TABLE ' || quote_ident(p_table_name) ||
            ' ADD CONSTRAINT ' || quote_ident(p_table_name || '_' || p_column_name || '_fkey') ||
            ' FOREIGN KEY (' || quote_ident(p_column_name) || ')' ||
            ' REFERENCES ' || quote_ident(p_foreign_table_name) || '(' || quote_ident(p_foreign_column_name) || ')' ||
            ' ON UPDATE ' || p_on_update_action || ' ON DELETE NO ACTION'; -- Assuming default ON DELETE NO ACTION
END;
$$ LANGUAGE plpgsql;

-- Apply ON UPDATE CASCADE to all identified foreign keys referencing users.id
SELECT alter_fk_on_update('api_keys', 'owner_id', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('asset_permissions', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('asset_permissions', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('chats', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('chats', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('chats', 'publicly_enabled_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('collections', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('collections', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('collections_to_assets', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('collections_to_assets', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('dashboard_files', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('dashboard_files', 'publicly_enabled_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('dashboards', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('dashboards', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('data_sources', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('data_sources', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('datasets', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('datasets', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('messages', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('messages_deprecated', 'sent_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('metric_files', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('metric_files', 'publicly_enabled_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('metric_files_to_dashboard_files', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('permission_groups', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('permission_groups', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('permission_groups_to_identities', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('permission_groups_to_identities', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('permission_groups_to_users', 'user_id', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('teams', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('teams_to_users', 'user_id', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('terms', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('terms', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('threads_deprecated', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('threads_deprecated', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('threads_deprecated', 'publicly_enabled_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('threads_to_dashboards', 'added_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('user_favorites', 'user_id', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('users_to_organizations', 'user_id', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('users_to_organizations', 'created_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('users_to_organizations', 'updated_by', 'users', 'id', 'CASCADE');
SELECT alter_fk_on_update('users_to_organizations', 'deleted_by', 'users', 'id', 'CASCADE');

-- Drop the helper function
DROP FUNCTION alter_fk_on_update(TEXT, TEXT, TEXT, TEXT, TEXT);
