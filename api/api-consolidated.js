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
        // Handle specific artist request
        if (pathSegments[3] === 'releases') {
          // Handle artist releases (e.g., /api/artist/123/releases)
          return await handleArtistReleases(req, res, resourceId);
        } else {
          // Handle single artist by ID
          return await handleSingleArtist(req, res, resourceId);
        }
      } else {
        // Handle all artists request
        return await handleAllArtists(req, res);
      }
    } else if (resourceType === 'releases' && pathSegments[2] === 'releases' && pathSegments[3]) {
      // Handle "/api/artists/releases/:id" pattern
      return await handleArtistReleases(req, res, pathSegments[3]);
    } else if (resourceType === 'release') {
      if (resourceId) {
        // Handle specific release request
        if (pathSegments[3] === 'tracks') {
          // Handle release tracks (e.g., /api/release/123/tracks)
          return await handleReleaseTracks(req, res, resourceId);
        } else {
          // Handle single release by ID
          return await handleSingleRelease(req, res, resourceId);
        }
      } else {
        // Handle all releases request
        return await handleAllReleases(req, res);
      }
    } else if (resourceType === 'track') {
      if (resourceId) {
        // Handle specific track request
        return await handleSingleTrack(req, res, resourceId);
      } else {
        // Handle all tracks request
        return await handleAllTracks(req, res);
      }
    } else if (resourceType === 'status' || resourceType === 'health-check' || pathSegments[1] === 'health') {
      // Handle health check endpoint
      return res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    } else if (resourceType === 'diagnostic') {
      return await handleDiagnostic(req, res);
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
            data: artists
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
          data: artists
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
        data: [] // Return empty array as last resort
      });
    }
  } catch (error) {
    console.error(`Unexpected error in getAllArtistsHandler: ${error.message}`);
    
    return res.status(200).json({
      success: false,
      message: `Server error: ${error.message}`,
      data: [] // Return empty array on error
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

// New handlers for specific artist and release endpoints
async function handleSingleArtist(req, res, artistId) {
  console.log(`Handling request for single artist ${artistId}`);
  
  const supabaseUrl = process.env.SUPABASE_URL || 
                     process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;
                    
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: null
    });
  }
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Support both UUID and Spotify ID formats
  let query;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artistId);
  
  if (isUUID) {
    // If the ID is a UUID, use the id column
    query = supabase
      .from('artists')
      .select('*')
      .eq('id', artistId);
  } else {
    // Otherwise assume it's a Spotify ID
    query = supabase
      .from('artists')
      .select('*')
      .eq('id', artistId);
  }
  
  const { data: artist, error } = await query.single();
  
  if (error) {
    console.error(`Error fetching artist ${artistId}: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error fetching artist ${artistId}: ${error.message}`,
      data: null
    });
  }
  
  if (!artist) {
    return res.status(200).json({
      success: false,
      message: `Artist with ID ${artistId} not found`,
      data: null
    });
  }
  
  console.log(`Found artist: ${artist.name}`);
  
  return res.status(200).json({
    success: true,
    message: 'Artist found',
    data: artist
  });
}

async function handleArtistReleases(req, res, artistId) {
  console.log(`Handling request for artist ${artistId} releases`);
  
  // Get database connection info
  const dbUser = process.env.POSTGRES_USER || process.env.DB_USER;
  const dbPass = process.env.POSTGRES_PASSWORD || process.env.DB_PASS;
  const dbHost = process.env.POSTGRES_HOST || process.env.DB_HOST;
  const dbPort = process.env.POSTGRES_PORT || process.env.DB_PORT || '5432';
  const dbName = process.env.POSTGRES_DATABASE || process.env.DB_NAME;
  
  // Fallback to Supabase if direct DB credentials aren't available
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL;
                      
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  try {
    // Debug output - inspect the artistId
    console.log(`Artist ID type: ${typeof artistId}, value: "${artistId}"`);
    
    // Attempt with PostgreSQL direct connection first
    if (dbHost && dbUser && dbPass && dbName) {
      console.log('Using direct PostgreSQL connection for artist releases query');
      
      const { Pool } = require('pg');
      const pool = new Pool({
        user: dbUser,
        password: dbPass,
        host: dbHost,
        port: dbPort,
        database: dbName,
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        // First get the database schema to understand the structure
        const schemaQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'release_artists'
        `;
        
        const schemaResult = await pool.query(schemaQuery);
        console.log('Release_artists schema:', JSON.stringify(schemaResult.rows));
        
        // Also check the artist ID column
        const artistSchemaQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'artists' AND column_name = 'id'
        `;
        
        const artistSchemaResult = await pool.query(artistSchemaQuery);
        console.log('Artists ID column info:', JSON.stringify(artistSchemaResult.rows));
        
        // First try to get releases via the release_artists join table
        const joinQuery = `
          SELECT r.* 
          FROM releases r
          JOIN release_artists ra ON r.id = ra.release_id
          WHERE ra.artist_id = $1
          ORDER BY r.release_date DESC NULLS LAST
        `;
        
        console.log(`Executing join query with artist ID: ${artistId}`);
        const result = await pool.query(joinQuery, [artistId]);
        console.log(`Found ${result.rows.length} releases for artist ${artistId} using join table`);
        
        if (result.rows.length > 0) {
          return res.status(200).json({
            success: true,
            message: `Found ${result.rows.length} releases for artist ${artistId}`,
            data: result.rows
          });
        }
        
        // If no results, try direct artist_id lookup
        const directQuery = `
          SELECT * FROM releases 
          WHERE artist_id = $1
          ORDER BY release_date DESC NULLS LAST
        `;
        
        console.log(`Executing direct query with artist ID: ${artistId}`);
        const directResult = await pool.query(directQuery, [artistId]);
        console.log(`Found ${directResult.rows.length} releases for artist ${artistId} using direct query`);
        
        return res.status(200).json({
          success: true,
          message: `Found ${directResult.rows.length} releases for artist ${artistId}`,
          data: directResult.rows || []
        });
      } catch (pgError) {
        console.error(`PostgreSQL error: ${pgError.message}`);
        // Fall through to Supabase approach
      } finally {
        // Always close the pool
        await pool.end();
      }
    }
    
    // Fallback to Supabase approach
    if (supabaseUrl && supabaseKey) {
      console.log('Falling back to Supabase for artist releases query');
      
      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // CRITICAL CHANGE: Instead of using the Supabase query builder which is giving
      // the "JSON object requested, multiple rows returned" error, we'll use RPC to 
      // call a custom server-side function that returns an array
      
      // First get the artist details to verify we have a valid ID
      console.log(`Checking if artist ${artistId} exists in database`);
      
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .limit(1);
        
      if (artistError) {
        console.error(`Error verifying artist: ${artistError.message}`);
      } else {
        console.log(`Artist check: Found ${artistData?.length || 0} artists with ID ${artistId}`);
      }
      
      // First attempt: Try using a raw SQL query via RPC
      let releases = [];
      
      try {
        console.log(`Using raw SQL via RPC for artist ${artistId}`);
        
        // This uses rpc to return an array even when the query would normally
        // cause the "JSON object requested, multiple rows returned" error
        const { data, error } = await supabase.rpc('get_artist_releases', {
          artist_id_param: artistId
        });
        
        if (error) {
          console.error(`RPC error: ${error.message}`);
          
          // If RPC fails (e.g., function doesn't exist), fall back to manual queries
          
          // First try release_artists
          const { data: releaseArtists, error: raError } = await supabase
            .from('release_artists')
            .select('release_id')
            .eq('artist_id', artistId);
          
          if (!raError && releaseArtists && releaseArtists.length > 0) {
            console.log(`Found ${releaseArtists.length} release associations for artist ${artistId}`);
            
            // Get the release IDs associated with this artist
            const releaseIds = releaseArtists.map(ra => ra.release_id);
            
            // Create an array to collect all releases
            const allReleases = [];
            
            // Process release IDs in batches to avoid "in" clause limitations
            const batchSize = 20;
            for (let i = 0; i < releaseIds.length; i += batchSize) {
              const batchIds = releaseIds.slice(i, i + batchSize);
              
              // Get this batch of releases
              const { data: batchReleases, error: batchError } = await supabase
                .from('releases')
                .select('*')
                .in('id', batchIds);
              
              if (!batchError && batchReleases) {
                allReleases.push(...batchReleases);
              }
            }
            
            // Set the releases to the collected results
            releases = allReleases;
          } else {
            // Last resort: try direct artist_id on releases
            console.log('Trying direct artist_id query as last resort');
            
            const { data: directData, error: directError } = await supabase
              .from('releases')
              .select('*')
              .eq('artist_id', artistId);
            
            if (!directError && directData) {
              releases = directData;
            } else {
              console.error(`Direct query error: ${directError?.message}`);
            }
          }
        } else if (data) {
          releases = data;
        }
      } catch (error) {
        console.error(`Error in Supabase queries: ${error.message}`);
      }
      
      console.log(`Final result: Found ${releases.length} releases for artist ${artistId}`);
      
      return res.status(200).json({
        success: true,
        message: `Found ${releases.length} releases for artist ${artistId}`,
        data: releases
      });
    }
    
    // No database connections available
    return res.status(200).json({
      success: false,
      message: 'Database configuration missing',
      data: []
    });
  } catch (error) {
    console.error(`Unexpected error in handleArtistReleases: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error fetching artist releases: ${error.message}`,
      data: []
    });
  }
}

async function handleSingleRelease(req, res, releaseId) {
  console.log(`Handling request for single release ${releaseId}`);
  
  const supabaseUrl = process.env.SUPABASE_URL || 
                     process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;
                    
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: []
    });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First attempt: Try to get release with artist info using nested select
    try {
      const { data: release, error } = await supabase
        .from('releases')
        .select(`
          *,
          artists (*)
        `)
        .eq('id', releaseId)
        .single();
      
      if (!error && release) {
        console.log(`Found release: ${release.title}`);
        
        return res.status(200).json({
          success: true,
          message: 'Release found',
          data: release
        });
      } else {
        console.log(`Error with nested query, falling back to simple query: ${error?.message}`);
      }
    } catch (nestedError) {
      console.error('Error with nested query:', nestedError.message);
    }
    
    // Fallback: Simple query without artist info
    const { data: release, error } = await supabase
      .from('releases')
      .select('*')
      .eq('id', releaseId)
      .single();
    
    if (error) {
      console.error(`Error fetching release ${releaseId}: ${error.message}`);
      return res.status(200).json({
        success: false,
        message: `Error fetching release ${releaseId}: ${error.message}`,
        data: []
      });
    }
    
    if (!release) {
      return res.status(200).json({
        success: false,
        message: `Release with ID ${releaseId} not found`,
        data: []
      });
    }
    
    console.log(`Found release (basic info): ${release.title}`);
    
    return res.status(200).json({
      success: true,
      message: 'Release found',
      data: release
    });
  } catch (error) {
    console.error(`Unexpected error in handleSingleRelease: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: []
    });
  }
}

async function handleReleaseTracks(req, res, releaseId) {
  console.log(`Handling request for release ${releaseId} tracks`);
  
  const supabaseUrl = process.env.SUPABASE_URL || 
                     process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;
                    
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: []
    });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get tracks for the release
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('release_id', releaseId)
      .order('track_number', { ascending: true });
    
    if (error) {
      console.error(`Error fetching tracks for release ${releaseId}: ${error.message}`);
      return res.status(200).json({
        success: false,
        message: `Error fetching tracks for release ${releaseId}: ${error.message}`,
        data: []
      });
    }
    
    console.log(`Found ${tracks.length} tracks for release ${releaseId}`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${tracks.length} tracks for release ${releaseId}`,
      data: tracks
    });
  } catch (error) {
    console.error(`Unexpected error in handleReleaseTracks: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: []
    });
  }
}

async function handleAllTracks(req, res) {
  console.log('Handling request for all tracks');
  
  const supabaseUrl = process.env.SUPABASE_URL || 
                     process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;
                    
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: []
    });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all tracks
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('*')
      .order('title');
    
    if (error) {
      console.error(`Error fetching tracks: ${error.message}`);
      return res.status(200).json({
        success: false,
        message: `Error fetching tracks: ${error.message}`,
        data: []
      });
    }
    
    console.log(`Found ${tracks.length} tracks`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${tracks.length} tracks`,
      data: tracks
    });
  } catch (error) {
    console.error(`Unexpected error in handleAllTracks: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: []
    });
  }
}

async function handleSingleTrack(req, res, trackId) {
  console.log(`Handling request for single track ${trackId}`);
  
  const supabaseUrl = process.env.SUPABASE_URL || 
                     process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;
                    
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: null
    });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get track by ID
    const { data: track, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();
    
    if (error) {
      console.error(`Error fetching track ${trackId}: ${error.message}`);
      return res.status(200).json({
        success: false,
        message: `Error fetching track ${trackId}: ${error.message}`,
        data: null
      });
    }
    
    if (!track) {
      return res.status(200).json({
        success: false,
        message: `Track with ID ${trackId} not found`,
        data: null
      });
    }
    
    console.log(`Found track: ${track.title}`);
    
    return res.status(200).json({
      success: true,
      message: 'Track found',
      data: track
    });
  } catch (error) {
    console.error(`Unexpected error in handleSingleTrack: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: null
    });
  }
}

async function handleDiagnostic(req, res) {
  console.log("Handling diagnostic request");
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL;
                      
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                        process.env.VITE_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Test Supabase connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get database schema info
    const { data: schemasData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public');
    
    return res.status(200).json({
      success: true,
      message: 'Diagnostic information',
      data: {
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
        schemas: schemasData || [],
        errors: schemaError ? [schemaError.message] : []
      }
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: `Diagnostic error: ${error.message}`,
      data: {}
    });
  }
}
