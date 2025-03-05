// Serverless API endpoint for artists
// This file is deployed as an independent serverless function
const { getPool, getTableSchema, hasColumn, getAllTables, addCorsHeaders } = require('../utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  console.log('API: GET /api/artists');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Database connection params:', {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL
  });

  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get query parameters
  const { label, id } = req.query;
  console.log('Query parameters:', { label, id });

  let client;
  try {
    client = await pool.connect();
    console.log('Database connected');

    // List all available tables
    const tables = await getAllTables(client);
    console.log(`Database has ${tables.length} tables`);
    console.log('Available tables:', tables.join(', '));

    // Return a specific artist if ID is provided
    if (id) {
      try {
        const result = await client.query('SELECT * FROM artists WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Artist not found',
            timestamp: new Date().toISOString()
          });
        }
        
        return res.status(200).json({ 
          success: true,
          data: {
            artist: result.rows[0],
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error fetching artist by ID:', error.message);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error',
          details: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Inspect the artists table schema to handle correctly
    console.log('Inspecting artists table schema');
    const artistsSchema = await getTableSchema(client, 'artists');
    
    if (artistsSchema.length === 0) {
      console.error('Error: Could not retrieve artists table schema');
      return res.status(500).json({ 
        success: false, 
        error: 'Could not retrieve table schema',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Artists table has ${artistsSchema.length} columns`);
    console.log('Available columns:', artistsSchema.map(col => col.column_name).join(', '));
    
    // Check if label_id column exists
    const hasLabelId = hasColumn(artistsSchema, 'label_id');
    console.log(`Does artists table have label_id column? ${hasLabelId}`);
    
    // Check total number of artists
    const totalCount = await client.query('SELECT COUNT(*) FROM artists');
    console.log(`Total artists in database: ${totalCount.rows[0].count}`);

    // Sample a few artists to check their structure
    const sampleArtists = await client.query('SELECT * FROM artists LIMIT 3');
    if (sampleArtists.rows.length > 0) {
      console.log('Sample artist data format:', JSON.stringify(sampleArtists.rows[0]));
    }

    // Check the related tables
    try {
      const releasesSchema = await getTableSchema(client, 'releases');
      console.log(`Releases table has ${releasesSchema.length} columns`);
      console.log('Available release columns:', releasesSchema.map(col => col.column_name).join(', '));
      
      // Check junction table
      const junctionResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'release_artists'
        )
      `);
      const hasJunctionTable = junctionResult.rows[0].exists;
      console.log(`Junction table 'release_artists' exists: ${hasJunctionTable}`);
      
      if (hasJunctionTable) {
        const junctionSchema = await getTableSchema(client, 'release_artists');
        console.log('Junction table columns:', junctionSchema.map(col => col.column_name).join(', '));
      }
    } catch (error) {
      console.error('Error checking related tables:', error.message);
    }

    try {
      // Query the database for artists
      let query;
      let queryParams = [];
      let statusMessage = '';
      
      if (label) {
        console.log(`Querying artists by label_id: ${label}`);
        
        // Special handling for buildit-records based on diagnostic data
        if (label === 'buildit-records') {
          console.log("Using special query for buildit-records label");
          try {
            // Try a query that specifically looks for BuildIt Records with various formats
            const builditQuery = `
              SELECT DISTINCT a.*
              FROM artists a
              LEFT JOIN release_artists ra ON a.id = ra.artist_id
              LEFT JOIN releases r ON ra.release_id = r.id
              WHERE r.label_id ILIKE '%buildit%' 
                 OR r.label_id ILIKE '%build it%'
                 OR a.label_id ILIKE '%buildit%'
                 OR a.label_id ILIKE '%build it%'
              ORDER BY a.name
              LIMIT 100
            `;
            
            console.log('Executing buildit-specific query:', builditQuery);
            
            const builditResult = await client.query(builditQuery);
            console.log(`Buildit-specific query found ${builditResult.rows.length} artists`);
            
            if (builditResult.rows.length > 0) {
              console.log('Sample artist from buildit-specific query:', JSON.stringify(builditResult.rows[0], null, 2));
              
              return res.status(200).json({ 
                success: true,
                message: `Found ${builditResult.rows.length} artists associated with BuildIt Records`,
                data: {
                  artists: builditResult.rows,
                },
                _meta: {
                  count: builditResult.rows.length,
                  query: { label },
                  queryType: 'buildit-special',
                  timestamp: new Date().toISOString()
                }
              });
            } else {
              console.log("Buildit-specific query found no results, trying the regular join query");
            }
          } catch (builditError) {
            console.error("Buildit-specific query error:", builditError.message);
          }
        }
        
        // First try with the advanced query that joins with releases
        try {
          // This query finds artists who are associated with releases from this label
          // through the release_artists junction table
          // OR artists that have label_id set directly
          const joinQuery = `
            SELECT DISTINCT a.*
            FROM artists a
            LEFT JOIN release_artists ra ON a.id = ra.artist_id
            LEFT JOIN releases r ON ra.release_id = r.id
            WHERE r.label_id = $1 OR a.label_id = $1
            ORDER BY a.name
            LIMIT 100
          `;
          
          console.log('Executing join query:', joinQuery);
          console.log('With parameters:', [label]);
          
          const joinResult = await client.query(joinQuery, [label]);
          console.log(`Join query found ${joinResult.rows.length} artists`);
          
          // Check for releases with this label
          const releaseCheck = await client.query('SELECT COUNT(*) FROM releases WHERE label_id = $1', [label]);
          console.log(`Releases with label_id=${label}: ${releaseCheck.rows[0].count}`);
          
          // Try case insensitive search
          const caseInsensitiveCheck = await client.query('SELECT COUNT(*) FROM releases WHERE LOWER(label_id) = LOWER($1)', [label]);
          console.log(`Releases with case-insensitive label_id=${label}: ${caseInsensitiveCheck.rows[0].count}`);
          
          // Try a looser check to find any releases with similar label ID
          const likeCheck = await client.query("SELECT COUNT(*) FROM releases WHERE label_id LIKE '%' || $1 || '%'", [label.replace(/-/g, '')]);
          console.log(`Releases with label_id containing ${label.replace(/-/g, '')}: ${likeCheck.rows[0].count}`);
          
          // Check for artists with this label directly
          const artistCheck = await client.query('SELECT COUNT(*) FROM artists WHERE label_id = $1', [label]);
          console.log(`Artists with direct label_id=${label}: ${artistCheck.rows[0].count}`);
          
          // Get the total count for this label (without the LIMIT)
          const countQuery = `
            SELECT COUNT(DISTINCT a.id)
            FROM artists a
            LEFT JOIN release_artists ra ON a.id = ra.artist_id
            LEFT JOIN releases r ON ra.release_id = r.id
            WHERE r.label_id = $1 OR a.label_id = $1
          `;
          const totalForLabel = await client.query(countQuery, [label]);
          const totalLabelArtists = parseInt(totalForLabel.rows[0].count);
          
          // Try a more permissive query if the join query didn't find any artists
          if (joinResult.rows.length === 0) {
            console.log("Join query found no artists, trying more permissive query");
            const altQuery = `
              SELECT DISTINCT a.*
              FROM artists a
              LEFT JOIN release_artists ra ON a.id = ra.artist_id
              LEFT JOIN releases r ON ra.release_id = r.id
              WHERE LOWER(r.label_id) = LOWER($1) 
                 OR LOWER(a.label_id) = LOWER($1)
                 OR r.label_id LIKE '%' || $2 || '%'
                 OR a.label_id LIKE '%' || $2 || '%'
              ORDER BY a.name
              LIMIT 100
            `;
            const altParams = [label, label.replace(/-/g, '')];
            
            console.log('Executing alternative query:', altQuery);
            console.log('With parameters:', altParams);
            
            const altResult = await client.query(altQuery, altParams);
            console.log(`Alternative query found ${altResult.rows.length} artists`);
            
            if (altResult.rows.length > 0) {
              console.log('Sample artist from alternative query:', JSON.stringify(altResult.rows[0], null, 2));
              
              return res.status(200).json({ 
                success: true,
                message: `Found ${altResult.rows.length} artists with alternative query`,
                data: {
                  artists: altResult.rows,
                },
                _meta: {
                  count: altResult.rows.length,
                  query: { label },
                  queryType: 'alternative',
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
          
          if (joinResult.rows.length > 0) {
            console.log('Sample artist from join query:', JSON.stringify(joinResult.rows[0], null, 2));
            
            // Create a status message
            statusMessage = `Found ${joinResult.rows.length} artists`;
            if (totalLabelArtists > joinResult.rows.length) {
              statusMessage += ` (showing ${joinResult.rows.length} of ${totalLabelArtists})`;
            }
            
            // Return the results in the format expected by the frontend
            return res.status(200).json({ 
              success: true,
              message: statusMessage,
              data: {
                artists: joinResult.rows,
              },
              _meta: {
                count: joinResult.rows.length,
                total: totalLabelArtists,
                query: { label },
                queryType: 'join',
                timestamp: new Date().toISOString()
              }
            });
          } else {
            throw new Error('No artists found with join query, trying direct query');
          }
        } catch (joinError) {
          console.error('Join query error:', joinError.message);
          // Fall back to direct query
          statusMessage = 'Warning: Using fallback query method';
        }
        
        // Fallback: Direct query on artists table only
        query = `
          SELECT * 
          FROM artists 
          WHERE label_id = $1 
          ORDER BY name 
          LIMIT 100
        `;
        queryParams = [label];
      } else {
        query = `
          SELECT * 
          FROM artists 
          ORDER BY name 
          LIMIT 100
        `;
        statusMessage = 'Showing all artists (limited to 100)';
      }
      
      console.log('Executing direct query:', query);
      console.log('With parameters:', queryParams);
      
      const result = await client.query(query, queryParams);
      console.log(`Direct query found ${result.rows.length} artists`);
      
      if (result.rows.length > 0) {
        console.log('Sample artist from direct query:', JSON.stringify(result.rows[0], null, 2));
      }
      
      if (!statusMessage) {
        statusMessage = `Found ${result.rows.length} artists`;
      }
      
      // Return the results in the format expected by the frontend
      return res.status(200).json({ 
        success: true,
        message: statusMessage,
        data: {
          artists: result.rows,
        },
        _meta: {
          count: result.rows.length,
          query: { label },
          queryType: 'direct',
          timestamp: new Date().toISOString()
        }
      });
    } catch (queryError) {
      console.error('Query error:', queryError.message);
      
      // Try a fallback query if there was an error
      try {
        console.log('Attempting fallback query without WHERE clause');
        const fallbackQuery = `
          SELECT * 
          FROM artists 
          ORDER BY name 
          LIMIT 100
        `;
        
        const fallbackResult = await client.query(fallbackQuery);
        console.log(`Fallback found ${fallbackResult.rows.length} artists`);
        
        return res.status(200).json({ 
          success: true,
          message: `Warning: Using fallback query. Found ${fallbackResult.rows.length} artists.`,
          data: {
            artists: fallbackResult.rows,
          },
          _meta: {
            count: fallbackResult.rows.length,
            fallback: true,
            error: queryError.message,
            timestamp: new Date().toISOString()
          }
        });
      } catch (fallbackError) {
        // If even the fallback fails, return the error
        console.error('Fallback query error:', fallbackError.message);
        
        return res.status(500).json({ 
          success: false, 
          error: 'Database query failed',
          details: fallbackError.message,
          originalError: queryError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (client) {
      client.release();
      console.log('Database client released');
    }
  }
};
