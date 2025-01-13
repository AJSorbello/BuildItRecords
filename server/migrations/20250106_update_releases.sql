-- Update releases table
BEGIN;

-- Rename cover_image to artwork_url
ALTER TABLE releases RENAME COLUMN cover_image TO artwork_url;

-- Make release_date nullable
ALTER TABLE releases ALTER COLUMN release_date DROP NOT NULL;

-- Drop record_label column
ALTER TABLE releases DROP COLUMN IF EXISTS record_label;

-- Rename title to name if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'releases' AND column_name = 'title') THEN
        ALTER TABLE releases RENAME COLUMN title TO name;
    END IF;
END $$;

COMMIT;
