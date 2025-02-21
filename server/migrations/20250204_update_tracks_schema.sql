BEGIN;

-- Add new columns for Spotify integration in tracks
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_uri VARCHAR(255);
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS external_urls JSONB DEFAULT '{}';
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS explicit BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS popularity INTEGER;

-- Add new columns for Spotify integration in releases
ALTER TABLE releases ADD COLUMN IF NOT EXISTS spotify_uri VARCHAR(255);
ALTER TABLE releases ADD COLUMN IF NOT EXISTS external_urls JSONB DEFAULT '{}';
ALTER TABLE releases ADD COLUMN IF NOT EXISTS total_tracks INTEGER;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE releases ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

COMMIT;
