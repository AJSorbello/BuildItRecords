// Handler for artist details and related endpoints
const { Pool } = require('pg');
const { getPool, addCorsHeaders, logResponse } = require('../../utils/db-utils');
const supabaseClient = require('../../utils/supabase-client');

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
  
  console.log(`Artist API request for ID: ${id}, URL: ${req.url}`);
  
  // Check the request path to determine the endpoint type
  const isReleasesRequest = req.url.includes('/all-releases') || req.url.includes('/releases');
  const isDetailsRequest = !isReleasesRequest;
  
  if (isReleasesRequest) {
    return await getArtistReleasesHandler(req, res, id);
  } else if (isDetailsRequest) {
    return await getArtistDetailsHandler(req, res, id);
  } else {
    // Default case (shouldn't normally be reached)
    return res.status(404).json({ error: 'Endpoint not implemented' });
  }
};

/**
 * Handler for artist details
 * Handles GET /api/artists/:id
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} artistId - Artist ID
 */
async function getArtistDetailsHandler(req, res, artistId) {
  console.log(`Fetching details for artist with ID: ${artistId}`);
  
  let client = null;
  try {
    // Initialize the database connection pool
    const pool = getPool();
    client = await pool.connect();
    
    // First try direct ID match
    const query = 'SELECT * FROM artists WHERE id = $1';
    const result = await client.query(query, [artistId]);
    
    if (result.rows.length > 0) {
      // Found artist by ID
      console.log(`Found artist with ID: ${artistId}`);
      const response = {
        success: true,
        data: {
          artist: result.rows[0],
        },
        timestamp: new Date().toISOString()
      };
      
      logResponse(response, `/api/artists/${artistId}`);
      return res.status(200).json(response);
    }
    
    // Try by Spotify ID if direct match failed
    console.log('Trying to find artist by Spotify ID...');
    const spotifyQuery = 'SELECT * FROM artists WHERE spotify_id = $1';
    const spotifyResult = await client.query(spotifyQuery, [artistId]);
    
    if (spotifyResult.rows.length > 0) {
      // Found artist by Spotify ID
      console.log(`Found artist with Spotify ID: ${artistId}`);
      const response = {
        success: true,
        data: {
          artist: spotifyResult.rows[0],
        },
        timestamp: new Date().toISOString()
      };
      
      logResponse(response, `/api/artists/${artistId}`);
      return res.status(200).json(response);
    }
    
    // No artist found
    return res.status(404).json({ 
      success: false, 
      error: 'Artist not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching artist details:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching artist details',
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

/**
 * Handler for artist releases
 * Handles GET /api/artists/:id/all-releases and /api/artists/:id/releases
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} artistId - Artist ID
 */
async function getArtistReleasesHandler(req, res, artistId) {
  console.log(`Fetching releases for artist with ID: ${artistId}`);
  
  // Try using Supabase client first (faster and more reliable)
  try {
    console.log('Attempting to fetch releases via Supabase client...');
    const releases = await supabaseClient.getReleasesByArtist({ artistId });
    
    if (releases && releases.length > 0) {
      console.log(`Found ${releases.length} releases via Supabase client`);
      
      // Format and return the response
      const response = {
        releases: releases,
        meta: {
          count: releases.length,
          artist_id: artistId,
          method: 'supabase',
          timestamp: new Date().toISOString()
        }
      };
      
      logResponse(response, `/api/artists/${artistId}/releases`);
      return res.status(200).json(response);
    }
    
    console.log('No releases found via Supabase client, falling back to direct DB query...');
  } catch (supabaseError) {
    console.error('Error using Supabase client:', supabaseError.message);
    console.log('Falling back to direct DB query...');
  }
  
  // Fall back to direct database query if Supabase client fails
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
          const processedReleases = processReleases(retryResult.rows);
          
          const response = {
            releases: processedReleases,
            meta: {
              count: processedReleases.length,
              artist_id: artistId,
              internal_id: internalArtistId,
              method: 'database',
              timestamp: new Date().toISOString()
            }
          };
          
          logResponse(response, `/api/artists/${artistId}/releases`);
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
    
    // Process and return the releases
    const processedReleases = processReleases(result.rows);
    
    const response = {
      releases: processedReleases,
      meta: {
        count: processedReleases.length,
        artist_id: artistId,
        method: 'database',
        timestamp: new Date().toISOString()
      }
    };
    
    logResponse(response, `/api/artists/${artistId}/releases`);
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

/**
 * Helper function to process release data to match the expected TypeScript interface
 * @param {Array} releases - Raw releases from database
 * @returns {Array} - Processed releases
 */
function processReleases(releases) {
  return releases.map(release => {
    // Get some default values for required properties
    const images = release.images || [];
    if (release.artwork_url && !images.length) {
      images.push({ url: release.artwork_url, height: 300, width: 300 });
    }
    
    // Transform raw database release to match TypeScript interface
    return {
      id: release.id,
      title: release.title || release.name || 'Unknown Release',
      type: release.type || 'album',
      artists: release.artists || [],
      tracks: release.tracks || [],
      images: images,
      artwork_url: release.artwork_url,
      release_date: release.release_date || new Date().toISOString().split('T')[0],
      release_date_precision: release.release_date_precision || 'day',
      external_urls: release.external_urls || { spotify: release.spotify_url || '' },
      uri: release.spotify_uri || release.uri || '',
      labelId: release.label_id,
      label: release.label,
      total_tracks: release.total_tracks || (release.tracks ? release.tracks.length : 0),
      spotify_url: release.spotify_url,
      spotify_uri: release.spotify_uri,
      catalog_number: release.catalog_number,
      label_id: release.label_id,
      spotify_id: release.spotify_id,
      tracks_count: release.tracks_count || (release.tracks ? release.tracks.length : 0)
    };
  });
}
