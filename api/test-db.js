// Simple database test endpoint
const { getPool } = require('./db-utils');

module.exports = async (req, res) => {
  console.log('API: Testing database connection');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get connection pool
  const pool = getPool();
  
  let client;
  try {
    console.log('Attempting to connect to database...');
    client = await pool.connect();
    console.log('Successfully connected to database!');
    
    // Check environment variables
    console.log('Environment info:');
    const envVars = [
      'NODE_ENV',
      'POSTGRES_URL',
      'DB_HOST',
      'DB_NAME',
      'DB_SSL',
      'DB_SSL_REJECT_UNAUTHORIZED'
    ];
    
    const envInfo = {};
    envVars.forEach(varName => {
      // Mask sensitive info
      if (varName.includes('PASSWORD')) {
        envInfo[varName] = process.env[varName] ? '[REDACTED]' : undefined;
      } else {
        envInfo[varName] = process.env[varName];
      }
    });
    
    // Test a simple query
    console.log('Running test query...');
    const result = await client.query('SELECT current_timestamp as time, current_database() as database');
    
    // Get table counts
    const tables = ['artists', 'releases', 'tracks', 'labels', 'release_artists'];
    const tableCounts = {};
    
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        tableCounts[table] = parseInt(countResult.rows[0].count);
      } catch (error) {
        tableCounts[table] = `Error: ${error.message}`;
      }
    }
    
    // Check artists linked to the buildit-records label
    let labelArtistsCount = 0;
    try {
      const labelQuery = `
        SELECT COUNT(DISTINCT a.id)
        FROM artists a
        LEFT JOIN release_artists ra ON a.id = ra.artist_id
        LEFT JOIN releases r ON ra.release_id = r.id
        WHERE r.label_id = 'buildit-records' OR a.label_id = 'buildit-records'
      `;
      const labelResult = await client.query(labelQuery);
      labelArtistsCount = parseInt(labelResult.rows[0].count);
    } catch (error) {
      console.error('Error checking label artists:', error);
    }
    
    // Return success response with diagnostics
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      data: {
        timestamp: result.rows[0].time,
        database: result.rows[0].database,
        environment: envInfo,
        tableCounts,
        labelArtistsCount
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Return detailed error information
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (client) {
      console.log('Releasing database client');
      client.release();
    }
  }
};
