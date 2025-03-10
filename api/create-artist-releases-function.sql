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
