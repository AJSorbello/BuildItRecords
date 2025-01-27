-- Revert track title back to name to match Spotify's schema
BEGIN;

-- First, rename the title column back to name
ALTER TABLE tracks RENAME COLUMN title TO name;

-- Add comment to document the change
COMMENT ON COLUMN tracks.name IS 'Track name from Spotify API';
COMMENT ON COLUMN tracks.duration IS 'Track duration in milliseconds from Spotify API';

-- Update any views or functions that might reference these columns
DROP VIEW IF EXISTS v_tracks_with_artists;
CREATE VIEW v_tracks_with_artists AS
SELECT 
    t.id,
    t.name,
    t.duration,
    t.preview_url,
    t.spotify_url,
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

COMMIT;
