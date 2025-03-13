-- Script to populate the release_artists join table with data from primary_artist_id
-- This fixes the issue of artist releases not being correctly associated with artists

-- First check how many releases have primary_artist_id set
SELECT COUNT(*) FROM releases WHERE primary_artist_id IS NOT NULL;

-- Check if any relationships already exist in release_artists
SELECT COUNT(*) FROM release_artists;

-- Insert records into release_artists where they don't already exist
INSERT INTO release_artists (release_id, artist_id, role)
SELECT r.id, r.primary_artist_id, 'primary'
FROM releases r
WHERE r.primary_artist_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM release_artists ra 
  WHERE ra.release_id = r.id AND ra.artist_id = r.primary_artist_id
);

-- Now show how many records were inserted
SELECT COUNT(*) FROM release_artists;

-- Verify with sample data
SELECT r.title, a.name 
FROM release_artists ra
JOIN releases r ON ra.release_id = r.id
JOIN artists a ON ra.artist_id = a.id
LIMIT 10;
