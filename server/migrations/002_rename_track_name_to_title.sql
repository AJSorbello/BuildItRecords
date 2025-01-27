BEGIN;

-- Drop the index on the name column
DROP INDEX IF EXISTS idx_tracks_name;

-- Rename the name column to title
ALTER TABLE tracks RENAME COLUMN name TO title;

-- Create a new index on the title column
CREATE INDEX idx_tracks_title ON tracks(title);

COMMIT;
