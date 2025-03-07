/**
 * Health check endpoint to verify API status and database connections
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
  
  // Get server info
  const serverInfo = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    version: 'unknown',
    memory: process.memoryUsage(),
    hostname: req.headers.host,
    status: 'ok'
  };
  
  // Database connection check
  let databaseInfo = {
    status: 'pending',
    message: 'Testing database connection',
    error: null,
    connection: {
      postgres_host: process.env.POSTGRES_HOST || 'not set',
      supabase_url: process.env.SUPABASE_URL || 
                   process.env.VITE_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   'not set'
    }
  };
  
  try {
    // Test Supabase connection
    console.log('Testing Supabase connection from health endpoint');
    
    // Check Supabase env variables 
    const supabaseUrl = process.env.SUPABASE_URL || 
                       process.env.VITE_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL;
                      
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                       process.env.VITE_SUPABASE_ANON_KEY || 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables missing');
    }
    
    databaseInfo.connection.supabase_url = supabaseUrl;
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
    
    // Try a simple query
    const { data, error } = await supabase.from('labels').select('*').limit(1);
    
    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    
    if (data && data.length > 0) {
      databaseInfo.status = 'ok';
      databaseInfo.message = 'Supabase connection successful';
      databaseInfo.sample_data = {
        labels: data
      };
    } else {
      databaseInfo.status = 'warning';
      databaseInfo.message = 'Supabase connected but no data found';
    }
    
    // Additionally try PostgreSQL connection
    try {
      const pool = getPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const result = await client.query('SELECT NOW()');
          databaseInfo.postgres = {
            status: 'ok',
            timestamp: result.rows[0].now
          };
        } finally {
          client.release();
        }
      } else {
        databaseInfo.postgres = {
          status: 'error',
          message: 'PostgreSQL pool not available'
        };
      }
    } catch (pgError) {
      databaseInfo.postgres = {
        status: 'error',
        message: pgError.message
      };
    }
    
  } catch (error) {
    databaseInfo.status = 'error';
    databaseInfo.message = 'Connection failed';
    databaseInfo.error = error.message;
    console.error('Database connection error:', error);
  }
  
  // Calculate response time
  serverInfo.responseTime = Date.now() - startTime;
  
  // Return the health information
  return res.status(200).json({
    ...serverInfo,
    database: databaseInfo
  });
};
