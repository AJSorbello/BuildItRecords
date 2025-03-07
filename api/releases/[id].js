// Serverless API handler for fetching a release by ID
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const { addCorsHeaders } = require('../utils/db-utils');

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
    const constructedConnectionString = connectionString || `postgres://${user}:${password}@${host}:${port}/${database}`;
    
    console.log(`Creating PostgreSQL pool with host: ${host || 'from connection string'}`);
    
    // Configuration with extended timeout and proper SSL handling
    const pool = new Pool({
      connectionString: constructedConnectionString,
      ssl: { rejectUnauthorized: false }, // Accept self-signed certificates
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      max: 20, // Maximum number of clients in the pool
    });
    
    console.log('PostgreSQL pool created successfully');
    return pool;
  } catch (error) {
    console.error('Error creating PostgreSQL pool:', error);
    return null;
  }
}

// Function to generate a fallback release for testing or when data is unavailable
function getFallbackRelease(id) {
  // Create a realistic-looking fallback release
  return {
    id: id || 'unknown',
    title: `Release ${id}`,
    name: `Release ${id}`,
    type: 'album',
    release_date: '2025-01-01',
    image_url: 'https://via.placeholder.com/300',
    spotify_id: `spotify-${id}`,
    label_id: 'unknown'
  };
}

module.exports = async (req, res) => {
  // Add CORS headers to ensure cross-origin requests work properly
  addCorsHeaders(res);
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log(`API Request: ${req.method} ${req.url} (Single Release)`);
  
  // We'll always return a 200 status code with appropriate metadata
  let statusDetails = {
    success: false,
    source: null,
    error: null,
    took: 0
  };
  
  const startTime = Date.now();
  
  try {
    // Get release ID from the URL
    const { id } = req.query;
    
    if (!id) {
      statusDetails.error = 'Missing id parameter';
      return res.status(200).json({ 
        release: getFallbackRelease('unknown'),
        metadata: {
          ...statusDetails,
          took: Date.now() - startTime,
          id: 'unknown'
        }
      });
    }
    
    console.log(`Fetching release with ID: ${id}`);
    
    // Try multiple strategies to fetch the release
    const release = await fetchReleaseWithFallbacks(id);
    
    // Calculate response time
    const took = Date.now() - startTime;
    
    // Return the result with metadata
    return res.status(200).json({
      release: release.data,
      metadata: {
        success: release.success,
        source: release.source,
        error: release.error,
        took,
        id
      }
    });
  } catch (error) {
    console.error('Unexpected error in release endpoint:', error);
    
    // Calculate response time
    const took = Date.now() - startTime;
    
    // Return fallback data with error information
    return res.status(200).json({
      release: getFallbackRelease('error'),
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

// Function to try multiple strategies to fetch a release
async function fetchReleaseWithFallbacks(id) {
  console.log(`Fetching release data for ID: ${id} with fallback strategies`);
  
  // Strategy 1: Try Supabase first
  try {
    const supabase = initSupabase();
    if (supabase) {
      console.log('Using Supabase to fetch release data');
      
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.warn('Supabase query error:', error);
      } else if (data) {
        console.log('Successfully fetched release data from Supabase');
        return {
          success: true,
          source: 'supabase',
          error: null,
          data
        };
      } else {
        console.log('No release found in Supabase with ID:', id);
      }
    }
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
  }
  
  // Strategy 2: Try PostgreSQL direct connection
  try {
    const pool = getPool();
    if (pool) {
      console.log('Using PostgreSQL to fetch release data');
      
      const query = 'SELECT * FROM releases WHERE id = $1 LIMIT 1';
      const result = await pool.query(query, [id]);
      
      if (result.rows && result.rows.length > 0) {
        console.log('Successfully fetched release data from PostgreSQL');
        return {
          success: true,
          source: 'postgres',
          error: null,
          data: result.rows[0]
        };
      } else {
        console.log('No release found in PostgreSQL with ID:', id);
      }
      
      // Close the pool to avoid memory leaks
      await pool.end();
    }
  } catch (error) {
    console.error('Error fetching from PostgreSQL:', error);
  }
  
  // Strategy 3: Check if ID is a Spotify ID and try to fetch from Spotify API
  // This would be implemented here if we had Spotify API integration
  
  // Strategy 4: Try to match by name or other metadata
  // This would be a more complex search strategy
  
  // Fallback: Return dummy data for testing
  console.log('All data fetch strategies failed, returning fallback data');
  return {
    success: false,
    source: 'fallback-dummy-data',
    error: 'Failed to fetch release data from database',
    data: getFallbackRelease(id)
  };
}
