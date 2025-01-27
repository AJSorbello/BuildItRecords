-- Add missing Spotify fields to our schema
BEGIN;

-- Add missing fields to tracks table
ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS external_ids JSONB,
  ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'track';

-- Add missing fields to albums table
ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS available_markets TEXT[],
  ADD COLUMN IF NOT EXISTS popularity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS copyrights JSONB;

-- Create album_artists join table if it doesn't exist
CREATE TABLE IF NOT EXISTS album_artists (
  album_id VARCHAR(255) REFERENCES albums(id) ON DELETE CASCADE,
  artist_id VARCHAR(255) REFERENCES artists(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (album_id, artist_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_type ON tracks(type);
CREATE INDEX IF NOT EXISTS idx_tracks_popularity ON tracks(popularity);
CREATE INDEX IF NOT EXISTS idx_albums_popularity ON albums(popularity);
CREATE INDEX IF NOT EXISTS idx_album_artists_artist_id ON album_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_album_artists_album_id ON album_artists(album_id);

-- Add comments
COMMENT ON COLUMN tracks.external_ids IS 'External IDs from Spotify (isrc, ean, upc)';
COMMENT ON COLUMN tracks.type IS 'Object type from Spotify (always track)';
COMMENT ON COLUMN albums.available_markets IS 'Markets where the album is available';
COMMENT ON COLUMN albums.popularity IS 'Album popularity from 0-100 (from Spotify)';
COMMENT ON COLUMN albums.copyrights IS 'Copyright information from Spotify';
COMMENT ON TABLE album_artists IS 'Join table for album-artist relationships';

COMMIT;
