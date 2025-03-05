/**
 * API URL Test Utility
 * 
 * This script helps diagnose issues with API URL construction
 */

// Setup database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test endpoint handler
module.exports = async (req, res) => {
  // Capture request information
  const requestInfo = {
    url: req.url,
    method: req.method,
    headers: req.headers,
    baseUrl: req.baseUrl || 'none',
    path: req.path || 'none',
    originalUrl: req.originalUrl || 'none'
  };
  
  let dbStatus = 'Not tested';
  let tables = [];
  
  // Test database connection
  try {
    const client = await pool.connect();
    
    try {
      // Try a simple query to see if the connection works
      const tableResult = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
      );
      
      tables = tableResult.rows.map(row => row.table_name);
      dbStatus = 'Connected';
    } catch (queryErr) {
      dbStatus = `Query error: ${queryErr.message}`;
    } finally {
      client.release();
    }
  } catch (dbErr) {
    dbStatus = `Connection error: ${dbErr.message}`;
  }
  
  // Send response with diagnostic information
  res.status(200).json({
    success: true,
    message: 'API URL test endpoint',
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    request: requestInfo,
    database: {
      status: dbStatus,
      tables: tables
    }
  });
};
