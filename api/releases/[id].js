// Serverless API handler for fetching a single release by ID
const { getPool, getTableSchema, hasColumn, logResponse } = require('../utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  // Get release ID from the URL
  const releaseId = req.query.id;
  
  if (!releaseId) {
    return res.status(400).json({
      error: 'Missing release ID',
      timestamp: new Date().toISOString()
    });
  }

  console.log(`Processing request for release: ${releaseId}`);

  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // First check the schema to understand columns
      const releasesSchema = await getTableSchema(client, 'releases');
      const artistsSchema = await getTableSchema(client, 'artists');
      const tracksSchema = await getTableSchema(client, 'tracks');
      
      // Check if release_artists junction table exists
      let hasJunctionTable = false;
      try {
        const junctionResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'release_artists'
          )
        `);
        hasJunctionTable = junctionResult.rows[0].exists;
      } catch (err) {
        console.log('Error checking for junction table:', err.message);
      }
      
      try {
        // Primary query with joins to get all related data
        let query;
        let queryParams = [releaseId];
        
        // Use the junction table if it exists
        if (hasJunctionTable) {
          query = `
            SELECT 
              r.*,
              STRING_AGG(DISTINCT a.name, ', ') as artist_names,
              COUNT(DISTINCT t.id) as track_count
            FROM releases r
            LEFT JOIN release_artists ra ON r.id = ra.release_id
            LEFT JOIN artists a ON ra.artist_id = a.id
            LEFT JOIN tracks t ON t.release_id = r.id
            WHERE r.id = $1
            GROUP BY r.id
          `;
        } else {
          // Fallback to simple query without junction table
          query = `
            SELECT 
              r.*,
              COUNT(t.id) as track_count
            FROM releases r
            LEFT JOIN tracks t ON t.release_id = r.id
            WHERE r.id = $1
            GROUP BY r.id
          `;
        }
        
        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);
        
        const result = await client.query(query, queryParams);
        
        if (result.rows.length === 0) {
          return res.status(404).json({
            error: 'Release not found',
            timestamp: new Date().toISOString()
          });
        }
        
        const release = result.rows[0];
        console.log('Found release:', release.title);
        
        // Get tracks for this release
        const tracksQuery = `
          SELECT * FROM tracks
          WHERE release_id = $1
          ORDER BY track_number ASC
        `;
        
        const tracksResult = await client.query(tracksQuery, [releaseId]);
        console.log(`Found ${tracksResult.rows.length} tracks for this release`);
        
        // Format tracks
        const tracks = tracksResult.rows.map(track => ({
          id: track.id,
          title: track.title,
          artists: track.artists || '',
          trackNumber: track.track_number,
          duration: track.duration || 0,
          audioUrl: track.audio_url || '',
          spotifyId: track.spotify_id || '',
          isrc: track.isrc || '',
          createdAt: track.created_at,
          updatedAt: track.updated_at
        }));
        
        // Format the full release response
        const formattedRelease = {
          id: release.id,
          title: release.title,
          artists: release.artist_names || '',
          releaseDate: release.release_date,
          releaseType: release.release_type || release.type || 'album',
          labelId: release.label_id || '',
          artwork: {
            small: release.artwork_small_url || release.artwork_url || '',
            medium: release.artwork_url || '',
            large: release.artwork_large_url || release.artwork_url || ''
          },
          totalTracks: parseInt(release.track_count) || tracks.length,
          spotifyId: release.spotify_id || '',
          spotifyUrl: release.spotify_url || release.spotify_uri || '',
          externalUrls: release.external_urls || {},
          tracks: tracks,
          createdAt: release.created_at,
          updatedAt: release.updated_at
        };
        
        // Log response summary
        logResponse(formattedRelease, `/releases/${releaseId}`);
        
        // Return the formatted release
        return res.status(200).json({ 
          release: formattedRelease,
          _meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (queryError) {
        console.error('Primary query error:', queryError.message);
        
        // Try a fallback query if there was an error
        try {
          console.log('Attempting fallback query');
          
          const fallbackQuery = `
            SELECT * 
            FROM releases 
            WHERE id = $1
          `;
          
          const fallbackResult = await client.query(fallbackQuery, [releaseId]);
          
          if (fallbackResult.rows.length === 0) {
            return res.status(404).json({
              error: 'Release not found',
              timestamp: new Date().toISOString()
            });
          }
          
          const fallbackRelease = fallbackResult.rows[0];
          console.log('Fallback found release:', fallbackRelease.title);
          
          // Get tracks as a separate query
          let tracks = [];
          try {
            const tracksResult = await client.query(
              'SELECT * FROM tracks WHERE release_id = $1 ORDER BY track_number', 
              [releaseId]
            );
            
            tracks = tracksResult.rows.map(track => ({
              id: track.id,
              title: track.title,
              trackNumber: track.track_number,
              duration: track.duration || 0,
              spotifyId: track.spotify_id || '',
              createdAt: track.created_at,
              updatedAt: track.updated_at
            }));
          } catch (tracksErr) {
            console.log('Error fetching tracks:', tracksErr.message);
            // Continue without tracks
          }
          
          // Format the fallback response
          const formattedFallbackRelease = {
            id: fallbackRelease.id,
            title: fallbackRelease.title,
            releaseDate: fallbackRelease.release_date,
            releaseType: fallbackRelease.release_type || fallbackRelease.type || 'album',
            labelId: fallbackRelease.label_id || '',
            artwork: {
              small: fallbackRelease.artwork_small_url || fallbackRelease.artwork_url || '',
              medium: fallbackRelease.artwork_url || '',
              large: fallbackRelease.artwork_large_url || fallbackRelease.artwork_url || ''
            },
            totalTracks: tracks.length,
            tracks: tracks,
            createdAt: fallbackRelease.created_at,
            updatedAt: fallbackRelease.updated_at
          };
          
          return res.status(200).json({ 
            release: formattedFallbackRelease,
            _meta: {
              fallback: true,
              error: queryError.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (fallbackError) {
          console.error('Fallback query error:', fallbackError);
          throw fallbackError; // Let the outer catch handle this
        }
      }
    } finally {
      client.release();
      console.log('Database client released');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return res.status(500).json({
      error: 'Database error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
