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
  
  try {
    // Get all artists from Supabase
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
      message: `Error fetching artist artists: ${error.message}`,
      data: {
        artists: [] // Return empty array instead of null
      }
    });
  }
}

// Handler for GET /api/artist?label=[id] - List artists by label
async function getArtistsByLabelHandler(labelId, req, res) {
  console.log(`Fetching artists for label ID: ${labelId}`);
  
  // Helper function to send a consistent response format
  const sendResponse = (success, message, artistsData) => {
    console.log(`Sending response: success=${success}, message=${message}`);
    
    // Ensure we're always returning an array for artists
    let artists = [];
    
    if (Array.isArray(artistsData)) {
      artists = artistsData;
    } else if (artistsData && artistsData.artists) {
      artists = artistsData.artists;
    } else if (artistsData) {
      // Convert a single artist object to an array if needed
      artists = [artistsData];
    }
    
    return res.status(200).json({
      success,
      message,
      data: {
        artists: artists
      }
    });
  };
  
  // Try direct database query first for better control over the results
  if (pool) {
    console.log('Using PostgreSQL connection pool');
    try {
      const client = await pool.connect();
      
      // Check table schema to use correct column names
      console.log('Inspecting schema for artists query...');
      const artistsSchema = await getTableSchema(client, 'artists');
      const labelsSchema = await getTableSchema(client, 'labels');
      
      console.log('Schema inspection results:');
      console.log('- Artists columns:', artistsSchema.map(col => col.column_name).join(', '));
      console.log('- Labels columns:', labelsSchema.map(col => col.column_name).join(', '));
      
      // Determine the correct column names based on the schema
      const labelIdColumn = hasColumn(labelsSchema, 'id') ? 'id' : 'label_id';
      const artistLabelColumn = hasColumn(artistsSchema, 'label_id') ? 'label_id' : 'labelId';
      
      // --- APPROACH 1: Direct query with exact match ---
      console.log('Trying direct query with exact match');
      const directQuery = `
        SELECT * FROM artists 
        WHERE ${artistLabelColumn} = $1 
           OR ${artistLabelColumn}::text = $1
      `;
      
      console.log(`Executing direct query with label ID: ${labelId}`);
      let result = await client.query(directQuery, [labelId]);
      
      if (result.rows.length > 0) {
        console.log(`Found ${result.rows.length} artists via direct query`);
        client.release();
        return sendResponse(true, `Found ${result.rows.length} artists for label ${labelId}`, result.rows);
      }
      
      // --- APPROACH 2: Try with label name matching ---
      console.log('Trying with label name matching');
      let labelName = '';
      
      try {
        const labelQuery = 'SELECT name FROM labels WHERE id = $1 OR id::text = $1';
        const labelResult = await client.query(labelQuery, [labelId]);
        
        if (labelResult.rows.length > 0) {
          labelName = labelResult.rows[0].name;
          console.log(`Found label name: ${labelName}`);
        }
      } catch (labelError) {
        console.error(`Error finding label name: ${labelError.message}`);
        // Continue with other approaches
      }
      
      if (labelName) {
        const nameMatchQuery = `
          SELECT a.* FROM artists a
          WHERE a.${artistLabelColumn}::text = $1
             OR EXISTS (
               SELECT 1 FROM labels l 
               WHERE l.name ILIKE $2 
                 AND (a.${artistLabelColumn}::text = l.${labelIdColumn}::text 
                   OR a.${artistLabelColumn}::text = $1)
             )
        `;
        
        console.log(`Executing name match query with: ${labelId}, %${labelName}%`);
        result = await client.query(nameMatchQuery, [labelId, `%${labelName}%`]);
        
        if (result.rows.length > 0) {
          console.log(`Found ${result.rows.length} artists via name match query`);
          client.release();
          return sendResponse(true, `Found ${result.rows.length} artists for label ${labelId}`, result.rows);
        }
      }
      
      // --- APPROACH 3: Try LIKE pattern matching ---
      console.log('Trying with pattern matching');
      const patternQuery = `
        SELECT * FROM artists 
        WHERE ${artistLabelColumn}::text LIKE $1
      `;
      
      console.log(`Executing pattern matching query with: %${labelId}%`);
      result = await client.query(patternQuery, [`%${labelId}%`]);
      
      if (result.rows.length > 0) {
        console.log(`Found ${result.rows.length} artists via pattern matching`);
        client.release();
        return sendResponse(true, `Found ${result.rows.length} artists for label ${labelId}`, result.rows);
      }
      
      // Release the client before moving to the next method
      client.release();
      console.log('No artists found with any query method');
      
    } catch (dbError) {
      console.error(`Database error for artists by label: ${dbError.message}`);
      // Continue to Supabase fallback
    }
  }
  
  // If direct queries unsuccessful, try Supabase client
  console.log('Direct database queries unsuccessful, trying Supabase...');
  const supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL;
                   
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return sendResponse(false, 'Supabase configuration missing', null);
  }
  
  try {
    console.log('Initializing Supabase client');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // --- APPROACH 1: Direct query by label_id ---
    console.log(`Querying Supabase for artists with label_id = ${labelId}`);
    let { data: artists, error } = await supabase
      .from('artists')
      .select('*')
      .eq('label_id', labelId);
    
    if (!error && artists && artists.length > 0) {
      console.log(`Found ${artists.length} artists via direct Supabase query`);
      return sendResponse(true, `Found ${artists.length} artists for label ${labelId}`, artists);
    }
    
    // --- APPROACH 2: Try more flexible matching ---
    if (error || !artists || artists.length === 0) {
      console.log('Direct query unsuccessful, trying with OR conditions');
      
      // Try to get label name first if we have a numeric ID
      let labelName = '';
      if (!isNaN(labelId)) {
        try {
          const { data: labelData } = await supabase
            .from('labels')
            .select('name')
            .eq('id', parseInt(labelId))
            .single();
          
          if (labelData) {
            labelName = labelData.name;
            console.log(`Found label name: ${labelName}`);
          }
        } catch (labelError) {
          console.error(`Error fetching label: ${labelError.message}`);
        }
      }
      
      // Build a flexible OR query with all the matching patterns
      let orCondition = `label_id.eq.${labelId},label_id.ilike.%${labelId}%`;
      if (labelName) {
        orCondition += `,label_name.ilike.%${labelName}%`;
      }
      
      console.log(`Using OR condition: ${orCondition}`);
      const { data: flexibleArtists, error: flexibleError } = await supabase
        .from('artists')
        .select('*')
        .or(orCondition);
      
      if (!flexibleError && flexibleArtists && flexibleArtists.length > 0) {
        console.log(`Found ${flexibleArtists.length} artists via flexible Supabase query`);
        return sendResponse(true, `Found ${flexibleArtists.length} artists for label ${labelId}`, flexibleArtists);
      }
    }
    
    // --- APPROACH 3: Handle special case for buildit-records label ---
    if (labelId === 'buildit-records' || labelId === '1') {
      console.log('Trying special case for buildit-records label');
      const { data: buildItArtists, error: buildItError } = await supabase
        .from('artists')
        .select('*')
        .eq('label_id', 1);
      
      if (!buildItError && buildItArtists && buildItArtists.length > 0) {
        console.log(`Found ${buildItArtists.length} artists for buildit-records label`);
        return sendResponse(true, `Found ${buildItArtists.length} artists for buildit-records`, buildItArtists);
      }
    }
    
    // If all approaches failed, return empty array instead of null
    console.log('All Supabase approaches failed, returning empty array');
    return sendResponse(true, `No artists found for label ${labelId}`, []);
  } catch (supabaseError) {
    console.error(`Unexpected error in Supabase query: ${supabaseError.message}`);
    return sendResponse(true, 'Error fetching artists, returning empty array', []);
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
