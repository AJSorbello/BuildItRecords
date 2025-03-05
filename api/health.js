// API Health Check Endpoint
const { getPool } = require('./utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  const startTime = Date.now();
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: 'checking...',
    version: process.env.npm_package_version || 'unknown',
    memory: process.memoryUsage(),
    hostname: process.env.VERCEL_URL || req.headers.host || 'localhost',
    status: 'ok'
  };

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
        ping: Date.now() - startTime + 'ms'
      };
      
      // Try to get some basic stats about the database
      try {
        const statsResult = await client.query(`
          SELECT 
            (SELECT COUNT(*) FROM releases) as releases_count,
            (SELECT COUNT(*) FROM artists) as artists_count,
            (SELECT COUNT(*) FROM tracks) as tracks_count
        `);
        
        if (statsResult.rows.length > 0) {
          health.databaseStats = statsResult.rows[0];
        }
      } catch (statError) {
        console.log('Could not retrieve database stats:', statError.message);
        // Non-critical error, we can continue
      }
      
      return res.status(200).json(health);
    } catch (queryError) {
      health.database = {
        status: 'error',
        message: queryError.message,
        error: 'Database query failed'
      };
      
      return res.status(500).json(health);
    } finally {
      client.release();
    }
  } catch (connectionError) {
    health.database = {
      status: 'error',
      message: connectionError.message,
      error: 'Database connection failed'
    };
    
    return res.status(503).json(health);
  } finally {
    health.responseTime = Date.now() - startTime + 'ms';
  }
};
