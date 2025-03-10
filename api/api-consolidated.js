/**
 * Consolidated API handlers for artist and release endpoints
 * This approach avoids potential issues with the original endpoint files
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require('@supabase/supabase-js');
const { addCorsHeaders, getPool, formatResponse } = require('./utils/db-utils');
/* eslint-enable @typescript-eslint/no-var-requires */

// Initialize database connection for PostgreSQL direct access
let pool;
try {
  console.log('Attempting to initialize database pool...');
  pool = getPool();
  console.log('Database pool initialized successfully!');
} catch (error) {
  console.error(`Database pool initialization error: ${error.message}`);
}

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`API-Consolidated Request: ${req.method} ${req.url}`);

  // Parse the URL to determine which handler to use
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(segment => segment);
  
  // Log the path segments for debugging
  console.log('Path segments:', pathSegments);
  
  // Get the type of resource requested (artist or release)
  let resourceType = pathSegments[1]; // [0] is 'api', [1] is the resource type
  
  // Handle both singular and plural forms
  if (resourceType === 'artists') resourceType = 'artist';
  if (resourceType === 'releases') resourceType = 'release';
  
  console.log(`Resource type: ${resourceType}`);
  
  // Check if there's a specific ID
  const resourceId = pathSegments[2];
  
  // Get Supabase configuration
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL;
                     
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase configuration check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseKey ? 'present' : 'missing',
  });
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: null
    });
  }
  
  try {
    // Route to the correct handler based on the path
    if (resourceType === 'artist') {
      if (resourceId) {
        // Handle specific artist request - not implemented in this version
        return res.status(200).json({
          success: false,
          message: 'Specific artist endpoint not implemented in consolidated API',
          data: null
        });
      } else {
        // Handle all artists request
        return await handleAllArtists(req, res);
      }
    } else if (resourceType === 'release') {
      if (resourceId) {
        // Handle specific release request - not implemented in this version
        return res.status(200).json({
          success: false,
          message: 'Specific release endpoint not implemented in consolidated API',
          data: null
        });
      } else {
        // Handle all releases request
        return await handleAllReleases(req, res);
      }
    } else {
      // Handle unsupported resource type
      return res.status(200).json({
        success: false,
        message: `Unsupported resource type: ${resourceType}`,
        data: null
      });
    }
  } catch (error) {
    console.error(`Unexpected error in API handler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Server error: ${error.message}`,
      data: null
    });
  }
};

/**
 * Handler for GET /api/artist - List all artists
 */
async function handleAllArtists(req, res) {
  console.log('Handling request for all artists');
  
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL;
                     
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  try {
    // Initialize database pool for direct SQL
    let localPool;
    try {
      console.log('Initializing local pool for direct query');
      localPool = getPool();
      console.log('Local pool initialized successfully');
    } catch (poolError) {
      console.error(`Failed to initialize local pool: ${poolError.message}`);
      localPool = null;
    }
    
    // Use direct SQL query approach
    if (localPool) {
      try {
        console.log('Using direct SQL approach for artists');
        const query = 'SELECT * FROM artists ORDER BY name';
        console.log('Executing SQL query:', query);
        
        const result = await localPool.query(query);
        console.log(`SQL query result: ${result.rowCount} rows`);
        
        // If we got results, format and return them
        if (result && result.rows && result.rows.length >= 0) {
          const artists = result.rows;
          console.log(`Returning ${artists.length} artists from SQL query`);
          
          return res.status(200).json({
            success: true,
            message: `Found ${artists.length} artists`,
            data: {
              artists: artists
            }
          });
        } else {
          console.log('SQL query returned no results, falling back to REST API');
        }
      } catch (sqlError) {
        console.error(`SQL query error: ${sqlError.message}`);
        console.log('SQL query failed, falling back to REST API');
      }
    }
    
    // Fallback to a more resilient approach
    try {
      console.log('Using fallback approach with simple fetch');
      // Using Supabase REST API directly as a fallback
      const supabaseRestUrl = `${supabaseUrl}/rest/v1/artists?select=*`;
      console.log(`Fetching from REST API: ${supabaseRestUrl}`);
      
      const response = await fetch(supabaseRestUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      
      if (response.ok) {
        const artists = await response.json();
        console.log(`Fetched ${artists.length} artists from REST API`);
        
        return res.status(200).json({
          success: true,
          message: `Found ${artists.length} artists`,
          data: {
            artists: artists
          }
        });
      } else {
        const errorText = await response.text();
        console.error(`REST API error: ${response.status} - ${errorText}`);
        throw new Error(`REST API error: ${response.status}`);
      }
    } catch (fetchError) {
      console.error(`Fetch error: ${fetchError.message}`);
      
      // Last resort: return empty array with error message
      return res.status(200).json({
        success: false,
        message: `Error fetching artists: ${fetchError.message}`,
        data: {
          artists: [] // Return empty array as last resort
        }
      });
    }
  } catch (error) {
    console.error(`Unexpected error in getAllArtistsHandler: ${error.message}`);
    
    return res.status(200).json({
      success: false,
      message: `Server error: ${error.message}`,
      data: {
        artists: [] // Return empty array on error
      }
    });
  }
}

/**
 * Handler for GET /api/release - List all releases
 */
async function handleAllReleases(req, res) {
  console.log('Handling request for all releases');
  
  // Check for query parameters
  const label = req.query.label;
  const artist = req.query.artist;
  
  console.log('Query parameters:', { label, artist });
  
  // Get Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || 
                     process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;
                    
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  try {
    // Initialize database pool for direct SQL
    let localPool;
    try {
      console.log('Initializing local pool for direct query');
      localPool = getPool();
      console.log('Local pool initialized successfully');
    } catch (poolError) {
      console.error(`Failed to initialize local pool: ${poolError.message}`);
      localPool = null;
    }
    
    // Use direct SQL query approach
    if (localPool) {
      try {
        console.log('Using direct SQL approach for releases');
        
        // Construct query based on parameters
        let query, queryParams = [];
        let paramIndex = 1;
        
        // Base query with join to get artist information
        const baseQuery = `
          SELECT r.*, a.name as artist_name, a.id as artist_id 
          FROM releases r
          LEFT JOIN release_artists ra ON r.id = ra.release_id
          LEFT JOIN artists a ON ra.artist_id = a.id
        `;
        
        // Add WHERE clauses based on parameters
        let whereClause = '';
        
        if (label) {
          whereClause += `${whereClause ? ' AND ' : ' WHERE '}r.label_id = $${paramIndex++}`;
          queryParams.push(label);
        }
        
        if (artist) {
          whereClause += `${whereClause ? ' AND ' : ' WHERE '}ra.artist_id = $${paramIndex++}`;
          queryParams.push(artist);
        }
        
        // Complete query with ordering
        query = `${baseQuery}${whereClause} ORDER BY r.release_date DESC NULLS LAST, r.title ASC`;
        
        console.log('Executing SQL query:', query, 'with params:', queryParams);
        
        const result = await localPool.query(query, queryParams);
        console.log(`SQL query result: ${result.rowCount} rows`);
        
        // Format and return releases with artist info
        if (result && result.rows && result.rows.length >= 0) {
          const formattedReleases = formatReleasesWithArtists(result.rows);
          console.log(`Returning ${formattedReleases.length} formatted releases from SQL query`);
          
          return res.status(200).json({
            success: true,
            message: `Found ${formattedReleases.length} releases`,
            data: {
              releases: formattedReleases
            }
          });
        } else {
          console.log('SQL query returned no results, falling back to REST API');
        }
      } catch (sqlError) {
        console.error(`SQL query error: ${sqlError.message}`);
        console.log('SQL query failed, falling back to REST API');
      }
    }
    
    // Fallback to REST API approach
    try {
      console.log('Using fallback approach with REST API');
      
      // Base URL for releases endpoint
      let supabaseRestUrl = `${supabaseUrl}/rest/v1/releases?select=*`;
      
      // Add parameters if specified
      if (label) {
        supabaseRestUrl += `&label_id=eq.${encodeURIComponent(label)}`;
      }
      
      console.log(`Fetching from REST API: ${supabaseRestUrl}`);
      
      const response = await fetch(supabaseRestUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      
      if (response.ok) {
        const releases = await response.json();
        console.log(`Fetched ${releases.length} releases from REST API`);
        
        // If artist is specified, we need to filter the results client-side
        // as the artist relationship query is more complex for the REST API
        let filteredReleases = releases;
        
        if (artist && filteredReleases.length > 0) {
          // Get the artist-release relationships
          const artistReleasesUrl = `${supabaseUrl}/rest/v1/release_artists?artist_id=eq.${encodeURIComponent(artist)}&select=release_id`;
          const artistReleasesResponse = await fetch(artistReleasesUrl, {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (artistReleasesResponse.ok) {
            const artistReleases = await artistReleasesResponse.json();
            const releaseIds = artistReleases.map(ar => ar.release_id);
            
            // Filter releases to only those associated with the artist
            filteredReleases = releases.filter(release => releaseIds.includes(release.id));
            console.log(`Filtered to ${filteredReleases.length} releases for artist ${artist}`);
          }
        }
        
        return res.status(200).json({
          success: true,
          message: `Found ${filteredReleases.length} releases`,
          data: {
            releases: filteredReleases
          }
        });
      } else {
        const errorText = await response.text();
        console.error(`REST API error: ${response.status} - ${errorText}`);
        throw new Error(`REST API error: ${response.status}`);
      }
    } catch (fetchError) {
      console.error(`Fetch error: ${fetchError.message}`);
      
      // Last resort: return empty array with error message
      return res.status(200).json({
        success: false,
        message: `Error fetching releases: ${fetchError.message}`,
        data: {
          releases: [] // Return empty array as last resort
        }
      });
    }
  } catch (error) {
    console.error(`Unexpected error in getAllReleasesHandler: ${error.message}`);
    
    return res.status(200).json({
      success: false,
      message: `Server error: ${error.message}`,
      data: {
        releases: [] // Return empty array on error
      }
    });
  }
}

/**
 * Helper function to format releases with artist information
 * Processes results from a direct SQL query that joins releases and artists
 */
function formatReleasesWithArtists(rows) {
  // Map to store releases with their artists
  const releasesMap = new Map();
  
  // Process each row and combine artists for the same release
  rows.forEach(row => {
    const releaseId = row.id;
    
    if (!releasesMap.has(releaseId)) {
      // Create a new release entry
      const release = {
        id: releaseId,
        title: row.title,
        release_date: row.release_date,
        artwork_url: row.artwork_url,
        spotify_url: row.spotify_url,
        label_id: row.label_id,
        release_type: row.release_type,
        created_at: row.created_at,
        updated_at: row.updated_at,
        artists: []
      };
      
      releasesMap.set(releaseId, release);
    }
    
    // Get the release from the map
    const release = releasesMap.get(releaseId);
    
    // Add artist info if present and not already added
    if (row.artist_id && !release.artists.some(a => a.id === row.artist_id)) {
      release.artists.push({
        id: row.artist_id,
        name: row.artist_name || 'Unknown Artist'
      });
    }
  });
  
  // Convert map values to array and return
  return Array.from(releasesMap.values());
}
