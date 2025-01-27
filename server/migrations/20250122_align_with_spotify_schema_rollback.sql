-- Rollback changes that aligned with Spotify's schema
BEGIN;

-- Remove new columns from tracks
ALTER TABLE tracks 
  DROP COLUMN IF EXISTS explicit,
  DROP COLUMN IF EXISTS popularity;

-- Drop album images table first (due to foreign key)
DROP TABLE IF EXISTS album_images;

-- Drop albums table
DROP TABLE IF EXISTS albums;

COMMIT;
