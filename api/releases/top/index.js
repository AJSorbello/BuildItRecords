// Dedicated endpoint for top releases
const { addCorsHeaders } = require('../../utils/db-utils');
const { getPool } = require('../../utils/db-utils');
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

// Generate fallback top releases data
function getFallbackReleases(count = 10, labelId = null) {
  const releases = [];
  for (let i = 1; i <= count; i++) {
    releases.push({
      id: `dummy-${i}`,
      title: `Top Release ${i}`,
      name: `Top Release ${i}`,
      artist_name: `Featured Artist ${i}`,
      artist_id: `artist-${i}`,
      image_url: 'https://via.placeholder.com/300',
      type: i % 2 === 0 ? 'album' : 'single',
      release_date: `2025-0${i}-01`,
      label_id: labelId || 'top-charts',
      popularity: 100 - (i * 10),
      featured: true
    });
  }
  return releases;
}

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`API Request: ${req.method} ${req.url} (Top Releases)`);
  
  // We'll always return a 200 status code with appropriate metadata
  const startTime = Date.now();
  
  // Get query parameters
  const { label, limit = 10 } = req.query;
  const labelId = label; // For clarity
  const limitNum = parseInt(limit, 10) || 10;
  
  // Log the request
  console.log(`Fetching top releases with params: label=${labelId}, limit=${limitNum}`);
  
  try {
    // Fetch releases using multiple strategies
    const result = await fetchTopReleasesWithFallbacks(labelId, limitNum);
    
    // Calculate response time
    const took = Date.now() - startTime;
    
    // Return formatted response with metadata
    return res.status(200).json({
      releases: result.data, // This returns an array of releases
      metadata: {
        count: result.data.length,
        limit: limitNum,
        label: labelId,
        success: result.success,
        source: result.source,
        error: result.error,
        took
      }
    });
  } catch (error) {
    console.error('Unexpected error in top releases endpoint:', error);
    
    // Calculate response time
    const took = Date.now() - startTime;
    
    // Generate fallback releases (ensure it returns an array)
    const fallbackReleases = getFallbackReleases(limitNum, labelId);
    
    // Return fallback data with error information
    return res.status(200).json({
      releases: fallbackReleases, // This returns an array of releases
      metadata: {
        count: fallbackReleases.length,
        limit: limitNum,
        label: labelId,
        success: false,
        source: 'error-handler',
        error: error.message,
        took
      }
    });
  }
};

// Function to fetch top releases with multiple strategies
async function fetchTopReleasesWithFallbacks(labelId, limit) {
  console.log(`Fetching top releases with label=${labelId}, limit=${limit}`);
  
  // Strategy 1: Try Supabase
  try {
    const supabase = initSupabase();
    if (supabase) {
      console.log('Using Supabase to fetch top releases');
      
      let query = supabase.from('releases')
        .select('*, artists(*)')
        .order('popularity', { ascending: false })
        .limit(limit);
      
      // Apply label filter if specified
      if (labelId) {
        query = query.eq('label_id', labelId);
      }
      
      const { data, error } = await query;
      
      if (!error && data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} top releases from Supabase`);
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
        console.log('No top releases found with Supabase');
      }
    }
  } catch (error) {
    console.error('Error fetching top releases with Supabase:', error);
  }
  
  // Strategy 2: Try PostgreSQL
  try {
    const pool = getPool();
    if (pool) {
      console.log('Using PostgreSQL to fetch top releases');
      
      try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL database');
        
        try {
          // First try a comprehensive query with joins
          try {
            let query, params;
            
            if (labelId) {
              query = `
                SELECT r.*, a.name as artist_name
                FROM releases r
                LEFT JOIN artists a ON r.artist_id = a.id
                WHERE r.label_id = $1
                ORDER BY r.popularity DESC NULLS LAST, r.release_date DESC
                LIMIT $2
              `;
              params = [labelId, limit];
            } else {
              query = `
                SELECT r.*, a.name as artist_name
                FROM releases r
                LEFT JOIN artists a ON r.artist_id = a.id
                ORDER BY r.popularity DESC NULLS LAST, r.release_date DESC
                LIMIT $1
              `;
              params = [limit];
            }
            
            const result = await client.query(query, params);
            
            if (result.rows.length > 0) {
              console.log(`Successfully fetched ${result.rows.length} top releases with PostgreSQL`);
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
              
              if (labelId) {
                simpleQuery = `
                  SELECT * FROM releases 
                  WHERE label_id = $1
                  ORDER BY release_date DESC
                  LIMIT $2
                `;
                params = [labelId, limit];
              } else {
                simpleQuery = `
                  SELECT * FROM releases 
                  ORDER BY release_date DESC
                  LIMIT $1
                `;
                params = [limit];
              }
              
              const result = await client.query(simpleQuery, params);
              
              if (result.rows.length > 0) {
                console.log(`Successfully fetched ${result.rows.length} top releases with simple query`);
                return {
                  success: true,
                  source: 'postgres-simple',
                  data: result.rows,
                  error: null
                };
              }
            } catch (simpleError) {
              console.error('Error with simple query:', simpleError);
            }
          }
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('PostgreSQL query error:', error);
      }
    }
  } catch (error) {
    console.error('Error fetching top releases with PostgreSQL:', error);
  }
  
  // Strategy 3: Return dummy data as fallback
  console.log('All strategies failed, returning fallback data');
  return {
    success: false,
    source: 'fallback-dummy-data',
    data: getFallbackReleases(limit, labelId),
    error: 'Failed to fetch top releases data from database'
  };
}
