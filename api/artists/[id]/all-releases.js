// Serverless API handler for fetching all releases by an artist
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
  
  console.log(`Fetching releases for artist with ID: ${id}`);
  
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
    
    const result = await client.query(query, [id]);
    console.log(`Found ${result.rows.length} releases for artist ${id}`);
    
    // If no releases found, try alternative query with different possible ID formats
    if (result.rows.length === 0) {
      console.log('No releases found with artist ID, trying with Spotify ID...');
      
      // Find the artist's internal ID from the Spotify ID
      const artistQuery = 'SELECT id FROM artists WHERE spotify_id = $1';
      const artistResult = await client.query(artistQuery, [id]);
      
      if (artistResult.rows.length > 0) {
        const artistId = artistResult.rows[0].id;
        console.log(`Found internal artist ID ${artistId} for Spotify ID ${id}`);
        
        // Try the query again with the internal ID
        const retryResult = await client.query(query, [artistId]);
        console.log(`Found ${retryResult.rows.length} releases for artist with internal ID ${artistId}`);
        
        // If we found releases, use them
        if (retryResult.rows.length > 0) {
          const processedReleases = retryResult.rows.map(release => {
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
          
          const response = {
            releases: processedReleases,
            meta: {
              count: processedReleases.length,
              artist_id: id,
              internal_id: artistId,
              timestamp: new Date().toISOString()
            }
          };
          
          logResponse(response, `/api/artists/${id}/all-releases`);
          return res.status(200).json(response);
        }
      }
      
      // If still no releases found, return an empty list
      return res.status(200).json({
        releases: [],
        meta: {
          count: 0,
          artist_id: id,
          message: 'No releases found for this artist',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Transform the releases to match the expected TypeScript interface
    const processedReleases = result.rows.map(release => {
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
    
    const response = {
      releases: processedReleases,
      meta: {
        count: processedReleases.length,
        artist_id: id,
        timestamp: new Date().toISOString()
      }
    };
    
    logResponse(response, `/api/artists/${id}/all-releases`);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching releases for artist:', error);
    return res.status(500).json({
      error: 'Error fetching releases',
      details: error.message,
      artist_id: id
    });
  } finally {
    // Release the database client
    if (client) {
      client.release();
      console.log('Database connection released');
    }
  }
};
