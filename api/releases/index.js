// Serverless API handler for fetching releases
const { getPool, getTableSchema, hasColumn, logResponse, addCorsHeaders } = require('../utils/db-utils');
const { getReleases } = require('../utils/supabase-client');

// Handler for GET /api/releases
async function getReleasesHandler(req, res) {
  // Add CORS headers
  addCorsHeaders(res);

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
            source: 'supabase-fallback',
            error: pgError.message,
            timestamp: new Date().toISOString()
          }
        };
        
        logResponse(response, '/api/releases');
        return res.status(200).json(response);
      } else {
        // If Supabase also fails or returns no results, return error
        return res.status(404).json({
          error: 'No releases found after all attempts',
          meta: { 
            label: labelId,
            pgError: pgError.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Error fetching releases:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Export the handler
module.exports = getReleasesHandler;
