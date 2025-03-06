// Serverless API handler for fetching top releases
const { addCorsHeaders, logResponse, getTableSchema, getPool } = require('../utils/db-utils');
const { getTopReleases } = require('../utils/supabase-client');

// Handler for GET /api/releases/top
async function getTopReleasesHandler(req, res) {
  // Add CORS headers
  addCorsHeaders(res);

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

// Export the handler
module.exports = getTopReleasesHandler;
