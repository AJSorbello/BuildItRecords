-- Function to safely retrieve artist releases as an array
-- This avoids the "JSON object requested, multiple rows returned" error
CREATE OR REPLACE FUNCTION select_from_releases_for_artist(artist_id_input TEXT)
RETURNS SETOF releases AS $$
DECLARE
    found_releases BOOLEAN := FALSE;
BEGIN
    -- First check if we have records in the release_artists join table
    PERFORM 1 FROM release_artists WHERE artist_id = artist_id_input LIMIT 1;
    
    IF FOUND THEN
        -- Return releases via the join table approach if records exist
        found_releases := TRUE;
        RETURN QUERY
            SELECT r.*
            FROM releases r
            JOIN release_artists ra ON r.id = ra.release_id
            WHERE ra.artist_id = artist_id_input
            ORDER BY r.release_date DESC NULLS LAST;
    END IF;
    
    -- If no rows returned from join table, try direct artist_id on releases
    IF NOT found_releases THEN
        -- Check if direct artist_id field exists and has records for this artist
        BEGIN
            PERFORM 1 FROM releases WHERE artist_id = artist_id_input LIMIT 1;
            
            IF FOUND THEN
                RETURN QUERY
                    SELECT * FROM releases
                    WHERE artist_id = artist_id_input
                    ORDER BY release_date DESC NULLS LAST;
            END IF;
        EXCEPTION WHEN undefined_column THEN
            -- Column doesn't exist, just return an empty set
            NULL;
        END;
    END IF;
    
    -- If we get here and no records were returned yet, return an empty set
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM select_from_releases_for_artist('5hKQVA377hopQ9HWPOseXF') LIMIT 10;
