-- Make our schema exactly match Spotify's API
BEGIN;

-- Update tracks table
ALTER TABLE tracks
  RENAME COLUMN duration TO duration_ms;

-- Set default values for existing null fields
UPDATE tracks 
  SET disc_number = 1 
  WHERE disc_number IS NULL;

UPDATE tracks 
  SET track_number = 1 
  WHERE track_number IS NULL;

-- Now we can safely add NOT NULL constraints
ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS href TEXT,
  ADD COLUMN IF NOT EXISTS is_playable BOOLEAN,
  ADD COLUMN IF NOT EXISTS linked_from JSONB,
  ADD COLUMN IF NOT EXISTS restrictions JSONB,
  ALTER COLUMN track_number SET NOT NULL,
  ALTER COLUMN disc_number SET NOT NULL,
  ALTER COLUMN disc_number SET DEFAULT 1;

-- Update albums table
ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS href TEXT,
  ADD COLUMN IF NOT EXISTS restrictions JSONB;

-- Add comments
COMMENT ON COLUMN tracks.duration_ms IS 'Track length in milliseconds (from Spotify)';
COMMENT ON COLUMN tracks.href IS 'A link to the Web API endpoint providing full details of the track';
COMMENT ON COLUMN tracks.is_playable IS 'Whether the track is playable in the given market';
COMMENT ON COLUMN tracks.linked_from IS 'Original track info when track relinking is applied';
COMMENT ON COLUMN tracks.restrictions IS 'Restrictions applied to the track (market, product, explicit)';
COMMENT ON COLUMN albums.href IS 'A link to the Web API endpoint providing full details of the album';
COMMENT ON COLUMN albums.restrictions IS 'Restrictions applied to the album (market, product, explicit)';

COMMIT;
