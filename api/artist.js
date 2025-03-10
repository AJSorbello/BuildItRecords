/**
 * Consolidated artist endpoint handler
 * Handles multiple artist endpoints through path detection:
 * - /api/artist - List all artists
 * - /api/artist?label=id - List artists by label
 * - /api/artist/[id] - Get artist by ID
 * - /api/artist/[id]/releases - Get releases for an artist
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
  try {
    // Add CORS headers
    addCorsHeaders(res);
    
    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    console.log(`API Request: ${req.method} ${req.url}`);
    
    // Parse the URL to determine which endpoint was requested
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Extract query parameters
    const params = {};
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }
    
    // Get label parameter if present
    const label = params.label || null;
    // Get id parameter if present (either from query or path)
    const id = params.id || (pathSegments.length > 1 ? pathSegments[1] : null);
    const endpoint = params.endpoint || (pathSegments.length > 2 ? pathSegments[2] : null);
    
    console.log('Path segments:', pathSegments);
    console.log('Query parameters:', params);
    console.log(`Handling artist request with id: ${id}, label: ${label}, endpoint: ${endpoint}`);
    
    // GET /api/artist - List all artists
    if (pathSegments.length === 1) {
      // Check if there's a label query parameter
      const labelId = url.searchParams.get('label');
      
      if (labelId) {
        console.log(`Fetching artists for label: ${labelId}`);
        return await getArtistsByLabelHandler(labelId, req, res);
      } else {
        console.log('Fetching all artists');
        return await getAllArtistsHandler(req, res);
      }
    }

    // GET /api/artist/:id - Get artist by ID
    else if (pathSegments.length === 2) {
      const artistId = pathSegments[1];
      console.log(`Fetching artist with ID: ${artistId}`);
      return await getArtistByIdHandler(artistId, req, res);
    }

    // GET /api/artist/:id/releases - Get releases by artist ID
    else if (pathSegments.length === 3 && pathSegments[2] === 'releases') {
      const artistId = pathSegments[1];
      console.log(`Fetching releases for artist: ${artistId}`);
      return await getArtistReleasesHandler(artistId, req, res);
    }
    
    // If no route matches, return 404
    console.error('Unsupported artist endpoint');
    return res.status(200).json({
      success: false,
      message: 'Endpoint not found',
      data: null
    });
  } catch (error) {
    console.error(`Unexpected error in artist API handler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Server error: ${error.message}`,
      data: null
    });
  }
};

// Handler for GET /api/artist - List all artists
async function getAllArtistsHandler(req, res) {
  console.log('Fetching all artists');
  
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
  
  try {
    // Get all artists from Supabase - explicitly using .select()
    const { data: artists, error } = await supabase
      .from('artists')
      .select('*');
    
    if (error) {
      console.error(`Error fetching artists: ${error.message}`);
      return res.status(200).json({
        success: false,
        message: `Error fetching artists: ${error.message}`,
        data: {
          artists: [] // Return empty array instead of null
        }
      });
    }
    
    console.log(`Found ${artists?.length || 0} artists`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${artists?.length || 0} artists`,
      data: {
        artists: artists || [] // Ensure we return an array even if null
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getAllArtistsHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error fetching artists: ${error.message}`,
      data: {
        artists: [] // Return empty array instead of null
      }
    });
  }
}

// Handler for GET /api/artist?label=[id] - List artists by label
async function getArtistsByLabelHandler(labelId, req, res) {
  console.log(`Fetching artists for label ID: ${labelId}`);
  
  const pool = await getPool();
  if (!pool) {
    console.error('Database connection pool not available');
    return res.status(200).json({
      success: false,
      message: 'Database connection failed',
      data: {
        artists: [] // Return empty array instead of null
      }
    });
  }
  
  try {
    const client = await pool.connect();
    
    // Debug: Check schema and columns
    console.log('Inspecting schema for labels table...');
    const labelColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'labels'
    `);
    console.log('Label columns:', labelColumns.rows.map(row => row.column_name));
    
    // Use proper column references based on actual schema
    const query = `
      SELECT a.* 
      FROM artists a
      JOIN labels l ON a.label_id = l.id
      WHERE l.id = $1
    `;
    
    console.log(`Executing query with label ID: ${labelId}`);
    const result = await client.query(query, [labelId]);
    
    if (result.rows.length === 0) {
      console.log(`No artists found for label ID: ${labelId}`);
      client.release();
      return res.status(200).json({
        success: true,
        message: `No artists found for label ID: ${labelId}`,
        data: {
          artists: []
        }
      });
    }
    
    console.log(`Found ${result.rows.length} artists via direct query`);
    client.release();
    return res.status(200).json({
      success: true,
      message: `Found ${result.rows.length} artists for label ${labelId}`,
      data: {
        artists: result.rows
      }
    });
  } catch (error) {
    console.error(`Error in getArtistsByLabelHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Database error: ${error.message}`,
      data: {
        artists: []
      }
    });
  }
}

// Handler for GET /api/artist/[id] - Get artist by ID
async function getArtistByIdHandler(artistId, req, res) {
  console.log(`Fetching artist with ID: ${artistId}`);
  
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
    data: {
      artist: artist
    }
  });
}

// Handler for GET /api/artist/[id]/releases - Get releases for an artist
async function getArtistReleasesHandler(artistId, req, res) {
  console.log(`Fetching releases for artist ID: ${artistId}`);
  
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
  
  // Get releases for the artist
  const { data: releases, error } = await supabase
    .from('releases')
    .select(`
      *,
      artists (*)
    `)
    .eq('artist_id', artistId);
  
  if (error) {
    console.error(`Error fetching releases for artist ${artistId}: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error fetching releases for artist ${artistId}: ${error.message}`,
      data: {
        releases: []
      }
    });
  }
  
  console.log(`Found ${releases.length} releases for artist ${artistId}`);
  
  return res.status(200).json({
    success: true,
    message: `Found ${releases.length} releases for artist ${artistId}`,
    data: {
      releases: releases
    }
  });
}
