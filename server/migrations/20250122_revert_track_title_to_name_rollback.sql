-- Rollback script for reverting track name changes
BEGIN;

-- Revert the name column back to title
ALTER TABLE tracks RENAME COLUMN name TO title;

-- Remove comments
COMMENT ON COLUMN tracks.title IS NULL;
COMMENT ON COLUMN tracks.duration IS NULL;

-- Drop and recreate view with old column names
DROP VIEW IF EXISTS v_tracks_with_artists;
CREATE VIEW v_tracks_with_artists AS
SELECT 
    t.id,
    t.title,
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
