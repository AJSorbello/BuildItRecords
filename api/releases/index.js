// Unified serverless API handler for all releases endpoints
const { getPool, getTableSchema, hasColumn, logResponse, addCorsHeaders } = require('../utils/db-utils');
const { getReleases, getTopReleases, getRelease } = require('../utils/supabase-client');

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`API Request: ${req.method} ${req.url}`);
  
  // Determine which endpoint was requested
  const isTopReleasesRequest = req.url.includes('/top');
  const isReleaseByIdRequest = req.url.match(/\/releases\/[a-zA-Z0-9-]+$/);
  
  // Route to the appropriate handler
  if (isTopReleasesRequest) {
    return await getTopReleasesHandler(req, res);
  } else if (isReleaseByIdRequest) {
    return await getReleaseByIdHandler(req, res);
  } else {
    return await getReleasesHandler(req, res);
  }
};

// Handler for GET /api/releases (standard releases listing)
async function getReleasesHandler(req, res) {
  // Get query parameters
  const { label, limit = 100, page = 1 } = req.query;
  const labelId = label; // For clarity
  
  // Log the request
  console.log(`Fetching releases with params: label=${labelId}, limit=${limit}, page=${page}`);
  
  let client = null;
  try {
    // First attempt: Try using Supabase client directly as primary method
    try {
      console.log('Using Supabase client as primary method for fetching releases');
      const supabaseReleases = await getReleases({ labelId, limit, page });
      
      if (supabaseReleases && supabaseReleases.length > 0) {
        const response = {
          releases: supabaseReleases,
          meta: {
            count: supabaseReleases.length,
            source: 'supabase-client-primary',
            timestamp: new Date().toISOString()
          }
        };
        
        logResponse(response, '/api/releases');
        return res.status(200).json(response);
      } else {
        console.log('No releases found via Supabase client, trying PostgreSQL');
      }
    } catch (supabaseError) {
      console.error('Error with Supabase client:', supabaseError);
      console.log('Falling back to direct PostgreSQL connection');
    }
    
    // Second attempt: Try PostgreSQL direct connection
    try {
      const pool = getPool();
      client = await pool.connect();
      
      // Get schema information for debugging
      console.log('Checking database schema...');
      const releaseSchema = await getTableSchema(client, 'releases');
      
      if (!releaseSchema || releaseSchema.length === 0) {
        throw new Error('Unable to retrieve releases schema');
      }
      
      // Debug column names
      console.log('Releases columns:', releaseSchema.map(c => c.column_name).join(', '));
      
      // Prepare the query
      let queryText = `
        SELECT 
          r.id, 
          r.title, 
          r.name,
          r.release_date, 
          r.artwork_url, 
          r.cover_art_url,
          r.spotify_id,
          r.label_id,
          STRING_AGG(a.name, ', ') as artist_names,
          JSON_AGG(
            json_build_object(
              'id', a.id, 
              'name', a.name,
              'imageUrl', COALESCE(a.profile_image_url, a.profile_image_small_url, a.profile_image_large_url)
            )
          ) as artists_json
        FROM releases r
        LEFT JOIN release_artists ra ON r.id = ra.release_id
        LEFT JOIN artists a ON ra.artist_id = a.id
      `;
      
      const queryParams = [];
      let paramIndex = 1;
      
      // Add WHERE clause for label filtering
      if (labelId) {
        queryText += ` WHERE r.label_id = $${paramIndex}`;
        queryParams.push(labelId);
        paramIndex++;
      }
      
      // Add GROUP BY, ORDER BY, and LIMIT clauses
      queryText += `
        GROUP BY r.id
        ORDER BY r.release_date DESC
        LIMIT $${paramIndex}
      `;
      queryParams.push(parseInt(limit));
      
      console.log('Executing query with params:', queryParams);
      
      // Execute the query
      const result = await client.query(queryText, queryParams);
      
      if (result.rows.length === 0) {
        console.log('No releases found with direct query, trying simpler query...');
        
        // Try a simpler query without joins as fallback
        const fallbackQuery = `
          SELECT * FROM releases
          ${labelId ? 'WHERE label_id = $1' : ''}
          ORDER BY release_date DESC
          LIMIT $${labelId ? 2 : 1}
        `;
        const fallbackParams = labelId ? [labelId, parseInt(limit)] : [parseInt(limit)];
        
        const fallbackResult = await client.query(fallbackQuery, fallbackParams);
        
        if (fallbackResult.rows.length === 0) {
          // No releases found with any PostgreSQL query method
          console.log('No releases found with any PostgreSQL query, returning 404');
          return res.status(404).json({
            error: 'No releases found',
            meta: { 
              label: labelId,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Process fallback results (simple query without artist info)
        const processedReleases = fallbackResult.rows.map(release => ({
          id: release.id,
          title: release.title || release.name,
          artists: [], // No artist info in fallback
          releaseDate: release.release_date,
          artworkUrl: release.artwork_url || release.cover_art_url,
          spotifyId: release.spotify_id
        }));
        
        const response = {
          releases: processedReleases,
          meta: {
            count: processedReleases.length,
            source: 'fallback-query',
            timestamp: new Date().toISOString()
          }
        };
        
        logResponse(response, '/api/releases');
        return res.status(200).json(response);
      }
      
      // Process results
      const processedReleases = result.rows.map(release => {
        let artists = [];
        
        // Parse the JSON array of artists if available
        if (release.artists_json && release.artists_json !== '[null]') {
          try {
            artists = release.artists_json.filter(a => a && a.id);
          } catch (e) {
            console.error('Error parsing artists JSON:', e);
          }
        }
        
        return {
          id: release.id,
          title: release.title || release.name,
          artists,
          releaseDate: release.release_date,
          artworkUrl: release.artwork_url || release.cover_art_url,
          spotifyId: release.spotify_id
        };
      });
      
      const response = {
        releases: processedReleases,
        meta: {
          count: processedReleases.length,
          source: 'direct-query',
          timestamp: new Date().toISOString()
        }
      };
      
      logResponse(response, '/api/releases');
      return res.status(200).json(response);
      
    } catch (pgError) {
      console.error('PostgreSQL query error:', pgError);
      
      // If PostgreSQL query fails, fallback to Supabase client again
      console.log('Falling back to Supabase client for releases after PostgreSQL failure');
      const supabaseReleases = await getReleases({ labelId, limit, page });
      
      if (supabaseReleases && supabaseReleases.length > 0) {
        const response = {
          releases: supabaseReleases,
          meta: {
            count: supabaseReleases.length,
            source: 'supabase-client-fallback',
            timestamp: new Date().toISOString()
          }
        };
        
        logResponse(response, '/api/releases (supabase fallback)');
        return res.status(200).json(response);
      }
      
      // If all methods fail, return an error
      console.error('All release fetching methods failed');
      return res.status(500).json({
        error: 'Failed to fetch releases',
        message: pgError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in releases handler:', error);
    return res.status(500).json({
      error: 'Failed to fetch releases',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Handler for GET /api/releases/top
async function getTopReleasesHandler(req, res) {
  // Get query parameters
  const { label, limit = 10 } = req.query;
  const labelId = label; // For clarity
  
  // Log the request
  console.log(`[/api/releases/top] Fetching top releases with params: label=${labelId}, limit=${limit}`);
  
  let client = null;
  try {
    // First approach: Try using Supabase client
    try {
      console.log('[/api/releases/top] Using Supabase client for fetching top releases');
      
      const topReleases = await getTopReleases({ labelId, limit: parseInt(limit) });
      
      const response = {
        releases: topReleases || [],
        meta: {
          count: topReleases ? topReleases.length : 0,
          source: 'supabase-client',
          timestamp: new Date().toISOString(),
          params: { label: labelId, limit }
        }
      };
      
      logResponse(response, '/api/releases/top');
      return res.status(200).json(response);
      
    } catch (supabaseError) {
      console.error('[/api/releases/top] Error with Supabase client:', supabaseError);
      console.log('[/api/releases/top] Falling back to direct PostgreSQL connection');
      
      // Fall back to direct PostgreSQL connection
      const pool = getPool();
      client = await pool.connect();
      
      // Get schema information for debugging
      console.log('[/api/releases/top] Checking database schema...');
      try {
        const releaseSchema = await getTableSchema(client, 'releases');
        console.log('[/api/releases/top] Release schema:', JSON.stringify(releaseSchema));
      } catch (schemaError) {
        console.error('[/api/releases/top] Error fetching schema:', schemaError);
      }
      
      // Construct a basic SQL query for top releases
      let query = `
        SELECT r.*, COUNT(r.id) AS play_count
        FROM releases r
      `;
      
      const params = [];
      
      // Add label filter if provided
      if (labelId) {
        // Add join with label table
        query += `
          JOIN labels l ON r.label_id = l.id
          WHERE l.id = $1
        `;
        params.push(labelId === 'buildit-records' ? '1' : labelId);
      }
      
      // Add group by, order by, and limit
      query += `
        GROUP BY r.id
        ORDER BY play_count DESC
        LIMIT $${params.length + 1}
      `;
      params.push(parseInt(limit));
      
      console.log(`[/api/releases/top] Executing fallback SQL query: ${query}`, params);
      
      try {
        const result = await client.query(query, params);
        const releases = result.rows;
        
        const response = {
          releases: releases || [],
          meta: {
            count: releases ? releases.length : 0,
            source: 'postgres-direct-fallback',
            timestamp: new Date().toISOString(),
            params: { label: labelId, limit }
          }
        };
        
        logResponse(response, '/api/releases/top (fallback)');
        return res.status(200).json(response);
      } catch (sqlError) {
        console.error('[/api/releases/top] Error executing fallback SQL query:', sqlError);
        throw sqlError;
      }
    }
  } catch (error) {
    console.error('[/api/releases/top] Final error in top releases handler:', error);
    
    // Return a 500 error with detailed information
    return res.status(500).json({
      error: 'Failed to fetch top releases',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Handler for GET /api/releases/:id
async function getReleaseByIdHandler(req, res) {
  // Extract release ID from the URL
  const urlParts = req.url.split('/');
  const releaseId = urlParts[urlParts.length - 1];
  
  if (!releaseId) {
    return res.status(400).json({ error: 'Missing release ID' });
  }
  
  console.log(`Fetching release details for ID: ${releaseId}`);
  
  let client = null;
  try {
    // First try Supabase client
    try {
      const release = await getRelease(releaseId);
      
      if (release) {
        return res.status(200).json({
          success: true,
          data: { release },
          timestamp: new Date().toISOString()
        });
      }
    } catch (supabaseError) {
      console.error('Error fetching release with Supabase:', supabaseError);
      console.log('Falling back to direct PostgreSQL connection');
    }
    
    // Fall back to direct PostgreSQL connection
    const pool = getPool();
    client = await pool.connect();
    
    // Query to fetch release by ID with related artist information
    const query = `
      SELECT 
        r.*,
        JSON_AGG(
          json_build_object(
            'id', a.id,
            'name', a.name,
            'imageUrl', COALESCE(a.profile_image_url, a.profile_image_small_url)
          )
        ) as artists
      FROM releases r
      LEFT JOIN release_artists ra ON r.id = ra.release_id
      LEFT JOIN artists a ON ra.artist_id = a.id
      WHERE r.id = $1
      GROUP BY r.id
    `;
    
    const result = await client.query(query, [releaseId]);
    
    if (result.rows.length === 0) {
      console.log(`No release found with ID: ${releaseId}`);
      return res.status(404).json({
        success: false,
        error: 'Release not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const release = result.rows[0];
    
    // Clean up artists array
    if (release.artists && release.artists !== '[null]') {
      try {
        release.artists = release.artists.filter(a => a && a.id);
      } catch (e) {
        console.error('Error parsing artists JSON:', e);
        release.artists = [];
      }
    } else {
      release.artists = [];
    }
    
    return res.status(200).json({
      success: true,
      data: { release },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching release details:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching release details',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}
