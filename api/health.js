// API Health Check and Diagnostic Endpoint
const { createClient } = require('@supabase/supabase-js');
const { getPool, addCorsHeaders, getTableSchema, getAllTables } = require('./utils/db-utils');

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`API Health/Diagnostic Request: ${req.method} ${req.url}`);
  
  // Parse the URL to determine which endpoint was requested
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const isDiagnostic = url.searchParams.has('diagnostic') || 
                      (pathSegments.length > 1 && pathSegments[1] === 'diagnostic');
  
  const startTime = Date.now();
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: 'not checked', // Default to not checked
    version: process.env.npm_package_version || 'unknown',
    memory: isDiagnostic ? process.memoryUsage() : undefined,
    hostname: process.env.VERCEL_URL || req.headers.host || 'localhost',
    status: 'ok'
  };

  // If this is a diagnostic request, include more detailed information
  if (isDiagnostic) {
    health.request = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query
    };
    
    health.environment = {
      node_env: process.env.NODE_ENV || 'development',
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
    };
  }

  // Try to check database, but don't fail if unavailable
  try {
    // Initialize database connection
    const pool = getPool();
    
    if (pool) {
      try {
        // Check database connection
        const client = await pool.connect();
        try {
          // Test quick query
          const result = await client.query('SELECT NOW() as time');
          const dbTime = result.rows[0].time;
          
          // Database connectivity details
          health.database = {
            status: 'connected',
            time: dbTime,
            latency: Date.now() - startTime
          };
          
          // If this is a diagnostic request, include more detailed database information
          if (isDiagnostic) {
            // Get all tables
            const tables = await getAllTables(client);
            health.database.tables = {};
            
            // Get schema for each table
            for (const tableName of tables) {
              const schema = await getTableSchema(client, tableName);
              health.database.tables[tableName] = {
                columns: schema,
                count: 0,
                sample: null
              };
              
              // Get count and sample for the table
              try {
                const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                health.database.tables[tableName].count = parseInt(countResult.rows[0].count);
                
                // Get a sample row if table is not empty
                if (health.database.tables[tableName].count > 0) {
                  const sampleResult = await client.query(`SELECT * FROM ${tableName} LIMIT 1`);
                  health.database.tables[tableName].sample = sampleResult.rows[0];
                }
              } catch (tableError) {
                health.database.tables[tableName].error = tableError.message;
              }
            }
          }
          
        } catch (dbQueryError) {
          health.database = {
            status: 'error',
            message: 'Query failed',
            error: dbQueryError.message
          };
        } finally {
          // Always release client
          client.release();
        }
      } catch (dbConnectError) {
        health.database = {
          status: 'error',
          message: 'Connection failed',
          error: dbConnectError.message
        };
      }
    } else {
      health.database = {
        status: 'unavailable',
        message: 'Database pool not initialized'
      };
    }
    
    // If this is a diagnostic request, check Supabase connection too
    if (isDiagnostic) {
      const supabaseUrl = process.env.SUPABASE_URL || 
                        process.env.VITE_SUPABASE_URL || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL;
                       
      const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                        process.env.VITE_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        try {
          // Initialize Supabase client
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Try a simple query to labels table
          const { data: labels, error: labelsError } = await supabase
            .from('labels')
            .select('*');
          
          health.supabase = {
            status: labelsError ? 'error' : 'connected',
            error: labelsError ? labelsError.message : null,
            tables: {}
          };
          
          if (!labelsError) {
            health.supabase.tables.labels = {
              count: labels.length,
              sample: labels.length > 0 ? labels[0] : null
            };
            
            // Try other tables
            const tables = ['releases', 'artists', 'tracks'];
            for (const table of tables) {
              const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
              
              health.supabase.tables[table] = {
                status: error ? 'error' : 'ok',
                error: error ? error.message : null,
                count: data ? data.length : 0,
                sample: data && data.length > 0 ? data[0] : null
              };
            }
          }
        } catch (supabaseError) {
          health.supabase = {
            status: 'error',
            error: supabaseError.message
          };
        }
      } else {
        health.supabase = {
          status: 'unavailable',
          message: 'Supabase configuration missing'
        };
      }
    }
  } catch (error) {
    // If there's any error in the database check, just record it
    health.database = {
      status: 'error',
      message: 'Failed to check database',
      error: error.message
    };
  }

  // Add response time
  health.responseTime = Date.now() - startTime;

  // Always return a 200 status for the health endpoint
  if (isDiagnostic) {
    return res.status(200).json({
      success: true,
      message: 'Diagnostic information',
      data: health
    });
  } else {
    return res.status(200).json(health);
  }
};
