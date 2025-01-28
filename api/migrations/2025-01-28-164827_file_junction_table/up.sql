CREATE TABLE messages_to_files (
    id SERIAL PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id),
    file_id UUID NOT NULL, 
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, file_id)
);

-- Index for faster lookups by message_id
CREATE INDEX messages_files_message_id_idx ON messages_to_files(message_id);

-- Add foreign key constraints for file_id to both metric_files and dashboard_files
ALTER TABLE messages_to_files
ADD CONSTRAINT fk_metric_files
FOREIGN KEY (file_id) 
REFERENCES metric_files(id);

ALTER TABLE messages_to_files
ADD CONSTRAINT fk_dashboard_files 
FOREIGN KEY (file_id)
REFERENCES dashboard_files(id);

-- Index for faster lookups by file_id
CREATE INDEX messages_files_file_id_idx ON messages_to_files(file_id);
