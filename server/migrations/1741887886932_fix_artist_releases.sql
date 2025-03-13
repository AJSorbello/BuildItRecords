-- Combined SQL migration for artist-releases fix

-- From create-exec-sql-function.sql
-- Create a function to execute arbitrary SQL queries (requires admin privileges)
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TEXT AS $$
BEGIN
  EXECUTE query;
  RETURN 'SQL executed successfully';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error executing SQL: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- From create-helper-functions.sql
-- Create a function to check if a column exists in a table
CREATE OR REPLACE FUNCTION column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = column_exists.table_name
    AND column_name = column_exists.column_name;
    
  RETURN column_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a function exists
CREATE OR REPLACE FUNCTION function_exists(function_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = function_exists.function_name;
    
  RETURN function_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create a function to rebuild the release_artists relationship
CREATE OR REPLACE FUNCTION rebuild_release_artists()
RETURNS INTEGER AS $$
DECLARE
  insert_count INTEGER;
BEGIN
  -- Make sure the release_artists table exists
  CREATE TABLE IF NOT EXISTS release_artists (
    id SERIAL PRIMARY KEY,
    release_id TEXT NOT NULL,
    artist_id TEXT NOT NULL,
    role TEXT DEFAULT 'performer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(release_id, artist_id)
  );
  
  -- Clear existing data
  DELETE FROM release_artists;
  
  -- Attempt to populate from primary_artist_id if it exists
  BEGIN
    INSERT INTO release_artists (release_id, artist_id, role)
    SELECT id, primary_artist_id, 'primary' 
    FROM releases 
    WHERE primary_artist_id IS NOT NULL;
  EXCEPTION WHEN undefined_column THEN
    -- primary_artist_id doesn't exist, that's ok
    NULL;
  END;
  
  -- Manually associate releases with artists based on naming patterns
  INSERT INTO release_artists (release_id, artist_id, role)
  SELECT r.id, a.id, 'performer'
  FROM releases r
  CROSS JOIN artists a
  WHERE 
    -- Release title contains artist name
    r.title ILIKE '%' || a.name || '%'
    -- Avoid self-references with Various Artists
    AND a.name != 'Various Artists'
    -- Avoid duplicates
    AND NOT EXISTS (
      SELECT 1 FROM release_artists ra 
      WHERE ra.release_id = r.id AND ra.artist_id = a.id
    );
  
  -- Count how many records were inserted
  GET DIAGNOSTICS insert_count = ROW_COUNT;
  
  RETURN insert_count;
END;
$$ LANGUAGE plpgsql;

-- Create get_artist_releases function that will work with multiple approaches
CREATE OR REPLACE FUNCTION get_artist_releases(artist_id_param TEXT)
RETURNS SETOF releases AS $$
DECLARE
  has_join_table BOOLEAN;
  has_join_records BOOLEAN;
  join_count INTEGER;
BEGIN
  -- Check if the join table exists and has records for this artist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'release_artists'
  ) INTO has_join_table;
  
  -- If join table exists, check if it has records for this artist
  IF has_join_table THEN
    SELECT COUNT(*) INTO join_count 
    FROM release_artists 
    WHERE artist_id = artist_id_param;
    
    has_join_records := join_count > 0;
  ELSE
    has_join_records := FALSE;
  END IF;
  
  -- APPROACH 1: Use join table if it exists and has records
  IF has_join_table AND has_join_records THEN
    -- Return releases via the join table
    RETURN QUERY
      SELECT r.* 
      FROM releases r
      JOIN release_artists ra ON r.id = ra.release_id
      WHERE ra.artist_id = artist_id_param
      ORDER BY r.created_at DESC;
    RETURN;
  END IF;
  
  -- APPROACH 2: Check if artist_id exists in releases table
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'releases' 
      AND column_name = 'artist_id'
  ) THEN
    -- Try direct artist_id reference
    RETURN QUERY
      SELECT * FROM releases 
      WHERE artist_id = artist_id_param
      ORDER BY created_at DESC;
    
    -- If found records, return
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- APPROACH 3: Check if primary_artist_id exists in releases table
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'releases' 
      AND column_name = 'primary_artist_id'
  ) THEN
    -- Try primary_artist_id reference
    RETURN QUERY
      SELECT * FROM releases 
      WHERE primary_artist_id = artist_id_param
      ORDER BY created_at DESC;
    
    -- If found records, return
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- APPROACH 4: Get artist name and search in release titles
  DECLARE
    artist_name TEXT;
  BEGIN
    SELECT name INTO artist_name 
    FROM artists 
    WHERE id = artist_id_param;
    
    IF artist_name IS NOT NULL AND LENGTH(artist_name) > 2 THEN
      -- Search for releases with titles containing artist name
      RETURN QUERY
        SELECT * FROM releases 
        WHERE title ILIKE '%' || artist_name || '%'
        ORDER BY created_at DESC;
        
      -- If found records, return
      IF FOUND THEN
        RETURN;
      END IF;
    END IF;
  END;
  
  -- APPROACH 5: Try to find releases from the same label
  DECLARE
    artist_label_id TEXT;
  BEGIN
    SELECT label_id INTO artist_label_id 
    FROM artists 
    WHERE id = artist_id_param;
    
    IF artist_label_id IS NOT NULL THEN
      -- Search for releases from the same label
      RETURN QUERY
        SELECT * FROM releases 
        WHERE label_id = artist_label_id
        ORDER BY created_at DESC
        LIMIT 10;
        
      -- If found records, return
      IF FOUND THEN
        RETURN;
      END IF;
    END IF;
  END;
  
  -- APPROACH 6: Last resort, just return some recent releases
  RETURN QUERY
    SELECT * FROM releases
    ORDER BY created_at DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;


-- From create-artist-releases-function.sql
-- Create a function to fetch artist releases without the JSON object error
CREATE OR REPLACE FUNCTION get_artist_releases(artist_id_param TEXT)
RETURNS SETOF releases AS $$
BEGIN
  -- First try to get releases via the release_artists join table
  RETURN QUERY
    SELECT r.* 
    FROM releases r
    JOIN release_artists ra ON r.id = ra.release_id
    WHERE ra.artist_id = artist_id_param
    ORDER BY r.release_date DESC NULLS LAST;
  
  -- If no results, try direct artist_id lookup (will only execute if the above returns nothing)
  IF NOT FOUND THEN
    RETURN QUERY
      SELECT * FROM releases 
      WHERE artist_id = artist_id_param
      ORDER BY release_date DESC NULLS LAST;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- You can execute this in your Supabase SQL editor or using pgAdmin
-- After creating this function, it will be available via the .rpc() method in the Supabase client


-- From populate-release-artists.sql
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


