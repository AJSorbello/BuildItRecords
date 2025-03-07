/**
 * Diagnostic endpoint for checking database connections and configuration
 */
const { createClient } = require('@supabase/supabase-js');
const { addCorsHeaders, getPool } = require('../../utils/db-utils');

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get start time to measure response time
  const startTime = Date.now();
  
  // Basic info about the request and environment
  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    request: {
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query
    },
    database: {
      status: 'pending',
      supabase: {
        url: process.env.SUPABASE_URL || 
             process.env.VITE_SUPABASE_URL || 
             process.env.NEXT_PUBLIC_SUPABASE_URL || 
             'not set',
        key_length: process.env.SUPABASE_ANON_KEY ? 
                   process.env.SUPABASE_ANON_KEY.length : 0
      },
      postgres: {
        host: process.env.POSTGRES_HOST || 'not set',
        port: process.env.POSTGRES_PORT || 'not set',
        database: process.env.POSTGRES_DATABASE || 'not set',
        ssl: process.env.POSTGRES_SSL || 'not set'
      }
    }
  };
  
  try {
    // Test Supabase connection
    console.log('Testing database connections from diagnostic endpoint');
    
    // Check Supabase environment variables
    const supabaseUrl = process.env.SUPABASE_URL || 
                       process.env.VITE_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL;
                      
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                       process.env.VITE_SUPABASE_ANON_KEY || 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables missing');
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try a simple query to labels table
    const { data: labels, error: labelsError } = await supabase
      .from('labels')
      .select('*');
    
    if (labelsError) {
      throw new Error(`Supabase query failed: ${labelsError.message}`);
    }
    
    diagnosticInfo.database.status = 'ok';
    diagnosticInfo.database.supabase.connected = true;
    diagnosticInfo.database.tables = {
      labels: {
        count: labels.length,
        sample: labels.length > 0 ? labels[0] : null
      }
    };
    
    // Try a simple query to releases table
    const { data: releases, error: releasesError } = await supabase
      .from('releases')
      .select('*')
      .limit(1);
    
    diagnosticInfo.database.tables.releases = {
      status: releasesError ? 'error' : 'ok',
      error: releasesError ? releasesError.message : null,
      count: releases ? releases.length : 0,
      sample: releases && releases.length > 0 ? releases[0] : null
    };
    
    // Try a simple query to artists table
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('*')
      .limit(1);
    
    diagnosticInfo.database.tables.artists = {
      status: artistsError ? 'error' : 'ok',
      error: artistsError ? artistsError.message : null,
      count: artists ? artists.length : 0,
      sample: artists && artists.length > 0 ? artists[0] : null
    };
    
    // Try a simple query to tracks table
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('*')
      .limit(1);
    
    diagnosticInfo.database.tables.tracks = {
      status: tracksError ? 'error' : 'ok',
      error: tracksError ? tracksError.message : null,
      count: tracks ? tracks.length : 0,
      sample: tracks && tracks.length > 0 ? tracks[0] : null
    };
    
  } catch (error) {
    console.error('Error in diagnostic endpoint:', error);
    diagnosticInfo.database.status = 'error';
    diagnosticInfo.database.error = error.message;
  }
  
  // Add response time
  diagnosticInfo.responseTime = Date.now() - startTime;
  
  // Return diagnostic information
  return res.status(200).json({
    success: true,
    message: 'Diagnostic information',
    data: diagnosticInfo
  });
};
