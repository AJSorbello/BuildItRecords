const { getArtistsByLabel } = require('../../utils/supabase-client');
const { getPool, addCorsHeaders } = require('../../utils/db-utils');

// Initialize database connection, but don't fail if it's not available
let pool;
try {
  pool = getPool();
} catch (error) {
  console.error('Database pool initialization error (non-fatal):', error.message);
}

/**
 * Handler for getting artists by label
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(200).json({
      status: 'error',
      artists: [],
      metadata: {
        count: 0,
        error: 'Method Not Allowed',
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }

  const { labelId } = req.query;

  if (!labelId) {
    return res.status(200).json({
      status: 'error',
      artists: [],
      metadata: {
        count: 0,
        error: 'Label ID is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  console.log(`[${new Date().toISOString()}] Getting artists for label: ${labelId}`);
  
  let artists = [];
  let errorMessage = null;
  let dataSource = 'unknown';
  
  // Try using the Supabase client first (preferred)
  try {
    console.log('Attempting to get artists using Supabase client...');
    const supabaseArtists = await getArtistsByLabel({ labelId, limit: 100 });
    
    if (supabaseArtists && supabaseArtists.length > 0) {
      console.log(`Found ${supabaseArtists.length} artists for label ${labelId} using Supabase client`);
      artists = supabaseArtists;
      dataSource = 'supabase-client';
    } else {
      console.log(`No artists found for label ${labelId} using Supabase client, trying direct database query...`);
    }
  } catch (supabaseError) {
    console.error('Error getting artists with Supabase client:', supabaseError);
    console.log('Falling back to direct database query...');
    errorMessage = supabaseError.message || 'Error connecting to Supabase';
  }

  // Fall back to direct PostgreSQL query if Supabase client fails and pool is available
  if (artists.length === 0 && pool) {
    console.log('Attempting direct PostgreSQL connection to retrieve artists...');
    let client = null;
    try {
      // Connect to database
      client = await pool.connect();
      console.log('Connected to PostgreSQL database successfully');
      
      // First try junction table approach to find artists through releases
      const junctionQuery = `
        SELECT DISTINCT a.id, a.name, a.image_url, a.profile_image_url, a.profile_image_small_url, a.profile_image_large_url, a.spotify_url, a.spotify_id
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
        artists = junctionResult.rows;
        dataSource = 'postgres-junction';
      } else {
        // If junction approach didn't work, try direct label_id approach
        console.log('No artists found via junction table, trying direct label ID approach');
        const directQuery = `
          SELECT id, name, image_url, profile_image_url, profile_image_small_url, profile_image_large_url, spotify_url, spotify_id
          FROM artists
          WHERE label_id = $1
          LIMIT 100
        `;
        
        const directResult = await client.query(directQuery, [labelId]);
        
        if (directResult.rows && directResult.rows.length > 0) {
          console.log(`Found ${directResult.rows.length} artists with direct label ID lookup`);
          artists = directResult.rows;
          dataSource = 'postgres-direct';
        } else {
          // If we still haven't found any artists, try a flexible approach
          console.log('No artists found with direct label ID, trying flexible approach');
          const flexibleQuery = `
            SELECT DISTINCT a.id, a.name, a.image_url, a.profile_image_url, a.profile_image_small_url, a.profile_image_large_url, a.spotify_url, a.spotify_id
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
            artists = flexibleResult.rows;
            dataSource = 'postgres-flexible';
          } else {
            // Last resort: get any artists, regardless of label
            console.log('No artists found with any label approach, fetching recent artists as fallback');
            const fallbackQuery = `
              SELECT id, name, image_url, profile_image_url, profile_image_small_url, profile_image_large_url, spotify_url, spotify_id
              FROM artists
              ORDER BY id DESC
              LIMIT 100
            `;
            
            const fallbackResult = await client.query(fallbackQuery);
            
            if (fallbackResult.rows && fallbackResult.rows.length > 0) {
              console.log(`Using ${fallbackResult.rows.length} fallback artists (not filtered by label)`);
              artists = fallbackResult.rows;
              dataSource = 'postgres-fallback';
              errorMessage = 'Could not find artists matching this label. Showing unfiltered results instead.';
            }
          }
        }
      }
    } catch (dbError) {
      console.error('Database error when fetching artists:', dbError);
      errorMessage = dbError.message || 'Database error occurred';
    } finally {
      // Clean up the database connection
      if (client) {
        try {
          client.release();
          console.log('Released PostgreSQL client back to the pool');
        } catch (releaseError) {
          console.error('Error releasing PostgreSQL client:', releaseError);
        }
      }
    }
  }
  
  // If still no artists after all attempts, provide dummy data
  if (artists.length === 0) {
    console.log('No artists found after all attempts, providing fallback dummy data');
    artists = [
      {
        id: 'dummy-1',
        name: 'Example Artist 1',
        image_url: 'https://via.placeholder.com/300',
        profile_image_url: 'https://via.placeholder.com/300',
        spotify_url: null,
        spotify_id: null
      },
      {
        id: 'dummy-2',
        name: 'Example Artist 2',
        image_url: 'https://via.placeholder.com/300',
        profile_image_url: 'https://via.placeholder.com/300',
        spotify_url: null,
        spotify_id: null
      }
    ];
    dataSource = 'fallback-dummy-data';
    errorMessage = errorMessage || 'No artists found for this label after all data fetching attempts';
  }
  
  // Format the artists consistently
  const formattedArtists = artists.map(artist => ({
    id: artist.id || 'unknown',
    name: artist.name || 'Unknown Artist',
    imageUrl: artist.imageUrl || artist.image_url || artist.profile_image_url || artist.profile_image_small_url || artist.profile_image_large_url || 'https://via.placeholder.com/300',
    spotifyUrl: artist.spotifyUrl || artist.spotify_url || null,
    spotifyId: artist.spotifyId || artist.spotify_id || null
  }));
  
  // Always return a 200 status with results or error info
  return res.status(200).json({
    status: errorMessage ? 'partial' : 'success',
    artists: formattedArtists,
    metadata: {
      count: formattedArtists.length,
      source: dataSource,
      error: errorMessage,
      label: labelId,
      timestamp: new Date().toISOString()
    }
  });
}
