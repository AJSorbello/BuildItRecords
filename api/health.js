// API Health Check Endpoint
const { getPool, addCorsHeaders } = require('./utils/db-utils');

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`API Health Check Request: ${req.method} ${req.url}`);
  
  const startTime = Date.now();
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: 'not checked', // Default to not checked
    version: process.env.npm_package_version || 'unknown',
    memory: process.memoryUsage(),
    hostname: process.env.VERCEL_URL || req.headers.host || 'localhost',
    status: 'ok'
  };

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
  return res.status(200).json(health);
};
