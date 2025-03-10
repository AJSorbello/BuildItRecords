/**
 * Simple debug endpoint to test database connectivity and Supabase client
 * This serves as a template for our other API endpoints
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require('@supabase/supabase-js')
const { addCorsHeaders, getPool, formatResponse } = require('./utils/db-utils')
/* eslint-enable @typescript-eslint/no-var-requires */

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`Debug API Request: ${req.method} ${req.url}`);
  
  // Supabase configuration
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL;
                     
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Response object to collect debugging info
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      node_version: process.version,
      env: process.env.NODE_ENV || 'unknown',
      has_supabase_url: !!supabaseUrl,
      has_supabase_key: !!supabaseKey
    },
    database: {
      pool_connection: false,
      supabase_connection: false
    },
    data: {
      tables: [],
      sample_queries: {}
    }
  };
  
  // Try PostgreSQL direct connection
  let pool = null;
  try {
    console.log('Attempting to initialize database pool...');
    pool = getPool();
    debugInfo.database.pool_connection = true;
    
    // Get database schema information
    const schemaResult = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    // Organize tables and columns
    const tables = {};
    schemaResult.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        column: row.column_name,
        type: row.data_type
      });
    });
    
    debugInfo.data.tables = Object.keys(tables).map(tableName => ({
      name: tableName,
      columns: tables[tableName]
    }));
    
    // Try a sample artists query
    try {
      const artistsResult = await pool.query('SELECT * FROM artists LIMIT 3');
      debugInfo.data.sample_queries.artists = {
        success: true,
        count: artistsResult.rows.length,
        data: artistsResult.rows
      };
    } catch (artistsError) {
      debugInfo.data.sample_queries.artists = {
        success: false,
        error: artistsError.message
      };
    }
    
    // Try a sample releases query
    try {
      const releasesResult = await pool.query('SELECT * FROM releases LIMIT 3');
      debugInfo.data.sample_queries.releases = {
        success: true,
        count: releasesResult.rows.length,
        data: releasesResult.rows
      };
    } catch (releasesError) {
      debugInfo.data.sample_queries.releases = {
        success: false,
        error: releasesError.message
      };
    }
    
  } catch (poolError) {
    console.error(`Database pool initialization error: ${poolError.message}`);
    debugInfo.database.pool_error = poolError.message;
  }
  
  // Try Supabase client connection
  try {
    if (supabaseUrl && supabaseKey) {
      console.log('Testing Supabase client connection...');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test Supabase connection with a simple query
      const { data, error } = await supabase.from('artists').select('count(*)');
      
      if (!error) {
        debugInfo.database.supabase_connection = true;
        debugInfo.data.sample_queries.supabase_artists_count = data;
      } else {
        debugInfo.database.supabase_error = error.message;
      }
    }
  } catch (supabaseError) {
    console.error(`Supabase client error: ${supabaseError.message}`);
    debugInfo.database.supabase_error = supabaseError.message;
  }
  
  // Send response with all debug info
  return res.status(200).json({
    success: true,
    message: "API Debug Information",
    data: debugInfo
  });
};
