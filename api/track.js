/**
 * Consolidated track endpoint handler
 * Handles multiple track endpoints through path detection:
 * - /api/track - List all tracks
 * - /api/track?label=id - List tracks by label
 * - /api/track/[id] - Get track by ID
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

  console.log(`Track API Request: ${req.method} ${req.url}`);
  
  // Parse the URL to determine which endpoint was requested
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  try {
    // GET /api/track - List all tracks
    if (pathSegments.length === 1) {
      // Check if there's a label query parameter
      const labelId = url.searchParams.get('label');
      
      if (labelId) {
        return await getTracksByLabelHandler(labelId, req, res);
      } else {
        return await getAllTracksHandler(req, res);
      }
    }
    // GET /api/track/[id] - Get track by ID
    else if (pathSegments.length === 2) {
      const trackId = pathSegments[1];
      return await getTrackByIdHandler(trackId, req, res);
    }
    else {
      return res.status(404).json({
        success: false,
        message: `Not found: ${req.url}`,
        data: null
      });
    }
  } catch (error) {
    console.error(`Track endpoint error: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: null
    });
  }
};

// Handler for GET /api/track - List all tracks
async function getAllTracksHandler(req, res) {
  console.log('Fetching all tracks');
  
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
    
    // Get all tracks from Supabase with release info
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select(`
        *,
        releases (*)
      `);
    
    if (error) {
      console.error(`Error fetching tracks with Supabase: ${error.message}`);
      
      // Try direct database query as fallback
      if (pool) {
        try {
          console.log('Falling back to direct database query for tracks');
          const client = await pool.connect();
          
          // Inspect schema to handle correct column references
          const tracksSchema = await getTableSchema(client, 'tracks');
          const releasesSchema = await getTableSchema(client, 'releases');
          
          console.log('Schema inspection completed, constructing query');
          
          try {
            // Primary query with release join
            const query = `
              SELECT t.*, r.*
              FROM tracks t
              LEFT JOIN releases r ON t.release_id = r.id
            `;
            
            console.log('Executing primary track query');
            const result = await client.query(query);
            client.release();
            
            // Format the results to match the expected structure
            const formattedTracks = formatTracksWithReleases(result.rows);
            
            console.log(`Found ${formattedTracks.length} tracks via direct query`);
            
            return res.status(200).json({
              success: true,
              message: `Found ${formattedTracks.length} tracks`,
              data: {
                tracks: formattedTracks
              }
            });
          } catch (primaryQueryError) {
            console.error(`Primary query failed: ${primaryQueryError.message}`);
            
            // Fallback to simpler query that just gets tracks
            const fallbackQuery = 'SELECT * FROM tracks';
            const fallbackResult = await client.query(fallbackQuery);
            client.release();
            
            console.log(`Found ${fallbackResult.rows.length} tracks via fallback query`);
            
            return res.status(200).json({
              success: true,
              message: `Found ${fallbackResult.rows.length} tracks (release data unavailable)`,
              data: {
                tracks: fallbackResult.rows
              }
            });
          }
        } catch (dbError) {
          console.error(`Direct database query error: ${dbError.message}`);
          return res.status(200).json({
            success: false,
            message: `Error fetching tracks: ${dbError.message}`,
            data: {
              tracks: []
            }
          });
        }
      }
      
      return res.status(200).json({
        success: false,
        message: `Error fetching tracks: ${error.message}`,
        data: {
          tracks: []
        }
      });
    }
    
    console.log(`Found ${tracks.length} tracks`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${tracks.length} tracks`,
      data: {
        tracks: tracks
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getAllTracksHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: {
        tracks: []
      }
    });
  }
}

// Helper function to format tracks with releases from raw query results
function formatTracksWithReleases(rows) {
  // Group rows by track ID
  const tracksMap = {};
  
  rows.forEach(row => {
    const trackId = row.id;
    
    if (!tracksMap[trackId]) {
      // Extract track data
      const trackData = {
        id: row.id,
        title: row.title,
        track_number: row.track_number,
        release_id: row.release_id,
        duration_ms: row.duration_ms,
        spotify_id: row.spotify_id,
        preview_url: row.preview_url,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
      
      // Initialize the track object with release data if available
      tracksMap[trackId] = {
        ...trackData,
        releases: row.title ? {
          id: row.release_id,
          title: row.title,
          release_date: row.release_date,
          image_url: row.image_url,
          artist_id: row.artist_id,
          label_id: row.label_id,
          spotify_id: row.spotify_id
        } : null
      };
    }
  });
  
  // Convert the map to an array
  return Object.values(tracksMap);
}

// Handler for GET /api/track?label=[id] - List tracks by label
async function getTracksByLabelHandler(labelId, req, res) {
  console.log(`Fetching tracks for label ID: ${labelId}`);
  
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
    
    // For track query by label, we need to join through releases
    // This is a more complex query that might be better handled directly through the database
    if (pool) {
      try {
        console.log(`Executing direct database query for tracks by label ${labelId}`);
        const client = await pool.connect();
        
        // Inspect schema to handle correct column references
        const tracksSchema = await getTableSchema(client, 'tracks');
        const releasesSchema = await getTableSchema(client, 'releases');
        const labelsSchema = await getTableSchema(client, 'labels');
        
        console.log('Schema inspection completed, constructing query');
        
        const labelIdColumn = hasColumn(labelsSchema, 'id') ? 'id' : 'label_id';
        const releaseLabelColumn = hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'labelId';
        
        try {
          // Primary query with joins
          const query = `
            SELECT t.*, r.*
            FROM tracks t
            JOIN releases r ON t.release_id = r.id
            JOIN labels l ON r.${releaseLabelColumn} = l.${labelIdColumn}::text
            WHERE l.${labelIdColumn}::text = $1
            ORDER BY r.release_date DESC, t.track_number ASC
          `;
          
          console.log(`Executing query with label ID: ${labelId}`);
          const result = await client.query(query, [labelId]);
          client.release();
          
          // Format the results to match the expected structure
          const formattedTracks = formatTracksWithReleases(result.rows);
          
          console.log(`Found ${formattedTracks.length} tracks for label ${labelId} via direct query`);
          
          return res.status(200).json({
            success: true,
            message: `Found ${formattedTracks.length} tracks for label ${labelId}`,
            data: {
              tracks: formattedTracks
            }
          });
        } catch (primaryQueryError) {
          console.error(`Primary query failed: ${primaryQueryError.message}`);
          client.release();
          
          // Return empty array with error message
          return res.status(200).json({
            success: false,
            message: `Error fetching tracks for label ${labelId}: ${primaryQueryError.message}`,
            data: {
              tracks: []
            }
          });
        }
      } catch (dbError) {
        console.error(`Direct query error for tracks by label: ${dbError.message}`);
      }
    }
    
    // If direct query failed or pool not available, try with Supabase
    // Note: This is a more complex query and might not work well with Supabase
    console.log('Trying Supabase query for tracks by label');
    
    // First get all releases for the label
    const { data: releases, error: releaseError } = await supabase
      .from('releases')
      .select('id')
      .eq('label_id', labelId);
    
    if (releaseError) {
      console.error(`Error fetching releases for label ${labelId}: ${releaseError.message}`);
      return res.status(200).json({
        success: false,
        message: `Error fetching releases for label ${labelId}: ${releaseError.message}`,
        data: {
          tracks: []
        }
      });
    }
    
    if (!releases || releases.length === 0) {
      console.log(`No releases found for label ${labelId}`);
      return res.status(200).json({
        success: true,
        message: `No releases found for label ${labelId}`,
        data: {
          tracks: []
        }
      });
    }
    
    // Get all release IDs
    const releaseIds = releases.map(release => release.id);
    
    // Then get all tracks for those releases
    const { data: tracks, error: trackError } = await supabase
      .from('tracks')
      .select(`
        *,
        releases (*)
      `)
      .in('release_id', releaseIds)
      .order('track_number', { ascending: true });
    
    if (trackError) {
      console.error(`Error fetching tracks for releases: ${trackError.message}`);
      return res.status(200).json({
        success: false,
        message: `Error fetching tracks for releases: ${trackError.message}`,
        data: {
          tracks: []
        }
      });
    }
    
    console.log(`Found ${tracks.length} tracks for label ${labelId}`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${tracks.length} tracks for label ${labelId}`,
      data: {
        tracks: tracks
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getTracksByLabelHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: {
        tracks: []
      }
    });
  }
}

// Handler for GET /api/track/[id] - Get track by ID
async function getTrackByIdHandler(trackId, req, res) {
  console.log(`Fetching track with ID: ${trackId}`);
  
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
    
    // Get track by ID with release info
    const { data: track, error } = await supabase
      .from('tracks')
      .select(`
        *,
        releases (*)
      `)
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
      data: {
        track: track
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getTrackByIdHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: null
    });
  }
}
