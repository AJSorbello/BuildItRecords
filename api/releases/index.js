// Serverless API handler for fetching releases
const { getPool, getTableSchema, hasColumn, logResponse, getAllTables } = require('../utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  try {
    console.log('Processing releases request', req.query);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database connection params:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL
    });
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Get all tables to verify database structure
      const tables = await getAllTables(client);
      console.log('Available tables in database:', tables.join(', '));
      
      // First check the schema to understand columns
      const releasesSchema = await getTableSchema(client, 'releases');
      const artistsSchema = await getTableSchema(client, 'artists');
      
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
      
      // Log schema information
      console.log(`Releases table has ${releasesSchema.length} columns`);
      console.log(`Artists table has ${artistsSchema.length} columns`);
      console.log(`Junction table exists: ${hasJunctionTable}`);
      
      // Get available columns for dynamic query construction
      const releaseColumns = releasesSchema.map(col => col.column_name);
      console.log('Available release columns:', releaseColumns.join(', '));
      
      // Check sample releases
      const sampleReleases = await client.query('SELECT * FROM releases LIMIT 3');
      if (sampleReleases.rows.length > 0) {
        console.log('Sample release data format:', JSON.stringify(sampleReleases.rows[0], null, 2));
      } else {
        console.log('No releases found in sample query');
      }

      // Count total releases
      const totalCount = await client.query('SELECT COUNT(*) FROM releases');
      console.log(`Total releases in database: ${totalCount.rows[0].count}`);
      
      // Extract query parameters
      const { label, offset = 0, limit = 50 } = req.query;
      
      // If label is specified, check if it exists
      if (label) {
        // Check for releases with this label
        const releaseCheck = await client.query('SELECT COUNT(*) FROM releases WHERE label_id = $1', [label]);
        console.log(`Releases with label_id=${label}: ${releaseCheck.rows[0].count}`);
        
        // Try case insensitive search
        const caseInsensitiveCheck = await client.query('SELECT COUNT(*) FROM releases WHERE LOWER(label_id) = LOWER($1)', [label]);
        console.log(`Releases with case-insensitive label_id=${label}: ${caseInsensitiveCheck.rows[0].count}`);
        
        // Try a looser check to find any releases with similar label ID
        const likeCheck = await client.query("SELECT COUNT(*) FROM releases WHERE label_id LIKE '%' || $1 || '%'", [label.replace(/-/g, '')]);
        console.log(`Releases with label_id containing ${label.replace(/-/g, '')}: ${likeCheck.rows[0].count}`);
        
        // Get the distinct values of label_id to see what's available
        const labelValues = await client.query("SELECT DISTINCT label_id FROM releases LIMIT 10");
        console.log('Available label_id values (sample):', labelValues.rows.map(r => r.label_id).join(', '));
      }
      
      try {
        // Build the query based on schema discovery
        let query;
        let queryParams = [];
        
        // Check if status column exists for filtering
        const hasStatusColumn = hasColumn(releasesSchema, 'status');
        const statusFilter = hasStatusColumn ? "AND r.status = 'published'" : '';
        
        // Check if label is queried by id or label_id
        const labelColumn = hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'id';
        console.log(`Using ${labelColumn} as the label column`);
        
        // For Vercel/Supabase data source, try a more flexible approach with label
        if (label) {
          // Special handling for buildit-records based on diagnostic data
          if (label === 'buildit-records') {
            console.log("Using special query for buildit-records label");
            try {
              // Try a query that specifically looks for BuildIt Records with various formats
              const builditQuery = `
                SELECT r.* 
                FROM releases r
                WHERE r.${labelColumn} ILIKE '%buildit%' OR r.${labelColumn} ILIKE '%build it%'
                ORDER BY r.release_date DESC
                LIMIT $1 OFFSET $2
              `;
              const builditParams = [parseInt(limit), parseInt(offset)];
              
              console.log('Executing buildit-specific query:', builditQuery);
              console.log('With parameters:', builditParams);
              
              const builditResult = await client.query(builditQuery, builditParams);
              console.log(`Buildit-specific query found ${builditResult.rows.length} releases`);
              
              if (builditResult.rows.length > 0) {
                // Format response with consistent structure
                const releases = builditResult.rows.map(release => {
                  // Build a standardized release object with optional fields
                  const formattedRelease = {
                    id: release.id,
                    title: release.title,
                    artists: release.artist_names || '',
                    releaseDate: release.release_date,
                    artworkUrl: release.artwork_url || release.artwork_small_url || '',
                    labelId: release.label_id || release.id,
                    spotifyId: release.spotify_id || '',
                    releaseType: release.release_type || release.type || 'album',
                    totalTracks: release.total_tracks || 0,
                    spotifyUrl: release.spotify_url || release.spotify_uri || '',
                    createdAt: release.created_at,
                    updatedAt: release.updated_at
                  };
                  
                  return formattedRelease;
                });
                
                // Log response summary
                logResponse(releases, '/releases-buildit-special');
                
                // Return the formatted releases from buildit-specific query
                return res.status(200).json({ 
                  releases,
                  _meta: {
                    count: releases.length,
                    offset: parseInt(offset),
                    limit: parseInt(limit),
                    query: { label },
                    queryType: 'buildit-special',
                    timestamp: new Date().toISOString()
                  }
                });
              } else {
                console.log("Buildit-specific query found no results, trying alternative query");
              }
            } catch (builditError) {
              console.error("Buildit-specific query error:", builditError.message);
            }
          }
          
          // Try an alternative query first that's more permissive with the label format
          try {
            console.log("Trying alternative query with multiple label format options");
            const altQuery = `
              SELECT r.* 
              FROM releases r
              WHERE (r.${labelColumn} = $1 
                     OR LOWER(r.${labelColumn}) = LOWER($1)
                     OR r.${labelColumn} LIKE '%' || $2 || '%')
              ORDER BY r.release_date DESC
              LIMIT $3 OFFSET $4
            `;
            const altParams = [
              label, 
              label.replace(/-/g, ''), // Try without hyphens
              parseInt(limit), 
              parseInt(offset)
            ];
            
            console.log('Executing alternative query:', altQuery);
            console.log('With parameters:', altParams);
            
            const altResult = await client.query(altQuery, altParams);
            console.log(`Alternative query found ${altResult.rows.length} releases`);
            
            if (altResult.rows.length > 0) {
              // Format response with consistent structure
              const releases = altResult.rows.map(release => {
                // Build a standardized release object with optional fields
                const formattedRelease = {
                  id: release.id,
                  title: release.title,
                  artists: release.artist_names || '',
                  releaseDate: release.release_date,
                  artworkUrl: release.artwork_url || release.artwork_small_url || '',
                  labelId: release.label_id || release.id,
                  spotifyId: release.spotify_id || '',
                  releaseType: release.release_type || release.type || 'album',
                  totalTracks: release.total_tracks || 0,
                  spotifyUrl: release.spotify_url || release.spotify_uri || '',
                  createdAt: release.created_at,
                  updatedAt: release.updated_at
                };
                
                return formattedRelease;
              });
              
              // Log response summary
              logResponse(releases, '/releases-alt');
              
              // Return the formatted releases from alternative query
              return res.status(200).json({ 
                releases,
                _meta: {
                  count: releases.length,
                  offset: parseInt(offset),
                  limit: parseInt(limit),
                  query: { label },
                  altQuery: true,
                  timestamp: new Date().toISOString()
                }
              });
            } else {
              console.log("Alternative query found no results, proceeding with standard queries");
            }
          } catch (altError) {
            console.error("Alternative query error:", altError.message);
          }
        }
        
        if (hasJunctionTable) {
          // Use the junction table for the query if it exists
          if (label) {
            query = `
              SELECT r.*, 
                     STRING_AGG(a.name, ', ') as artist_names
              FROM releases r
              LEFT JOIN release_artists ra ON r.id = ra.release_id
              LEFT JOIN artists a ON ra.artist_id = a.id
              WHERE r.${labelColumn} = $1 ${statusFilter}
              GROUP BY r.id
              ORDER BY r.release_date DESC
              LIMIT $2 OFFSET $3
            `;
            queryParams = [label, parseInt(limit), parseInt(offset)];
          } else {
            query = `
              SELECT r.*, 
                     STRING_AGG(a.name, ', ') as artist_names
              FROM releases r
              LEFT JOIN release_artists ra ON r.id = ra.release_id
              LEFT JOIN artists a ON ra.artist_id = a.id
              ${statusFilter ? `WHERE ${statusFilter.substring(4)}` : ''}
              GROUP BY r.id
              ORDER BY r.release_date DESC
              LIMIT $1 OFFSET $2
            `;
            queryParams = [parseInt(limit), parseInt(offset)];
          }
        } else {
          // Fall back to direct query without junction table
          if (label) {
            query = `
              SELECT r.*
              FROM releases r
              WHERE r.${labelColumn} = $1 ${statusFilter}
              ORDER BY r.release_date DESC
              LIMIT $2 OFFSET $3
            `;
            queryParams = [label, parseInt(limit), parseInt(offset)];
          } else {
            query = `
              SELECT r.*
              FROM releases r
              ${statusFilter ? `WHERE ${statusFilter.substring(4)}` : ''}
              ORDER BY r.release_date DESC
              LIMIT $1 OFFSET $2
            `;
            queryParams = [parseInt(limit), parseInt(offset)];
          }
        }
        
        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);
        
        const result = await client.query(query, queryParams);
        console.log(`Found ${result.rows.length} releases`);
        
        // Format response with consistent structure
        const releases = result.rows.map(release => {
          // Build a standardized release object with optional fields
          const formattedRelease = {
            id: release.id,
            title: release.title,
            artists: release.artist_names || '',
            releaseDate: release.release_date,
            artworkUrl: release.artwork_url || release.artwork_small_url || '',
            labelId: release.label_id || release.id,
            spotifyId: release.spotify_id || '',
            releaseType: release.release_type || release.type || 'album',
            totalTracks: release.total_tracks || 0,
            spotifyUrl: release.spotify_url || release.spotify_uri || '',
            createdAt: release.created_at,
            updatedAt: release.updated_at
          };
          
          return formattedRelease;
        });
        
        // Log response summary
        logResponse(releases, '/releases');
        
        // Return the formatted releases
        return res.status(200).json({ 
          releases,
          _meta: {
            count: releases.length,
            offset: parseInt(offset),
            limit: parseInt(limit),
            query: { label },
            timestamp: new Date().toISOString()
          }
        });
      } catch (queryError) {
        console.error('Primary query error:', queryError.message);
        
        // Try a fallback query if there was an error
        try {
          console.log('Attempting fallback query without complex joins');
          
          let fallbackQuery;
          let fallbackParams;
          
          if (label) {
            fallbackQuery = `
              SELECT * 
              FROM releases 
              WHERE ${hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'id'} = $1
              ORDER BY release_date DESC 
              LIMIT $2 OFFSET $3
            `;
            fallbackParams = [label, parseInt(limit), parseInt(offset)];
          } else {
            fallbackQuery = `
              SELECT * 
              FROM releases 
              ORDER BY release_date DESC 
              LIMIT $1 OFFSET $2
            `;
            fallbackParams = [parseInt(limit), parseInt(offset)];
          }
          
          const fallbackResult = await client.query(fallbackQuery, fallbackParams);
          console.log(`Fallback found ${fallbackResult.rows.length} releases`);
          
          // Format the fallback response
          const fallbackReleases = fallbackResult.rows.map(release => ({
            id: release.id,
            title: release.title,
            releaseDate: release.release_date,
            artworkUrl: release.artwork_url || release.artwork_small_url || '',
            labelId: release.label_id || release.id,
            spotifyId: release.spotify_id || '',
            releaseType: release.release_type || release.type || 'album',
            createdAt: release.created_at,
            updatedAt: release.updated_at
          }));
          
          return res.status(200).json({ 
            releases: fallbackReleases,
            _meta: {
              count: fallbackReleases.length,
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
