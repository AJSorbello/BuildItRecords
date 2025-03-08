/**
 * Consolidated artist endpoint handler
 * Handles multiple artist endpoints through path detection:
 * - /api/artist - List all artists
 * - /api/artist?label=id - List artists by label
 * - /api/artist/[id] - Get artist by ID
 * - /api/artist/[id]/releases - Get releases for an artist
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

  console.log(`Artist API Request: ${req.method} ${req.url}`);
  
  // Parse the URL to determine which endpoint was requested
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  try {
    // GET /api/artist - List all artists
    if (pathSegments.length === 1) {
      // Check if there's a label query parameter
      const labelId = url.searchParams.get('label');
      
      if (labelId) {
        return await getArtistsByLabelHandler(labelId, req, res);
      } else {
        return await getAllArtistsHandler(req, res);
      }
    }
    // GET /api/artist/[id] - Get artist by ID
    else if (pathSegments.length === 2) {
      const artistId = pathSegments[1];
      return await getArtistByIdHandler(artistId, req, res);
    }
    // GET /api/artist/[id]/releases - Get releases for an artist
    else if (pathSegments.length === 3 && pathSegments[2] === 'releases') {
      const artistId = pathSegments[1];
      return await getArtistReleasesHandler(artistId, req, res);
    }
    else {
      return res.status(404).json({
        success: false,
        message: `Not found: ${req.url}`,
        data: null
      });
    }
  } catch (error) {
    console.error(`Artist endpoint error: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
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
  
  // Get all artists from Supabase
  const { data: artists, error } = await supabase
    .from('artists')
    .select('*');
  
  if (error) {
    console.error(`Error fetching artists: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error fetching artists: ${error.message}`,
      data: null
    });
  }
  
  console.log(`Found ${artists.length} artists`);
  
  return res.status(200).json({
    success: true,
    message: `Found ${artists.length} artists`,
    data: {
      artists: artists
    }
  });
}

// Handler for GET /api/artist?label=[id] - List artists by label
async function getArtistsByLabelHandler(labelId, req, res) {
  console.log(`Fetching artists for label ID: ${labelId}`);
  
  // Try direct database query first for better control over the results
  if (pool) {
    try {
      const client = await pool.connect();
      
      // Check table schema to use correct column names
      const artistsSchema = await getTableSchema(client, 'artists');
      const labelsSchema = await getTableSchema(client, 'labels');
      
      console.log('Artist table schema:', JSON.stringify(artistsSchema));
      console.log('Labels table schema:', JSON.stringify(labelsSchema));
      
      const labelIdColumn = hasColumn(labelsSchema, 'id') ? 'id' : 'label_id';
      const artistLabelColumn = hasColumn(artistsSchema, 'label_id') ? 'label_id' : 'labelId';
      
      // Construct query based on schema - use a simpler join that handles type conversion
      const query = `
        SELECT a.*
        FROM artists a
        LEFT JOIN labels l ON a.${artistLabelColumn} = l.${labelIdColumn}::text
        WHERE l.${labelIdColumn}::text = $1 OR l.name ILIKE $2
      `;
      
      console.log(`Executing query with label ID: ${labelId}`);
      const result = await client.query(query, [labelId, `%${labelId}%`]);
      client.release();
      
      console.log(`Found ${result.rows.length} artists for label ${labelId} via direct query`);
      
      if (result.rows.length > 0) {
        return res.status(200).json({
          success: true,
          message: `Found ${result.rows.length} artists for label ${labelId}`,
          data: {
            artists: result.rows
          }
        });
      }
      
      // Fallback to a simplified query if the join didn't work
      try {
        const client2 = await pool.connect();
        const simplifiedQuery = `
          SELECT * FROM artists 
          WHERE label_id = $1 OR label_id::text = $1
        `;
        
        console.log(`Executing simplified query with label ID: ${labelId}`);
        const simplifiedResult = await client2.query(simplifiedQuery, [labelId]);
        client2.release();
        
        console.log(`Found ${simplifiedResult.rows.length} artists for label ${labelId} via simplified query`);
        
        return res.status(200).json({
          success: true,
          message: `Found ${simplifiedResult.rows.length} artists for label ${labelId}`,
          data: {
            artists: simplifiedResult.rows
          }
        });
      } catch (fallbackError) {
        console.error(`Fallback query error: ${fallbackError.message}`);
      }
    } catch (dbError) {
      console.error(`Direct query error for artists by label: ${dbError.message}`);
    }
  }
  
  // If direct query approaches failed, try Supabase as a last resort
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

  // Query for artists by label
  const { data: artists, error } = await supabase
    .from('artists')
    .select('*')
    .eq('label_id', labelId);

  if (error) {
    console.error(`Error fetching artists for label ${labelId}: ${error.message}`);
    
    // Return empty array instead of null to prevent frontend errors
    return res.status(200).json({
      success: false,
      message: `Error fetching artists for label ${labelId}: ${error.message}`,
      data: {
        artists: []
      }
    });
  }

  console.log(`Found ${artists?.length || 0} artists for label ${labelId} via Supabase`);

  return res.status(200).json({
    success: true,
    message: `Found ${artists?.length || 0} artists for label ${labelId}`,
    data: {
      artists: artists || []
    }
  });
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
