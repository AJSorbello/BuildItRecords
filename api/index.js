// Health check API endpoint

// CRITICAL: Force Node.js to accept self-signed certificates
// This should only be used in controlled environments with trusted sources
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = (req, res) => {
  // Log environment for debugging
  console.log('API Environment:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
  console.log('- DB_SSL:', process.env.DB_SSL);
  console.log('- DB_SSL_REJECT_UNAUTHORIZED:', process.env.DB_SSL_REJECT_UNAUTHORIZED);
  console.log('- NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
  
  // Try to load pg module for diagnostic purposes
  try {
    const pg = require('pg') // eslint-disable-line @typescript-eslint/no-var-requires;
    console.log('pg module loaded successfully, version:', pg.version || 'unknown');
    
    // Log SSL configuration details
    console.log('Attempting test connection with SSL configuration:');
    console.log('- SSL Mode: no-verify');
    console.log('- RejectUnauthorized: false');
    
    // Try a simple connection
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'no-verify'
      }
    });
    
    // Basic async connection test
    (async () => {
      try {
        const client = await pool.connect();
        console.log('✅ Test connection successful!');
        await client.release();
        await pool.end();
      } catch (err) {
        console.error('❌ Test connection failed:', err.message);
      }
    })();
    
  } catch (error) {
    console.error('Error loading pg module:', error.message);
  }
  
  // Return health status
  res.status(200).json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    message: 'BuildItRecords API is running',
    tlsVerify: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? 'disabled' : 'enabled'
  });
};
