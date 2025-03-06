const { getArtistsByLabel } = require('../../utils/supabase-client');
const { getPool } = require('../../utils/db-utils');

/**
 * Handler for getting artists by label
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { labelId } = req.query;

  if (!labelId) {
    return res.status(400).json({ 
      error: 'Label ID is required',
      meta: { timestamp: new Date().toISOString() }
    });
  }

  console.log(`[${new Date().toISOString()}] Getting artists for label: ${labelId}`);
  
  try {
    // Try using the Supabase client first (preferred)
    try {
      console.log('Attempting to get artists using Supabase client...');
      const supabaseArtists = await getArtistsByLabel({ labelId, limit: 100 });
      
      if (supabaseArtists && supabaseArtists.length > 0) {
        console.log(`Found ${supabaseArtists.length} artists for label ${labelId} using Supabase client`);
        return res.status(200).json({ 
          artists: supabaseArtists,
          meta: {
            source: 'supabase-client',
            count: supabaseArtists.length,
            label: labelId,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        console.log(`No artists found for label ${labelId} using Supabase client, trying direct database query...`);
      }
    } catch (supabaseError) {
      console.error('Error getting artists with Supabase client:', supabaseError);
      console.log('Falling back to direct database query...');
    }

    // Fall back to direct PostgreSQL query if Supabase client fails
    console.log('Attempting direct PostgreSQL connection to retrieve artists...');
    let client = null;
    try {
      // Get the database pool and connect to it
      const pool = getPool();
      client = await pool.connect();
      
      console.log('Connected to PostgreSQL database successfully');
      
      // First try junction table approach to find artists through releases
      const junctionQuery = `
        SELECT DISTINCT a.id, a.name, a.image_url, a.spotify_url
        FROM artists a
        JOIN release_artists ra ON a.id = ra.artist_id
        JOIN releases r ON r.id = ra.release_id
        WHERE r.label_id = $1
        LIMIT 100
      `;
      
      console.log('Executing junction table query to find artists through releases');
      const junctionResult = await client.query(junctionQuery, [labelId]);
      
      if (junctionResult.rows && junctionResult.rows.length > 0) {
        console.log(`Found ${junctionResult.rows.length} artists through release relationships`);
        
        // Format artist data for response
        const formattedArtists = junctionResult.rows.map(artist => ({
          id: artist.id,
          name: artist.name,
          imageUrl: artist.image_url,
          spotifyUrl: artist.spotify_url
        }));
        
        return res.status(200).json({
          artists: formattedArtists,
          meta: {
            source: 'postgres-junction',
            count: formattedArtists.length,
            label: labelId,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // If junction approach didn't work, try direct label_id approach
      console.log('No artists found via junction table, trying direct label ID approach');
      const directQuery = `
        SELECT id, name, image_url, spotify_url
        FROM artists
        WHERE label_id = $1
        LIMIT 100
      `;
      
      // Try with id in case label_id doesn't exist
      const directResult = await client.query(directQuery, [labelId]);
      
      if (directResult.rows && directResult.rows.length > 0) {
        console.log(`Found ${directResult.rows.length} artists with direct label ID lookup`);
        
        // Format artist data for response
        const formattedArtists = directResult.rows.map(artist => ({
          id: artist.id,
          name: artist.name,
          imageUrl: artist.image_url,
          spotifyUrl: artist.spotify_url
        }));
        
        return res.status(200).json({
          artists: formattedArtists,
          meta: {
            source: 'postgres-direct',
            count: formattedArtists.length,
            label: labelId,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // If we still haven't found any artists, try a flexible approach
      console.log('No artists found with direct label ID, trying flexible approach');
      const flexibleQuery = `
        SELECT DISTINCT a.id, a.name, a.image_url, a.spotify_url
        FROM artists a
        LEFT JOIN release_artists ra ON a.id = ra.artist_id
        LEFT JOIN releases r ON ra.release_id = r.id
        WHERE a.label_id = $1 
           OR r.label_id = $1
           OR a.label_id ILIKE '%' || $1 || '%'
           OR r.label_id ILIKE '%' || $1 || '%'
        LIMIT 100
      `;
      
      const flexibleResult = await client.query(flexibleQuery, [labelId]);
      
      if (flexibleResult.rows && flexibleResult.rows.length > 0) {
        console.log(`Found ${flexibleResult.rows.length} artists with flexible label lookup`);
        
        // Format artist data for response
        const formattedArtists = flexibleResult.rows.map(artist => ({
          id: artist.id,
          name: artist.name,
          imageUrl: artist.image_url,
          spotifyUrl: artist.spotify_url
        }));
        
        return res.status(200).json({
          artists: formattedArtists,
          meta: {
            source: 'postgres-flexible',
            count: formattedArtists.length,
            label: labelId,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Last resort: get any artists, regardless of label
      console.log('No artists found with any label approach, fetching recent artists as fallback');
      const fallbackQuery = `
        SELECT id, name, image_url, spotify_url
        FROM artists
        ORDER BY id DESC
        LIMIT 100
      `;
      
      const fallbackResult = await client.query(fallbackQuery);
      
      if (fallbackResult.rows && fallbackResult.rows.length > 0) {
        console.log(`Using ${fallbackResult.rows.length} fallback artists (not filtered by label)`);
        
        // Format artist data for response
        const formattedArtists = fallbackResult.rows.map(artist => ({
          id: artist.id,
          name: artist.name,
          imageUrl: artist.image_url,
          spotifyUrl: artist.spotify_url
        }));
        
        return res.status(200).json({
          artists: formattedArtists,
          meta: {
            source: 'postgres-fallback',
            count: formattedArtists.length,
            label: labelId,
            note: 'Artists not filtered by label - fallback mode',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // If we've reached this point, we couldn't find any artists
      console.log('No artists found after all attempts');
      return res.status(404).json({
        error: 'No artists found for this label after all attempts',
        meta: {
          label: labelId,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (dbError) {
      console.error('Database error when fetching artists:', dbError);
      return res.status(500).json({
        error: 'No artists found for this label after all attempts',
        meta: {
          label: labelId,
          pgError: dbError.message || 'Unknown database error',
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      // Clean up the database connection
      if (client) {
        console.log('Releasing PostgreSQL client back to the pool');
        try {
          client.release();
        } catch (releaseError) {
          console.error('Error releasing PostgreSQL client:', releaseError);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing artists request for label ${labelId}:`, error);
    return res.status(500).json({
      error: 'Failed to retrieve artists',
      meta: {
        label: labelId,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}
