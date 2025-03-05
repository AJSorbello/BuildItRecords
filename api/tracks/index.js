// Serverless API handler for fetching tracks
const { getPool, getTableSchema, hasColumn, logResponse } = require('../utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  try {
    console.log('Processing tracks request', req.query);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // First check the schema to understand columns
      const tracksSchema = await getTableSchema(client, 'tracks');
      const releasesSchema = await getTableSchema(client, 'releases');
      const artistsSchema = await getTableSchema(client, 'artists');
      
      // Log the schema for debugging
      console.log(`Tracks table has ${tracksSchema.length} columns`);
      console.log(`Releases table has ${releasesSchema.length} columns`);
      console.log(`Artists table has ${artistsSchema.length} columns`);
      
      // Get query parameters
      const { release, label, offset = 0, limit = 50 } = req.query;
      
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
        } else if (label) {
          // Fetch tracks for a specific label
          console.log(`Fetching tracks for label: ${label}`);
          
          // Determine if releases table has label_id column
          const labelColumn = hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'id';
          
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
          queryParams = [label, parseInt(limit), parseInt(offset)];
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
        
        // Format the response
        const tracks = result.rows.map(track => ({
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
        
        // Log response summary
        logResponse(tracks, '/tracks');
        
        // Return the formatted tracks
        return res.status(200).json({ 
          tracks,
          _meta: {
            count: tracks.length,
            offset: parseInt(offset),
            limit: parseInt(limit),
            query: { release, label },
            timestamp: new Date().toISOString()
          }
        });
      } catch (queryError) {
        console.error('Query error:', queryError.message);
        
        // Try a fallback query if there was an error
        try {
          console.log('Attempting fallback query without joins');
          const fallbackQuery = `
            SELECT * 
            FROM tracks 
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
          `;
          
          const fallbackResult = await client.query(fallbackQuery, [parseInt(limit), parseInt(offset)]);
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
