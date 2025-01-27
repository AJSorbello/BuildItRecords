-- Rollback missing Spotify fields
BEGIN;

-- Remove fields from tracks table
ALTER TABLE tracks
  DROP COLUMN IF EXISTS external_ids,
  DROP COLUMN IF EXISTS type;

-- Remove fields from albums table
ALTER TABLE albums
  DROP COLUMN IF EXISTS available_markets,
  DROP COLUMN IF EXISTS popularity,
  DROP COLUMN IF EXISTS copyrights;

-- Drop album_artists table and its indexes
DROP TABLE IF EXISTS album_artists;

COMMIT;
