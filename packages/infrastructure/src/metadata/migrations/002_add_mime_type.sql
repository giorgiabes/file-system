-- Add mime_type column to fs_nodes
ALTER TABLE fs_nodes 
ADD COLUMN mime_type VARCHAR(255);

-- Set default for existing files
UPDATE fs_nodes 
SET mime_type = 'application/octet-stream' 
WHERE type = 'file' AND mime_type IS NULL;
