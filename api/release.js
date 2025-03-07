/**
 * Consolidated release endpoint handler
 * Handles multiple release endpoints through path detection:
 * - /api/release - List all releases
 * - /api/release?label=id - List releases by label
 * - /api/release/[id] - Get release by ID
 * - /api/release/[id]/tracks - Get tracks for a release
 */

const { createClient } = require('@supabase/supabase-js');
const { addCorsHeaders, getPool, formatResponse, hasColumn, getTableSchema } = require('./utils/db-utils');

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
    
    // Get releases by label from Supabase
    const { data: releases, error } = await supabase
      .from('releases')
      .select(`
        *,
        artists (*)
      `)
      .eq('label_id', labelId);
    
    if (error) {
      console.error(`Error fetching releases for label ${labelId}: ${error.message}`);
      
      // Fallback to direct database query
      if (pool) {
        try {
          console.log(`Falling back to direct database query for releases by label ${labelId}`);
          const client = await pool.connect();
          
          // Inspect schema to handle correct column references
          const releasesSchema = await getTableSchema(client, 'releases');
          const labelsSchema = await getTableSchema(client, 'labels');
          
          const labelIdColumn = hasColumn(labelsSchema, 'id') ? 'id' : 'label_id';
          const releaseLabelColumn = hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'labelId';
          
          // Construct query based on schema
          const query = `
            SELECT r.*, a.*
            FROM releases r
            LEFT JOIN artists a ON r.artist_id = a.id
            LEFT JOIN labels l ON r.${releaseLabelColumn} = l.${labelIdColumn}::text
            WHERE l.${labelIdColumn}::text = $1
          `;
          
          console.log(`Executing query with label ID: ${labelId}`);
          const result = await client.query(query, [labelId]);
          client.release();
          
          // Format the results to match the expected structure
          const formattedReleases = formatReleasesWithArtists(result.rows);
          
          console.log(`Found ${formattedReleases.length} releases for label ${labelId} via direct query`);
          
          return res.status(200).json({
            success: true,
            message: `Found ${formattedReleases.length} releases for label ${labelId}`,
            data: {
              releases: formattedReleases
            }
          });
        } catch (dbError) {
          console.error(`Direct query error for releases by label: ${dbError.message}`);
        }
      }
      
      return res.status(200).json({
        success: false,
        message: `Error fetching releases for label ${labelId}: ${error.message}`,
        data: {
          releases: []
        }
      });
    }
    
    console.log(`Found ${releases.length} releases for label ${labelId}`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${releases.length} releases for label ${labelId}`,
      data: {
        releases: releases
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
