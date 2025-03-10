/**
 * Consolidated release endpoint handler
 * Handles multiple release endpoints through path detection:
 * - /api/release - List all releases
 * - /api/release?label=id - List releases by label
 * - /api/release/[id] - Get release by ID
 * - /api/release/[id]/tracks - Get tracks for a release
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require('@supabase/supabase-js')
const { addCorsHeaders, getPool, formatResponse, hasColumn, getTableSchema } = require('./utils/db-utils')
/* eslint-enable @typescript-eslint/no-var-requires */

// Initialize database connection for PostgreSQL direct access
let pool;
try {
  pool = getPool();
} catch (error) {
  console.error('Database pool initialization error (non-fatal):', error.message);
}

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`Release API Request: ${req.method} ${req.url}`);
  
  // Parse the URL to determine which endpoint was requested
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  try {
    // GET /api/release - List all releases
    if (pathSegments.length === 1) {
      // Check if there's a label query parameter
      const labelId = url.searchParams.get('label');
      
      if (labelId) {
        return await getReleasesByLabelHandler(labelId, req, res);
      } else {
        return await getAllReleasesHandler(req, res);
      }
    }
    // GET /api/release/[id] - Get release by ID
    else if (pathSegments.length === 2) {
      const releaseId = pathSegments[1];
      return await getReleaseByIdHandler(releaseId, req, res);
    }
    // GET /api/release/[id]/tracks - Get tracks for a release
    else if (pathSegments.length === 3 && pathSegments[2] === 'tracks') {
      const releaseId = pathSegments[1];
      return await getReleaseTracksHandler(releaseId, req, res);
    }
    else {
      return res.status(404).json({
        success: false,
        message: `Not found: ${req.url}`,
        data: []
      });
    }
  } catch (error) {
    console.error(`Release endpoint error: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: []
    });
  }
};

// Handler for GET /api/release - List all releases
async function getAllReleasesHandler(req, res) {
  console.log('Fetching all releases - handler entry point');
  
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
  
  console.log('Supabase configuration check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: []
    });
  }
  
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
            data: formattedReleases
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
        
        // For completeness, we should also try to get artist names for these releases
        // But we'll skip that for now to keep the fallback simple
        
        return res.status(200).json({
          success: true,
          message: `Found ${filteredReleases.length} releases`,
          data: filteredReleases
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
        data: [] // Return empty array as last resort
      });
    }
  } catch (error) {
    console.error(`Unexpected error in getAllReleasesHandler: ${error.message}`);
    
    return res.status(200).json({
      success: false,
      message: `Server error: ${error.message}`,
      data: [] // Return empty array on error
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

// Handler for GET /api/release?label=[id] - List releases by label
async function getReleasesByLabelHandler(labelId, req, res) {
  console.log(`Fetching releases for label ID: ${labelId}`);
  
  // Get pagination parameters with defaults
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  // Log request parameters for debugging
  console.log(`Request parameters: limit=${limit}, offset=${offset}, labelId=${labelId}`);
  
  // Process response in a consistent way
  const sendResponse = (success, message, data) => {
    console.log(`Sending response: success=${success}, message=${message}`);
    return res.status(200).json({
      success,
      message,
      data
    });
  };
  
  // Simple helper to check if a column exists in a schema
  const hasColumn = (schema, columnName) => {
    return schema.some(col => col.column_name === columnName);
  };
  
  // Try direct database query first
  if (pool) {
    try {
      console.log('Getting database client from pool');
      const client = await pool.connect();
      
      try {
        // First check database schema to understand column names
        console.log('Inspecting database schema for releases query...');
        
        // Query the schema for releases table
        const getTableSchema = async (tableName) => {
          const schemaQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
          `;
          const result = await client.query(schemaQuery, [tableName]);
          return result.rows;
        };
        
        // Get schema for all relevant tables
        const releasesSchema = await getTableSchema('releases');
        const labelsSchema = await getTableSchema('labels');
        const artistsSchema = await getTableSchema('artists');
        
        // Log schema information for debugging
        console.log('Schema inspection results:');
        console.log('- Releases columns:', releasesSchema.map(col => col.column_name).join(', '));
        console.log('- Labels columns:', labelsSchema.map(col => col.column_name).join(', '));
        console.log('- Artists columns:', artistsSchema.map(col => col.column_name).join(', '));
        
        // Determine the correct column names based on the schema
        const releaseLabelColumn = hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'labelId';
        const releaseIdColumn = hasColumn(releasesSchema, 'id') ? 'id' : 'release_id';
        const labelIdColumn = hasColumn(labelsSchema, 'id') ? 'id' : 'label_id';
        
        // Simple approach - Step 1: Get releases first without any joins
        console.log('Executing simple releases query without joins');
        
        // Simple query for releases by label - avoid joins completely
        const simpleQuery = `
          SELECT * FROM releases 
          WHERE ${releaseLabelColumn} = $1 
             OR ${releaseLabelColumn}::text = $1 
             OR ${releaseLabelColumn}::text LIKE $2
          ORDER BY release_date DESC 
          LIMIT $3 OFFSET $4
        `;
        
        console.log('Executing query:', simpleQuery);
        console.log('Parameters:', [labelId, `%${labelId}%`, limit, offset]);
        
        const releasesResult = await client.query(simpleQuery, [labelId, `%${labelId}%`, limit, offset]);
        
        if (releasesResult.rows.length === 0) {
          client.release();
          console.log('No releases found with simple query');
          
          // Try an alternative query with fuzzy matching
          try {
            console.log('Attempting alternative query approach');
            const altClient = await pool.connect();
            
            // Get the label name for fuzzy matching
            const labelQuery = 'SELECT name FROM labels WHERE id = $1 OR id::text = $1';
            const labelResult = await altClient.query(labelQuery, [labelId]);
            let labelName = '';
            
            if (labelResult.rows.length > 0) {
              labelName = labelResult.rows[0].name;
              console.log(`Found label name: ${labelName}`);
            } else {
              console.log('Label not found, using ID as search term');
              labelName = labelId;
            }
            
            // Try matching by label name
            const altQuery = `
              SELECT r.*
              FROM releases r
              JOIN labels l ON r.${releaseLabelColumn}::text = l.${labelIdColumn}::text 
                           OR l.name ILIKE $1
              ORDER BY r.release_date DESC
              LIMIT $2 OFFSET $3
            `;
            
            console.log('Executing alternative query with label name match');
            console.log('Parameters:', [`%${labelName}%`, limit, offset]);
            
            const altReleasesResult = await altClient.query(altQuery, [`%${labelName}%`, limit, offset]);
            altClient.release();
            
            if (altReleasesResult.rows.length === 0) {
              console.log('No releases found with alternative query');
              return sendResponse(true, 'No releases found for this label', []);
            }
            
            console.log(`Found ${altReleasesResult.rows.length} releases with alternative query`);
            return sendResponse(true, `Found ${altReleasesResult.rows.length} releases`, altReleasesResult.rows);
          } catch (altError) {
            console.error(`Alternative query error: ${altError.message}`);
            return sendResponse(true, 'Error with alternative query, returning empty set', []);
          }
        }
        
        console.log(`Found ${releasesResult.rows.length} releases`);
        
        // Step 2: Get the artist information separately to avoid relationship issues
        const artistIds = new Set();
        releasesResult.rows.forEach(release => {
          if (release.artist_id) {
            artistIds.add(release.artist_id.toString());
          } else if (release.artistId) {
            artistIds.add(release.artistId.toString());
          }
        });
        
        let artistsMap = {};
        
        if (artistIds.size > 0) {
          console.log(`Fetching artist details for ${artistIds.size} artists`);
          const artistIdsArray = Array.from(artistIds);
          
          // Use a simple IN query for artists to avoid complex joins
          const artistsQuery = `
            SELECT * FROM artists 
            WHERE id::text = ANY($1)
          `;
          
          try {
            const artistsResult = await client.query(artistsQuery, [artistIdsArray]);
            console.log(`Found ${artistsResult.rows.length} artists`);
            
            // Create a map of artist ID to artist data
            artistsResult.rows.forEach(artist => {
              const artistId = artist.id.toString();
              artistsMap[artistId] = artist;
            });
          } catch (artistError) {
            console.error(`Error fetching artists: ${artistError.message}`);
            // Continue with releases data only
          }
        }
        
        // Step 3: Manually join the releases with artists
        const releases = releasesResult.rows.map(release => {
          const artistId = (release.artist_id || release.artistId || '').toString();
          
          // Create a processed release with artist information if available
          const processedRelease = {
            ...release,
            artist: artistsMap[artistId] || null
          };
          
          return processedRelease;
        });
        
        client.release();
        console.log(`Successfully processed ${releases.length} releases with artist data`);
        
        return sendResponse(true, `Found ${releases.length} releases for label ${labelId}`, releases);
      } catch (queryError) {
        console.error(`Query error: ${queryError.message}`);
        client.release();
        
        // Try Supabase fallback
        console.log('Direct query failed, falling back to Supabase');
      }
    } catch (dbError) {
      console.error(`Database connection error: ${dbError.message}`);
      // Continue to Supabase fallback
    }
  }
  
  // If direct database query fails, try Supabase client
  console.log('Trying Supabase client for releases query');
  const supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL;
                   
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing');
    return sendResponse(false, 'Database configuration missing', []);
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Querying Supabase for releases');
    
    // Simple query to avoid relationship issues
    let query = supabase
      .from('releases')
      .select('*')
      
    // Add filter based on label
    if (labelId && labelId !== 'all') {
      if (labelId === 'buildit-records') {
        console.log('Using specific query for buildit-records label');
        query = query.eq('label_id', 1);
      } else {
        query = query.eq('label_id', labelId);
      }
    }
    
    // Add pagination
    query = query
      .order('release_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: releases, error } = await query;
    
    if (error) {
      console.error(`Supabase query error: ${error.message}`);
      
      // Try an alternative approach without relationships
      try {
        console.log('Trying alternative Supabase query with string matching');
        
        // First try to get the label name if we have an ID
        let labelName = '';
        if (labelId && labelId !== 'all') {
          const { data: labelData } = await supabase
            .from('labels')
            .select('name')
            .eq('id', labelId)
            .single();
          
          if (labelData) {
            labelName = labelData.name;
            console.log(`Found label name: ${labelName}`);
          }
        }
        
        // Use OR conditions with the label name and ID
        const { data: altReleases, error: altError } = await supabase
          .from('releases')
          .select('*')
          .or(`label_id.eq.${labelId},label_id.ilike.%${labelId}%${labelName ? ',label.name.ilike.%' + labelName + '%' : ''}`)
          .order('release_date', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (!altError && altReleases && altReleases.length > 0) {
          console.log(`Found ${altReleases.length} releases via alternative query`);
          return sendResponse(true, `Found ${altReleases.length} releases for label ${labelId}`, altReleases);
        }
      } catch (altError) {
        console.error(`Alternative query error: ${altError.message}`);
      }
      
      // Return empty array instead of error for better frontend experience
      return sendResponse(true, `No releases found for label ${labelId}`, []);
    }
    
    console.log(`Found ${releases?.length || 0} releases via Supabase query`);
    
    // If we successfully got releases, try to get artist information
    if (releases && releases.length > 0) {
      try {
        // Extract artist IDs
        const artistIds = releases
          .map(release => release.artist_id || release.artistId)
          .filter(id => id);
        
        // Get artist data if we have any artist IDs
        if (artistIds.length > 0) {
          const { data: artists } = await supabase
            .from('artists')
            .select('*')
            .in('id', artistIds);
          
          // Create a map for faster lookup
          const artistsMap = {};
          if (artists) {
            artists.forEach(artist => {
              artistsMap[artist.id] = artist;
            });
            
            // Attach artist data to releases
            releases.forEach(release => {
              const artistId = release.artist_id || release.artistId;
              if (artistId && artistsMap[artistId]) {
                release.artist = artistsMap[artistId];
              }
            });
          }
        }
      } catch (artistError) {
        console.error(`Error fetching artist data: ${artistError.message}`);
        // Continue with releases only
      }
    }
    
    return sendResponse(true, `Found ${releases?.length || 0} releases for label ${labelId}`, releases || []);
  } catch (supabaseError) {
    console.error(`Unexpected error in Supabase query: ${supabaseError.message}`);
    return sendResponse(true, 'Error fetching releases, returning empty set', []);
  }
}

// Handler for GET /api/release/[id] - Get release by ID
async function getReleaseByIdHandler(releaseId, req, res) {
  console.log(`Fetching release with ID: ${releaseId}`);
  
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
    
    // Get release by ID with artist info
    const { data: release, error } = await supabase
      .from('releases')
      .select(`
        *,
        artists (*)
      `)
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
    
    console.log(`Found release: ${release.title}`);
    
    return res.status(200).json({
      success: true,
      message: 'Release found',
      data: release
    });
  } catch (error) {
    console.error(`Unexpected error in getReleaseByIdHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: []
    });
  }
}

// Handler for GET /api/release/[id]/tracks - Get tracks for a release
async function getReleaseTracksHandler(releaseId, req, res) {
  console.log(`Fetching tracks for release ID: ${releaseId}`);
  
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
    console.error(`Unexpected error in getReleaseTracksHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: []
    });
  }
}
