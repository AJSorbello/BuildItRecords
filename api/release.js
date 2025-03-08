/**
 * Consolidated release endpoint handler
 * Handles multiple release endpoints through path detection:
 * - /api/release - List all releases
 * - /api/release?label=id - List releases by label
 * - /api/release/[id] - Get release by ID
 * - /api/release/[id]/tracks - Get tracks for a release
 */

const { createClient } = require('@supabase/supabase-js') // eslint-disable-line @typescript-eslint/no-var-requires;
const { addCorsHeaders, getPool, formatResponse, hasColumn, getTableSchema } = require('./utils/db-utils') // eslint-disable-line @typescript-eslint/no-var-requires;

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
        data: null
      });
    }
  } catch (error) {
    console.error(`Release endpoint error: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: null
    });
  }
};

// Handler for GET /api/release - List all releases
async function getAllReleasesHandler(req, res) {
  console.log('Fetching all releases');
  
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
    
    // Get all releases from Supabase with artist info
    const { data: releases, error } = await supabase
      .from('releases')
      .select(`
        *,
        artists (*)
      `);
    
    if (error) {
      console.error(`Error fetching releases with Supabase: ${error.message}`);
      
      // Try direct database query as fallback
      if (pool) {
        try {
          console.log('Falling back to direct database query for releases');
          const client = await pool.connect();
          
          // Inspect schema to handle correct column references
          // eslint-disable-line @typescript-eslint/no-unused-vars
          const releasesSchema = await getTableSchema(client, 'releases');
          const artistsSchema = await getTableSchema(client, 'artists');
          
          console.log('Schema inspection completed, constructing query');
          
          try {
            // Primary query with all joins
            const query = `
              SELECT r.*, a.*
              FROM releases r
              LEFT JOIN artists a ON r.artist_id = a.id
            `;
            
            console.log('Executing primary release query');
            const result = await client.query(query);
            client.release();
            
            // Format the results to match the expected structure
            const formattedReleases = formatReleasesWithArtists(result.rows);
            
            console.log(`Found ${formattedReleases.length} releases via direct query`);
            
            return res.status(200).json({
              success: true,
              message: `Found ${formattedReleases.length} releases`,
              data: {
                releases: formattedReleases
              }
            });
          } catch (primaryQueryError) {
            console.error(`Primary query failed: ${primaryQueryError.message}`);
            
            // Fallback to simpler query that just gets releases
            const fallbackQuery = 'SELECT * FROM releases';
            const fallbackResult = await client.query(fallbackQuery);
            client.release();
            
            console.log(`Found ${fallbackResult.rows.length} releases via fallback query`);
            
            return res.status(200).json({
              success: true,
              message: `Found ${fallbackResult.rows.length} releases (artist data unavailable)`,
              data: {
                releases: fallbackResult.rows
              }
            });
          }
        } catch (dbError) {
          console.error(`Direct database query error: ${dbError.message}`);
          return res.status(200).json({
            success: false,
            message: `Error fetching releases: ${dbError.message}`,
            data: {
              releases: []
            }
          });
        }
      }
      
      return res.status(200).json({
        success: false,
        message: `Error fetching releases: ${error.message}`,
        data: {
          releases: []
        }
      });
    }
    
    console.log(`Found ${releases.length} releases`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${releases.length} releases`,
      data: {
        releases: releases
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getAllReleasesHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: {
        releases: []
      }
    });
  }
}

// Helper function to format releases with artists from raw query results
function formatReleasesWithArtists(rows) {
  // Group rows by release ID
  const releasesMap = {};
  
  rows.forEach(row => {
    const releaseId = row.id;
    
    if (!releasesMap[releaseId]) {
      // Initialize the release object
      releasesMap[releaseId] = {
        ...row,
        artists: []
      };
      
      // Extract artist data if available
      if (row.name && !releasesMap[releaseId].artists.some(a => a.id === row.artist_id)) {
        releasesMap[releaseId].artists.push({
          id: row.artist_id,
          name: row.name,
          image_url: row.image_url,
          spotify_id: row.spotify_id
        });
      }
    }
  });
  
  // Convert the map to an array
  return Object.values(releasesMap);
}

// Handler for GET /api/release?label=[id] - List releases by label
async function getReleasesByLabelHandler(labelId, req, res) {
  console.log(`Fetching releases for label ID: ${labelId}`);
  
  // Try direct database query first for better control over the results
  if (pool) {
    try {
      console.log(`Using direct database query for releases by label ${labelId}`);
      const client = await pool.connect();
      
      // Inspect schema to handle correct column references
      const releasesSchema = await getTableSchema(client, 'releases');
      const labelsSchema = await getTableSchema(client, 'labels');
      const artistsSchema = await getTableSchema(client, 'artists');
      
      console.log('Release table schema:', JSON.stringify(releasesSchema));
      console.log('Labels table schema:', JSON.stringify(labelsSchema));
      console.log('Artists table schema:', JSON.stringify(artistsSchema));
      
      const labelIdColumn = hasColumn(labelsSchema, 'id') ? 'id' : 'label_id';
      const releaseLabelColumn = hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'labelId';
      
      // First try: Get a simple list of releases for the label without trying to join artists
      try {
        const simpleQuery = `
          SELECT r.*
          FROM releases r
          WHERE r.${releaseLabelColumn} = $1 
             OR r.${releaseLabelColumn}::text = $1
             OR r.${releaseLabelColumn} IN (
                SELECT ${labelIdColumn} FROM labels WHERE name ILIKE $2 OR ${labelIdColumn}::text = $1
             )
        `;
        
        console.log(`Executing simple query with label ID: ${labelId}`);
        const result = await client.query(simpleQuery, [labelId, `%${labelId}%`]);
        
        if (result.rows.length > 0) {
          console.log(`Found ${result.rows.length} releases for label ${labelId} via simple query`);
          
          // Now try to fetch artist information for each release
          const releases = [];
          
          for (const release of result.rows) {
            try {
              // Try to get artist info for this release
              const artistQuery = `
                SELECT a.*
                FROM artists a
                WHERE a.id = $1
              `;
              
              const artistResult = await client.query(artistQuery, [release.artist_id]);
              
              // Add release with artist data
              releases.push({
                ...release,
                artist: artistResult.rows[0] || null
              });
            } catch (artistError) {
              console.error(`Error fetching artist for release ${release.id}: ${artistError.message}`);
              // Still include the release, just without artist data
              releases.push(release);
            }
          }
          
          client.release();
          
          return res.status(200).json({
            success: true,
            message: `Found ${releases.length} releases for label ${labelId}`,
            data: {
              releases: releases
            }
          });
        }
      } catch (simpleQueryError) {
        console.error(`Simple query error: ${simpleQueryError.message}`);
      }
      
      // If simple query didn't work, try the original approach
      try {
        // More complex query with joins
        const query = `
          SELECT r.*, a.*
          FROM releases r
          LEFT JOIN artists a ON r.artist_id = a.id
          WHERE r.${releaseLabelColumn} = $1 OR r.${releaseLabelColumn}::text = $1
        `;
        
        console.log(`Executing complex query with label ID: ${labelId}`);
        const result = await client.query(query, [labelId]);
        client.release();
        
        // Format the results to match the expected structure
        const formattedReleases = formatReleasesWithArtists(result.rows);
        
        console.log(`Found ${formattedReleases.length} releases for label ${labelId} via complex query`);
        
        return res.status(200).json({
          success: true,
          message: `Found ${formattedReleases.length} releases for label ${labelId}`,
          data: {
            releases: formattedReleases
          }
        });
      } catch (complexQueryError) {
        console.error(`Complex query error: ${complexQueryError.message}`);
        client.release();
      }
    } catch (dbError) {
      console.error(`Direct query error for releases by label: ${dbError.message}`);
    }
  }
  
  // Fallback to Supabase if direct database queries failed
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
      data: {
        releases: []
      }
    });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Use a simpler query to avoid relationship issues
    console.log(`Trying simplified Supabase query for label ${labelId}`);
    const { data: releases, error } = await supabase
      .from('releases')
      .select('*')
      .eq('label_id', labelId);
    
    if (error) {
      console.error(`Error fetching releases for label ${labelId}: ${error.message}`);
      
      // Try a more flexible approach with string search
      try {
        console.log(`Trying alternative Supabase query with filter for label ${labelId}`);
        const { data: altReleases, error: altError } = await supabase
          .from('releases')
          .select('*')
          .or(`label_id.eq.${labelId},label_id.ilike.%${labelId}%`);
        
        if (altError || !altReleases || altReleases.length === 0) {
          console.error(`Alternative query failed: ${altError?.message || 'No results'}`);
          return res.status(200).json({
            success: false,
            message: `Error fetching releases for label ${labelId}: ${error.message}`,
            data: {
              releases: []
            }
          });
        }
        
        console.log(`Found ${altReleases.length} releases for label ${labelId} via alternative query`);
        
        return res.status(200).json({
          success: true,
          message: `Found ${altReleases.length} releases for label ${labelId} (artist data unavailable)`,
          data: {
            releases: altReleases
          }
        });
      } catch (altError) {
        console.error(`Alternative query error: ${altError.message}`);
      }
      
      return res.status(200).json({
        success: false,
        message: `Error fetching releases for label ${labelId}: ${error.message}`,
        data: {
          releases: []
        }
      });
    }
    
    console.log(`Found ${releases?.length || 0} releases for label ${labelId} via Supabase`);
    
    // Get artist data separately to avoid the relationship issue
    const enhancedReleases = [];
    
    for (const release of releases || []) {
      if (release.artist_id) {
        try {
          const { data: artist } = await supabase
            .from('artists')
            .select('*')
            .eq('id', release.artist_id)
            .maybeSingle();
          
          enhancedReleases.push({
            ...release,
            artist: artist
          });
        } catch (artistError) {
          console.error(`Error fetching artist for release: ${artistError.message}`);
          enhancedReleases.push(release);
        }
      } else {
        enhancedReleases.push(release);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Found ${enhancedReleases.length} releases for label ${labelId}`,
      data: {
        releases: enhancedReleases
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getReleasesByLabelHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: {
        releases: []
      }
    });
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
      data: null
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
        data: null
      });
    }
    
    if (!release) {
      return res.status(200).json({
        success: false,
        message: `Release with ID ${releaseId} not found`,
        data: null
      });
    }
    
    console.log(`Found release: ${release.title}`);
    
    return res.status(200).json({
      success: true,
      message: 'Release found',
      data: {
        release: release
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getReleaseByIdHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: null
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
      data: null
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
        data: {
          tracks: []
        }
      });
    }
    
    console.log(`Found ${tracks.length} tracks for release ${releaseId}`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${tracks.length} tracks for release ${releaseId}`,
      data: {
        tracks: tracks
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getReleaseTracksHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: {
        tracks: []
      }
    });
  }
}
