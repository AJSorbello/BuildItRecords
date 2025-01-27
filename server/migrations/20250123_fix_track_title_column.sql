-- Align track schema with Spotify API
BEGIN;

-- Rename duration to duration_ms to match Spotify
ALTER TABLE tracks RENAME COLUMN duration TO duration_ms;

-- Add missing Spotify fields
ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS explicit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS popularity INTEGER,
  ADD COLUMN IF NOT EXISTS href TEXT,
  ADD COLUMN IF NOT EXISTS uri TEXT,
  ADD COLUMN IF NOT EXISTS external_urls JSONB,
  ADD COLUMN IF NOT EXISTS external_ids JSONB,
  ADD COLUMN IF NOT EXISTS is_playable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS restrictions JSONB,
  ADD COLUMN IF NOT EXISTS track_number INTEGER,
  ADD COLUMN IF NOT EXISTS disc_number INTEGER;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_tracks_name ON tracks(name);
CREATE INDEX IF NOT EXISTS idx_tracks_popularity ON tracks(popularity);
CREATE INDEX IF NOT EXISTS idx_tracks_explicit ON tracks(explicit);

-- Drop and recreate view with new column names
DROP VIEW IF EXISTS v_tracks_with_artists;
CREATE VIEW v_tracks_with_artists AS
SELECT 
    t.id,
    t.name,
    t.duration_ms,
    t.track_number,
    t.disc_number,
    t.preview_url,
    t.spotify_url,
    t.explicit,
    t.popularity,
    t.href,
    t.uri,
    t.external_urls,
    t.external_ids,
    t.is_playable,
    t.restrictions,
    t.release_id,
    t.label_id,
    t.created_at,
    t.updated_at,
    json_agg(DISTINCT jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'type', 'artist',
        'spotify_url', a.spotify_url
    )) as artists
FROM tracks t
LEFT JOIN track_artists ta ON t.id = ta.track_id
LEFT JOIN artists a ON ta.artist_id = a.id
GROUP BY t.id;

-- Add helpful comments
COMMENT ON COLUMN tracks.name IS 'The name of the track (from Spotify)';
COMMENT ON COLUMN tracks.duration_ms IS 'Track length in milliseconds (from Spotify)';
COMMENT ON COLUMN tracks.track_number IS 'The number of the track on its album';
COMMENT ON COLUMN tracks.disc_number IS 'The disc number (usually 1 unless album has multiple discs)';
COMMENT ON COLUMN tracks.explicit IS 'Whether the track has explicit lyrics';
COMMENT ON COLUMN tracks.popularity IS 'Track popularity from 0-100 (from Spotify)';
COMMENT ON COLUMN tracks.href IS 'Link to the Spotify Web API endpoint for this track';
COMMENT ON COLUMN tracks.uri IS 'The Spotify URI for the track';
COMMENT ON COLUMN tracks.external_urls IS 'Known external URLs for this track';
COMMENT ON COLUMN tracks.external_ids IS 'Known external IDs (isrc, ean, upc)';
COMMENT ON COLUMN tracks.is_playable IS 'Whether the track is playable in the given market';
COMMENT ON COLUMN tracks.restrictions IS 'Content restrictions (market, product, explicit)';

COMMIT;
