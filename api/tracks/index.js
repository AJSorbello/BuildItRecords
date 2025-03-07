// Unified serverless API handler for all tracks endpoints
const { getPool, getTableSchema, hasColumn, logResponse, addCorsHeaders } = require('../utils/db-utils');
const { createClient } = require('@supabase/supabase-js');

// Function to initialize Supabase client with appropriate error handling
function initSupabase() {
  try {
    // Check for environment variables in different formats (for compatibility)
    const supabaseUrl = process.env.SUPABASE_URL || 
                        process.env.VITE_SUPABASE_URL || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 
                            process.env.VITE_SUPABASE_ANON_KEY ||
                            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      return null;
    }
    
    console.log(`Initializing Supabase client with URL: ${supabaseUrl}`);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

// Generate fallback tracks data
function getFallbackTracks(count = 5, labelId = null) {
  const tracks = [];
  for (let i = 1; i <= count; i++) {
    tracks.push({
      id: `dummy-${i}`,
      title: `Example Track ${i}`,
      release_id: `release-${i}`,
      release_title: `Example Release ${i}`,
      artist_id: `artist-${i}`,
      artist_name: `Example Artist ${i}`,
      label_id: labelId || 'unknown',
      duration_ms: 180000 + (i * 10000),
      track_number: i,
      spotify_id: `spotify-track-${i}`,
      preview_url: 'https://p.scdn.co/mp3-preview/sample.mp3'
    });
  }
  return tracks;
}

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log(`API Request: ${req.method} ${req.url}`);
  
  // We'll always return a 200 status code with appropriate metadata
  let statusDetails = {
    success: false,
    source: null,
    error: null,
    took: 0
  };
  
  const startTime = Date.now();
  
  try {
    console.log('Processing tracks request', req.query);
    
    // Get query parameters - support both formats (for label ID)
    const { release, label, offset = 0, limit = 50, labelId } = req.query;
    const labelIdentifier = labelId || label; // Use either labelId or label parameter
    
    // Try multiple strategies to fetch tracks
    const result = await fetchTracksWithFallbacks(release, labelIdentifier, offset, limit);
    
    // Calculate response time
    const took = Date.now() - startTime;
    
    // Return the result with appropriate structure
    return res.status(200).json({
      tracks: result.data,
      meta: {
        count: result.data.length,
        offset: parseInt(offset),
        limit: parseInt(limit),
        total: result.data.length,
        label: labelIdentifier,
        labelId: labelIdentifier,
        release: release,
        success: result.success,
        source: result.source,
        error: result.error,
        took
      }
    });
  } catch (error) {
    console.error('Unexpected error in tracks endpoint:', error);
    
    // Calculate response time
    const took = Date.now() - startTime;
    
    // Determine what label was requested (if any)
    const labelIdentifier = req.query.labelId || req.query.label;
    
    // Return fallback data with error information
    return res.status(200).json({
      tracks: getFallbackTracks(5, labelIdentifier),
      meta: {
        count: 5,
        offset: parseInt(req.query.offset || 0),
        limit: parseInt(req.query.limit || 50),
        total: 5,
        label: labelIdentifier,
        labelId: labelIdentifier,
        release: req.query.release,
        success: false,
        source: 'error-handler',
        error: error.message,
        took
      }
    });
  }
};

// Function to try multiple strategies to fetch tracks
async function fetchTracksWithFallbacks(release, labelIdentifier, offset, limit) {
  // Strategy 1: Try Supabase first
  try {
    const supabase = initSupabase();
    if (supabase) {
      console.log('Trying to fetch tracks with Supabase');
      
      let query = supabase.from('tracks').select('*, releases(*), artists(*)');
      
      // Apply filters
      if (release) {
        query = query.eq('release_id', release);
      }
      
      if (labelIdentifier) {
        // Try to get tracks associated with a specific label
        // This usually requires joining through the releases table
        try {
          // First get all releases for the label
          const { data: labelReleases } = await supabase
            .from('releases')
            .select('id')
            .eq('label_id', labelIdentifier);
          
          if (labelReleases && labelReleases.length > 0) {
            const releaseIds = labelReleases.map(r => r.id);
            query = query.in('release_id', releaseIds);
          }
        } catch (error) {
          console.error('Error fetching label releases:', error);
        }
      }
      
      // Apply pagination
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
      const { data, error } = await query;
      
      if (!error && data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} tracks with Supabase`);
        return {
          success: true,
          source: 'supabase',
          data: data,
          error: null
        };
      }
      
      if (error) {
        console.error('Supabase query error:', error);
      } else {
        console.log('No tracks found with Supabase');
      }
    }
  } catch (error) {
    console.error('Error fetching tracks with Supabase:', error);
  }
  
  // Strategy 2: Try PostgreSQL direct connection
  try {
    const pool = getPool();
    if (pool) {
      console.log('Trying to fetch tracks with PostgreSQL');
      
      const client = await pool.connect();
      console.log('Connected to PostgreSQL database');
      
      try {
        // First try with a comprehensive query with joins
        try {
          let query, params;
          
          if (labelIdentifier) {
            // Query for tracks by label
            query = `
              SELECT t.*, r.title as release_title, a.name as artist_name
              FROM tracks t
              LEFT JOIN releases r ON t.release_id = r.id
              LEFT JOIN artists a ON t.artist_id = a.id
              LEFT JOIN labels l ON r.label_id = l.id
              WHERE l.id = $1
              ORDER BY t.title
              LIMIT $2 OFFSET $3
            `;
            params = [labelIdentifier, limit, offset];
          } else if (release) {
            // Query for tracks by release
            query = `
              SELECT t.*, r.title as release_title, a.name as artist_name
              FROM tracks t
              LEFT JOIN releases r ON t.release_id = r.id
              LEFT JOIN artists a ON t.artist_id = a.id
              WHERE t.release_id = $1
              ORDER BY t.track_number
              LIMIT $2 OFFSET $3
            `;
            params = [release, limit, offset];
          } else {
            // Query for all tracks
            query = `
              SELECT t.*, r.title as release_title, a.name as artist_name
              FROM tracks t
              LEFT JOIN releases r ON t.release_id = r.id
              LEFT JOIN artists a ON t.artist_id = a.id
              ORDER BY t.title
              LIMIT $1 OFFSET $2
            `;
            params = [limit, offset];
          }
          
          const result = await client.query(query, params);
          
          if (result.rows.length > 0) {
            console.log(`Successfully fetched ${result.rows.length} tracks with PostgreSQL (comprehensive query)`);
            return {
              success: true,
              source: 'postgres-comprehensive',
              data: result.rows,
              error: null
            };
          }
        } catch (comprehensiveError) {
          console.error('Error with comprehensive query:', comprehensiveError);
          
          // Try a simpler query as fallback
          try {
            let simpleQuery, params;
            
            if (release) {
              simpleQuery = 'SELECT * FROM tracks WHERE release_id = $1 LIMIT $2 OFFSET $3';
              params = [release, limit, offset];
            } else {
              simpleQuery = 'SELECT * FROM tracks LIMIT $1 OFFSET $2';
              params = [limit, offset];
            }
            
            const result = await client.query(simpleQuery, params);
            
            if (result.rows.length > 0) {
              console.log(`Successfully fetched ${result.rows.length} tracks with PostgreSQL (simple query)`);
              return {
                success: true,
                source: 'postgres-simple',
                data: result.rows,
                error: null
              };
            } else {
              console.log('No tracks found with simple query');
            }
          } catch (simpleError) {
            console.error('Error with simple query:', simpleError);
          }
        }
      } catch (error) {
        console.error('PostgreSQL query error:', error);
      } finally {
        client.release();
      }
    }
  } catch (error) {
    console.error('Error fetching tracks with PostgreSQL:', error);
  }
  
  // Strategy 3: Return dummy data as fallback
  console.log('All strategies failed, returning fallback data');
  return {
    success: false,
    source: 'fallback-dummy-data',
    data: getFallbackTracks(5, labelIdentifier),
    error: 'Failed to fetch tracks data from database'
  };
}
