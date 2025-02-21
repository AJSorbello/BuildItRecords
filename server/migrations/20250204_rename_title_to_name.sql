-- Rename title columns to name to match Spotify API
BEGIN;

-- Rename title to name in releases table
ALTER TABLE releases RENAME COLUMN title TO name;
DROP INDEX IF EXISTS idx_releases_title;
CREATE INDEX idx_releases_name ON releases(name);

-- Rename title to name in tracks table
ALTER TABLE tracks RENAME COLUMN title TO name;
DROP INDEX IF EXISTS idx_tracks_title;
CREATE INDEX idx_tracks_name ON tracks(name);

COMMIT;
