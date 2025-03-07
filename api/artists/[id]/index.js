// Handler for both artist details and related endpoints
const { Pool } = require('pg');
const { getPool, addCorsHeaders, logResponse } = require('../../utils/db-utils');

// CRITICAL: Force Node.js to accept self-signed certificates
// This should only be used in controlled environments with trusted sources
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);
  
  // Get artist ID from the URL
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing artist ID parameter' });
  }
  
  // Check the request path to determine the endpoint type
  const isReleasesRequest = req.url.includes('/all-releases');
  
  if (isReleasesRequest) {
    return await getArtistReleasesHandler(req, res, id);
  } else {
    // Default artist details handler could be added here
    return res.status(404).json({ error: 'Endpoint not implemented' });
  }
};

/**
 * Handler for GET /api/artists/:id/all-releases
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} artistId - Artist ID
 */
async function getArtistReleasesHandler(req, res, artistId) {
  console.log(`Fetching releases for artist with ID: ${artistId}`);
  
  let client = null;
  try {
    // Initialize the database connection pool
    const pool = getPool();
    client = await pool.connect();
    
    // Query to fetch releases associated with an artist through the junction table
    const query = `
      SELECT DISTINCT r.* 
      FROM releases r
      JOIN release_artists ra ON r.id = ra.release_id
      WHERE ra.artist_id = $1
      ORDER BY r.release_date DESC
    `;
    
    const result = await client.query(query, [artistId]);
    console.log(`Found ${result.rows.length} releases for artist ${artistId}`);
    
    // If no releases found, try alternative query with different possible ID formats
    if (result.rows.length === 0) {
      console.log('No releases found with artist ID, trying with Spotify ID...');
      
      // Find the artist's internal ID from the Spotify ID
      const artistQuery = 'SELECT id FROM artists WHERE spotify_id = $1';
      const artistResult = await client.query(artistQuery, [artistId]);
      
      if (artistResult.rows.length > 0) {
        const internalArtistId = artistResult.rows[0].id;
        console.log(`Found internal artist ID ${internalArtistId} for Spotify ID ${artistId}`);
        
        // Try the query again with the internal ID
        const retryResult = await client.query(query, [internalArtistId]);
        console.log(`Found ${retryResult.rows.length} releases for artist with internal ID ${internalArtistId}`);
        
        // If we found releases, use them
        if (retryResult.rows.length > 0) {
          const response = {
            releases: retryResult.rows,
            meta: {
              count: retryResult.rows.length,
              artist_id: artistId,
              internal_id: internalArtistId,
              timestamp: new Date().toISOString()
            }
          };
          
          logResponse(response, `/api/artists/${artistId}/all-releases`);
          return res.status(200).json(response);
        }
      }
      
      // If still no releases found, return an empty list
      return res.status(200).json({
        releases: [],
        meta: {
          count: 0,
          artist_id: artistId,
          message: 'No releases found for this artist',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Format and return the response
    const response = {
      releases: result.rows,
      meta: {
        count: result.rows.length,
        artist_id: artistId,
        timestamp: new Date().toISOString()
      }
    };
    
    logResponse(response, `/api/artists/${artistId}/all-releases`);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching releases for artist:', error);
    return res.status(500).json({
      error: 'Error fetching releases',
      details: error.message,
      artist_id: artistId
    });
  } finally {
    // Release the database client
    if (client) {
      client.release();
      console.log('Database connection released');
    }
  }
}
