-- Align our schema more closely with Spotify's API
BEGIN;

-- Add new fields to tracks table
ALTER TABLE tracks 
  ADD COLUMN IF NOT EXISTS explicit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS popularity INTEGER DEFAULT 0;

-- Create albums table if it doesn't exist
CREATE TABLE IF NOT EXISTS albums (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  album_type VARCHAR(20) CHECK (album_type IN ('album', 'single', 'compilation')),
  release_date VARCHAR(20),
  release_date_precision VARCHAR(10) CHECK (release_date_precision IN ('year', 'month', 'day')),
  total_tracks INTEGER DEFAULT 0,
  external_urls JSONB,
  uri VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new fields to albums table
ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS total_tracks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS release_date_precision VARCHAR(10) CHECK (release_date_precision IN ('year', 'month', 'day'));

-- Create a new table for album images
CREATE TABLE IF NOT EXISTS album_images (
  id SERIAL PRIMARY KEY,
  album_id VARCHAR(255) REFERENCES albums(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  height INTEGER,
  width INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_album_images_album_id ON album_images(album_id);
CREATE INDEX IF NOT EXISTS idx_albums_album_type ON albums(album_type);
CREATE INDEX IF NOT EXISTS idx_albums_release_date ON albums(release_date);

-- Update comments
COMMENT ON COLUMN tracks.explicit IS 'Whether the track has explicit lyrics (from Spotify)';
COMMENT ON COLUMN tracks.popularity IS 'Track popularity from 0-100 (from Spotify)';
COMMENT ON COLUMN albums.total_tracks IS 'Total number of tracks in album (from Spotify)';
COMMENT ON COLUMN albums.release_date_precision IS 'Precision of release_date: year, month, or day (from Spotify)';
COMMENT ON COLUMN albums.album_type IS 'Type of album: album, single, or compilation (from Spotify)';

COMMIT;
