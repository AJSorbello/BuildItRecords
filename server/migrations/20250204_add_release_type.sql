-- Add release_type column to releases table
ALTER TABLE releases ADD COLUMN IF NOT EXISTS release_type VARCHAR(50);

-- Create index for release_type
CREATE INDEX IF NOT EXISTS idx_releases_type ON releases(release_type);

-- Update existing releases to have a default type
UPDATE releases SET release_type = 'album' WHERE release_type IS NULL;
