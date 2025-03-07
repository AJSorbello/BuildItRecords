// Unified serverless API handler for all tracks endpoints
const { getPool, getTableSchema, hasColumn, logResponse, addCorsHeaders } = require('../utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log(`API Request: ${req.method} ${req.url}`);
  
  try {
    console.log('Processing tracks request', req.query);
    
    // Determine which endpoint was requested
    const isByLabelRequest = req.url.includes('/label/');
    
    // Get query parameters - support both formats (for label ID)
    const { release, label, offset = 0, limit = 50, labelId } = req.query;
    const labelIdentifier = labelId || label; // Use either labelId or label parameter
    
    // Log the request type
    if (isByLabelRequest) {
      console.log(`Tracks by label request: ${labelIdentifier}`);
    } else if (release) {
      console.log(`Tracks by release request: ${release}`);
    } else if (labelIdentifier) {
      console.log(`Standard tracks request with label filter: ${labelIdentifier}`);
    } else {
      console.log('Standard tracks request (no filters)');
    }
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // First check the schema to understand columns
      const tracksSchema = await getTableSchema(client, 'tracks');
      const releasesSchema = await getTableSchema(client, 'releases');
      const artistsSchema = await getTableSchema(client, 'artists');
      const labelsSchema = await getTableSchema(client, 'labels');
      
      // Log the schema for debugging
      console.log(`Tracks table has ${tracksSchema.length} columns`);
      console.log(`Releases table has ${releasesSchema.length} columns`);
      console.log(`Artists table has ${artistsSchema.length} columns`);
      console.log(`Labels table has ${labelsSchema.length} columns`);
      
      // Debug available labels if this is a label request
      if (labelIdentifier) {
        try {
          const labelData = await client.query('SELECT id, name FROM labels LIMIT 10');
          console.log('Sample available labels:', labelData.rows.map(l => `${l.id} (${l.name})`).join(', '));
        } catch (labelErr) {
          console.error('Error fetching sample labels:', labelErr.message);
        }
      }
      
      try {
        let query;
        let queryParams = [];
        
        if (release) {
          // Fetch tracks for a specific release
          console.log(`Fetching tracks for release ID: ${release}`);
          
          query = `
            SELECT t.*,
                  STRING_AGG(a.name, ', ') as artist_names
            FROM tracks t
            LEFT JOIN release_artists ra ON t.release_id = ra.release_id
            LEFT JOIN artists a ON ra.artist_id = a.id
            WHERE t.release_id = $1
            GROUP BY t.id
            ORDER BY t.track_number
            LIMIT $2 OFFSET $3
          `;
          queryParams = [release, parseInt(limit), parseInt(offset)];
        } else if (labelIdentifier) {
          // Fetch tracks for a specific label
          console.log(`Fetching tracks for label: ${labelIdentifier}`);
          
          // Determine if releases table has label_id column
          const labelColumn = hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'id';
          
          // Prepare different variations of the label ID to be more flexible
          const normalizedLabelId = labelIdentifier.replace(/-/g, ''); // Remove hyphens
          
          if (isByLabelRequest) {
            // Use the more flexible query from the label-specific endpoint
            query = `
              SELECT t.*, 
                     a.name as artist_name, 
                     r.title as release_title, 
                     r.image_url as release_image
              FROM tracks t
              JOIN artists a ON t.artist_id = a.id
              JOIN labels l ON a.label_id = l.id
              LEFT JOIN releases r ON t.release_id = r.id
              WHERE l.id = $1
                 OR l.id = $2
                 OR l.name ILIKE $3
                 OR l.id::text ILIKE $4
              ORDER BY t.created_at DESC
              LIMIT $5 OFFSET $6
            `;
            
            queryParams = [
              labelIdentifier, 
              normalizedLabelId,
              `%${labelIdentifier.replace(/-/g, ' ')}%`,  // Replace hyphens with spaces for ILIKE
              `%${labelIdentifier}%`,                    // Simple partial match
              parseInt(limit),
              parseInt(offset)
            ];
          } else {
            // Use the standard query from the main endpoint
            query = `
              SELECT t.*,
                    r.title as release_title,
                    STRING_AGG(a.name, ', ') as artist_names
              FROM tracks t
              JOIN releases r ON t.release_id = r.id
              LEFT JOIN release_artists ra ON t.release_id = ra.release_id
              LEFT JOIN artists a ON ra.artist_id = a.id
              WHERE r.${labelColumn} = $1
              GROUP BY t.id, r.title
              ORDER BY t.created_at DESC
              LIMIT $2 OFFSET $3
            `;
            queryParams = [labelIdentifier, parseInt(limit), parseInt(offset)];
          }
        } else {
          // Fetch all tracks
          query = `
            SELECT t.*,
                  r.title as release_title,
                  STRING_AGG(a.name, ', ') as artist_names
            FROM tracks t
            LEFT JOIN releases r ON t.release_id = r.id
            LEFT JOIN release_artists ra ON t.release_id = ra.release_id
            LEFT JOIN artists a ON ra.artist_id = a.id
            GROUP BY t.id, r.title
            ORDER BY t.created_at DESC
            LIMIT $1 OFFSET $2
          `;
          queryParams = [parseInt(limit), parseInt(offset)];
        }
        
        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);
        
        const result = await client.query(query, queryParams);
        console.log(`Found ${result.rows.length} tracks`);
        
        // Format the response based on which endpoint was requested
        let tracks;
        
        if (isByLabelRequest) {
          // Format as in the label-specific endpoint
          tracks = result.rows.map(track => ({
            id: track.id,
            title: track.title,
            artistId: track.artist_id,
            artistName: track.artist_name,
            releaseId: track.release_id,
            releaseTitle: track.release_title || 'Unknown Release',
            releaseImageUrl: track.release_image || track.artwork_url || '',
            audioUrl: track.audio_url || track.preview_url || '',
            spotifyId: track.spotify_id || '',
            duration: track.duration_ms || track.duration || 0,
            isrc: track.isrc || '',
            createdAt: track.created_at,
            updatedAt: track.updated_at
          }));
        } else {
          // Format as in the standard endpoint
          tracks = result.rows.map(track => ({
            id: track.id,
            title: track.title,
            artists: track.artist_names || track.artist_name || '',
            releaseId: track.release_id,
            releaseTitle: track.release_title || 'Unknown Release',
            trackNumber: track.track_number,
            audioUrl: track.audio_url || track.preview_url || '',
            spotifyId: track.spotify_id || '',
            duration: track.duration_ms || track.duration || 0,
            isrc: track.isrc || '',
            createdAt: track.created_at,
            updatedAt: track.updated_at
          }));
        }
        
        // Log response summary
        const endpoint = isByLabelRequest ? `/tracks/label/${labelIdentifier}` : '/tracks';
        logResponse(tracks, endpoint);
        
        // Return the formatted tracks
        return res.status(200).json({ 
          tracks,
          _meta: {
            count: tracks.length,
            offset: parseInt(offset),
            limit: parseInt(limit),
            query: { release, label: labelIdentifier },
            endpoint: isByLabelRequest ? 'labelTracks' : 'standardTracks',
            timestamp: new Date().toISOString()
          }
        });
      } catch (queryError) {
        console.error('Query error:', queryError.message);
        
        // Try a fallback query if there was an error
        try {
          console.log('Attempting fallback query without joins');
          let fallbackQuery;
          let fallbackParams;
          
          if (release) {
            fallbackQuery = `
              SELECT * 
              FROM tracks 
              WHERE release_id = $1
              ORDER BY track_number
              LIMIT $2 OFFSET $3
            `;
            fallbackParams = [release, parseInt(limit), parseInt(offset)];
          } else {
            fallbackQuery = `
              SELECT * 
              FROM tracks 
              ORDER BY created_at DESC
              LIMIT $1 OFFSET $2
            `;
            fallbackParams = [parseInt(limit), parseInt(offset)];
          }
          
          const fallbackResult = await client.query(fallbackQuery, fallbackParams);
          console.log(`Fallback found ${fallbackResult.rows.length} tracks`);
          
          // Format fallback response
          const fallbackTracks = fallbackResult.rows.map(track => ({
            id: track.id,
            title: track.title,
            releaseId: track.release_id,
            trackNumber: track.track_number,
            audioUrl: track.audio_url || track.preview_url || '',
            spotifyId: track.spotify_id || '',
            duration: track.duration_ms || track.duration || 0,
            isrc: track.isrc || '',
            createdAt: track.created_at,
            updatedAt: track.updated_at
          }));
          
          return res.status(200).json({ 
            tracks: fallbackTracks,
            _meta: {
              count: fallbackTracks.length,
              fallback: true,
              error: queryError.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (fallbackError) {
          // If even the fallback fails, return the error
          console.error('Fallback query error:', fallbackError.message);
          return res.status(500).json({ 
            error: 'Database query error', 
            details: fallbackError.message,
            originalError: queryError.message
          });
        }
      }
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
