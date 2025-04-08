-- Your SQL goes here

ALTER TABLE metric_files
ADD COLUMN public_password TEXT;

ALTER TABLE dashboard_files
ADD COLUMN public_password TEXT;
