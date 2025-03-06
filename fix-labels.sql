-- SQL script to fix label associations in Supabase
-- Run this in the Supabase SQL Editor

-- Check if label_id column exists for artists table, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name='artists' AND column_name='label_id'
  ) THEN
    ALTER TABLE artists ADD COLUMN label_id VARCHAR(255);
  END IF;
END $$;

-- Check if label_id column exists for tracks table, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name='tracks' AND column_name='label_id'
  ) THEN
    ALTER TABLE tracks ADD COLUMN label_id VARCHAR(255);
  END IF;
END $$;

-- First ensure all records have the default label (BUILD IT RECORDS)
-- Update all artists to associate with BUILD IT RECORDS (ID: 1)
UPDATE artists
SET label_id = '1'
WHERE label_id IS NULL OR label_id = '';

-- Update all tracks to associate with BUILD IT RECORDS (ID: 1)
UPDATE tracks
SET label_id = '1'
WHERE label_id IS NULL OR label_id = '';

-- Associate artists with specific labels based on name patterns
-- BUILD IT TECH artists
UPDATE artists
SET label_id = '2'  -- BUILD IT TECH
WHERE 
  (name ILIKE '%tech%' OR name ILIKE '%technology%')
  AND (label_id = '1' OR label_id IS NULL OR label_id = '');

-- BUILD IT DEEP artists
UPDATE artists
SET label_id = '3'  -- BUILD IT DEEP
WHERE 
  (name ILIKE '%deep%')
  AND (label_id = '1' OR label_id IS NULL OR label_id = '');

-- Associate tracks with specific labels based on title patterns
-- BUILD IT TECH tracks
UPDATE tracks
SET label_id = '2'  -- BUILD IT TECH
WHERE 
  (title ILIKE '%tech%' OR title ILIKE '%technology%')
  AND (label_id = '1' OR label_id IS NULL OR label_id = '');

-- BUILD IT DEEP tracks
UPDATE tracks
SET label_id = '3'  -- BUILD IT DEEP
WHERE 
  (title ILIKE '%deep%')
  AND (label_id = '1' OR label_id IS NULL OR label_id = '');

-- Verify updates
SELECT 'Artists' as type, label_id, COUNT(*) as count
FROM artists
GROUP BY label_id
UNION ALL
SELECT 'Tracks' as type, label_id, COUNT(*) as count
FROM tracks
GROUP BY label_id;

-- Check if we need to fix any other database tables
-- Check if albums table exists and has label_id
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'albums'
  ) THEN
    -- Add label_id column to albums if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'albums' AND column_name = 'label_id'
    ) THEN
      ALTER TABLE albums ADD COLUMN label_id VARCHAR(255);
    END IF;
    
    -- Update all albums with default label
    UPDATE albums
    SET label_id = '1'
    WHERE label_id IS NULL OR label_id = '';
    
    -- Update albums with BUILD IT TECH label
    UPDATE albums
    SET label_id = '2'
    WHERE 
      (name ILIKE '%tech%' OR name ILIKE '%technology%')
      AND (label_id = '1' OR label_id IS NULL OR label_id = '');
    
    -- Update albums with BUILD IT DEEP label
    UPDATE albums
    SET label_id = '3'
    WHERE 
      (name ILIKE '%deep%')
      AND (label_id = '1' OR label_id IS NULL OR label_id = '');
    
    -- Show album counts
    SELECT 'Albums' as type, label_id, COUNT(*) as count
    FROM albums
    GROUP BY label_id;
  END IF;
END $$;
