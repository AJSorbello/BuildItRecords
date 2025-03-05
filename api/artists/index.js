// Serverless API endpoint for artists
// This file is deployed as an independent serverless function
const { getPool, getTableSchema, hasColumn } = require('../utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  console.log('API: GET /api/artists');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    
    // Check total number of artists
    const totalCount = await client.query('SELECT COUNT(*) FROM artists');
    console.log(`Total artists in database: ${totalCount.rows[0].count}`);

    try {
      // Query the database for artists
      let query;
      let queryParams = [];
      let statusMessage = '';
      
      if (label) {
        console.log(`Querying artists by label_id: ${label}`);
        
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
