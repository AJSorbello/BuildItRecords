// Serverless API handler for fetching an artist by ID
const { Pool } = require('pg') // eslint-disable-line @typescript-eslint/no-var-requires;
const { createClient } = require('@supabase/supabase-js') // eslint-disable-line @typescript-eslint/no-var-requires;

// CRITICAL: Force Node.js to accept self-signed certificates
// This should only be used in controlled environments with trusted sources
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

// Function to get a PostgreSQL connection pool
function getPool() {
  try {
    // Check for environment variables in different formats
    const connectionString = process.env.POSTGRES_URL ||
                             process.env.DATABASE_URL;
    
    // Alternatively, construct the connection string from individual parts
    const host = process.env.POSTGRES_HOST || process.env.PGHOST;
    const port = process.env.POSTGRES_PORT || process.env.PGPORT || '5432';
    const database = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || 'postgres';
    const user = process.env.POSTGRES_USER || process.env.PGUSER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
    
    // Construct connection string if not provided directly
    const connString = connectionString || 
                     `postgresql://${user}:${password}@${host}:${port}/${database}`;
    
    if (!connString || !connString.includes('@')) {
      console.error('Invalid PostgreSQL connection string or missing parameters');
      return null;
    }
    
    console.log(`Initializing PostgreSQL pool with connection string: ${connString.replace(/:[^:]*@/, ':****@')}`);
    
    const pool = new Pool({
      connectionString: connString,
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true,
        // Force SSL to be disabled to bypass certification issues
        sslmode: 'no-verify'
      }
    });
    
    console.log('PostgreSQL pool initialized successfully');
    return pool;
  } catch (error) {
    console.error('Failed to initialize PostgreSQL pool:', error);
    return null;
  }
}

// Generate fallback artist data
function getFallbackArtist(id) {
  return {
    id: id,
    name: `Artist ${id}`,
    image_url: 'https://via.placeholder.com/300',
    spotify_id: `spotify-${id}`,
    spotify_url: `https://open.spotify.com/artist/placeholder-${id}`,
    label_id: 'unknown'
  };
}

module.exports = async (req, res) => {
  // We'll always return a 200 status code with appropriate metadata
  let statusDetails = {
    success: false,
    source: null,
    error: null,
    took: 0
  };
  
  const startTime = Date.now();
  
  try {
    // Get artist ID from the URL
    const { id } = req.query;
    
    if (!id) {
      statusDetails.error = 'Missing id parameter';
      return res.status(200).json({ 
        artist: getFallbackArtist('unknown'),
        metadata: {
          ...statusDetails,
          took: Date.now() - startTime,
          id: 'unknown'
        }
      });
    }
    
    console.log(`Fetching artist with ID: ${id}`);
    
    // Try multiple strategies to fetch the artist
    const artist = await fetchArtistWithFallbacks(id);
    
    // Calculate response time
    const took = Date.now() - startTime;
    
    // Return the result with metadata
    return res.status(200).json({
      artist: artist.data,
      metadata: {
        success: artist.success,
        source: artist.source,
        error: artist.error,
        took,
        id
      }
    });
  } catch (error) {
    console.error('Unexpected error in artist endpoint:', error);
    
    // Calculate response time
    const took = Date.now() - startTime;
    
    // Return fallback data with error information
    return res.status(200).json({
      artist: getFallbackArtist('error'),
      metadata: {
        success: false,
        source: 'error-handler',
        error: error.message,
        took,
        id: req.query.id || 'unknown'
      }
    });
  }
};

// Function to try multiple strategies to fetch an artist
async function fetchArtistWithFallbacks(id) {
  // Strategy 1: Try Supabase first
  try {
    const supabase = initSupabase();
    if (supabase) {
      console.log('Trying to fetch artist with Supabase');
      
      // Check if ID is a UUID or Spotify ID
      let query;
      
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        query = supabase.from('artists').select('*').eq('id', id);
      } else {
        query = supabase.from('artists').select('*').eq('spotify_id', id);
      }
      
      const { data, error } = await query;
      
      if (!error && data && data.length > 0) {
        console.log('Successfully fetched artist with Supabase');
        return {
          success: true,
          source: 'supabase',
          data: data[0],
          error: null
        };
      }
      
      if (error) {
        console.error('Supabase query error:', error);
      } else {
        console.log('No artist found with Supabase');
      }
    }
  } catch (error) {
    console.error('Error fetching artist with Supabase:', error);
  }
  
  // Strategy 2: Try PostgreSQL direct connection
  try {
    const pool = getPool();
    if (pool) {
      console.log('Trying to fetch artist with PostgreSQL');
      
      const client = await pool.connect();
      console.log('Connected to PostgreSQL database');
      
      try {
        let query, params;
        
        // Check if ID is a UUID format or Spotify ID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          // UUID format
          query = 'SELECT * FROM artists WHERE id = $1';
          params = [id];
        } else {
          // Spotify ID format
          query = 'SELECT * FROM artists WHERE spotify_id = $1';
          params = [id];
        }
        
        const result = await client.query(query, params);
        
        if (result.rows.length > 0) {
          console.log('Successfully fetched artist with PostgreSQL');
          return {
            success: true,
            source: 'postgres',
            data: result.rows[0],
            error: null
          };
        } else {
          console.log(`No artist found with ID: ${id}`);
        }
      } catch (error) {
        console.error('PostgreSQL query error:', error);
      } finally {
        client.release();
      }
    }
  } catch (error) {
    console.error('Error fetching artist with PostgreSQL:', error);
  }
  
  // Strategy 3: Return dummy data as fallback
  console.log('All strategies failed, returning fallback data');
  return {
    success: false,
    source: 'fallback-dummy-data',
    data: getFallbackArtist(id),
    error: 'Failed to fetch artist data from database'
  };
}
