// Serverless API handler for fetching a single release by ID
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const { addCorsHeaders } = require('../utils/db-utils');

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

// Generate fallback release data
function getFallbackRelease(id) {
  return {
    id: id,
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
  const startTime = Date.now();
  
  try {
    // Get release ID from the URL
    const { id } = req.query;
    
    if (!id) {
      console.error('Missing ID parameter');
      return res.status(200).json({ 
        release: getFallbackRelease('unknown'),
        metadata: {
          success: false,
          source: 'error-handler',
          error: 'Missing id parameter',
          took: Date.now() - startTime,
          id: 'unknown'
        }
      });
    }
    
    console.log(`Fetching release with ID: ${id}`);
    
    // Try multiple strategies to fetch the release
    let release = null;
    
    // Strategy 1: Try Supabase
    try {
      const supabase = initSupabase();
      if (supabase) {
        console.log('Trying to fetch release with Supabase');
        
        const { data, error } = await supabase
          .from('releases')
          .select('*, artists(*), labels(*)')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          console.log('Successfully fetched release with Supabase');
          release = {
            success: true,
            source: 'supabase',
            data: data,
            error: null
          };
        } else {
          console.error('Supabase query error or no data found:', error || 'No data');
        }
      }
    } catch (error) {
      console.error('Error fetching release with Supabase:', error);
    }
    
    // If Supabase failed, return fallback data
    if (!release) {
      console.log('All strategies failed, returning fallback data');
      release = {
        success: false,
        source: 'fallback-dummy-data',
        data: getFallbackRelease(id),
        error: 'Failed to fetch release data from database'
      };
    }
    
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
