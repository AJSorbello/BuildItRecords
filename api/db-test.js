// Simple database connection test that can be run in Vercel environment
const { Pool } = require('pg');

// Log all connection parameters for debugging
console.log('=== DB Connection Parameters ===');
console.log('POSTGRES_URL is set:', process.env.POSTGRES_URL ? 'Yes (masked)' : 'No');
console.log('POSTGRES_URL_NON_POOLING is set:', process.env.POSTGRES_URL_NON_POOLING ? 'Yes (masked)' : 'No');
console.log('DB_HOST:', process.env.DB_HOST || 'Not set');
console.log('DB_PORT:', process.env.DB_PORT || 'Not set');
console.log('DB_NAME:', process.env.DB_NAME || 'Not set');
console.log('DB_USER:', process.env.DB_USER || 'Not set');
console.log('DB_SSL:', process.env.DB_SSL || 'Not set');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set (masked)' : 'Not set');

// Priority order for connection configuration:
// 1. Use POSTGRES_URL_NON_POOLING first (best for serverless)
// 2. Use POSTGRES_URL as fallback
// 3. Use individual connection params as last resort
let config;

if (process.env.POSTGRES_URL_NON_POOLING) {
  console.log('Using POSTGRES_URL_NON_POOLING for connection');
  config = { 
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false
  };
} else if (process.env.POSTGRES_URL) {
  console.log('Using POSTGRES_URL for connection');
  config = { 
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false
  };
} else {
  console.log('Using individual parameters for connection');
  config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false
  };
}

console.log('Using connection config:', {
  ...config,
  connectionString: config.connectionString ? '[MASKED]' : undefined,
  password: '[MASKED]' // Mask password for security
});

// Create a pool with a single client
const pool = new Pool({
  ...config,
  max: 1,
  idleTimeoutMillis: 5000
});

// Test the connection
async function testConnection() {
  let client;
  try {
    console.log('Attempting to connect to PostgreSQL database...');
    client = await pool.connect();
    console.log('✅ Successfully connected to database!');

    // Test query to check if we can access the database
    const result = await client.query('SELECT current_database() as db_name, current_user as username');
    console.log('Connection info:', result.rows[0]);

    // List all tables in the database
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Found ${tablesResult.rowCount} tables in the database:`);
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Test queries against specific tables
    try {
      const artistsResult = await client.query('SELECT COUNT(*) FROM artists');
      console.log(`Found ${artistsResult.rows[0].count} artist records`);
      
      // Sample artist data
      const artistSample = await client.query('SELECT * FROM artists LIMIT 1');
      if (artistSample.rows.length > 0) {
        console.log('Sample artist:', artistSample.rows[0]);
      }
    } catch (err) {
      console.log('Could not query artists table:', err.message);
    }

    try {
      const releasesResult = await client.query('SELECT COUNT(*) FROM releases');
      console.log(`Found ${releasesResult.rows[0].count} release records`);
      
      // Sample release data
      const releaseSample = await client.query('SELECT * FROM releases LIMIT 1');
      if (releaseSample.rows.length > 0) {
        console.log('Sample release:', releaseSample.rows[0]);
      }
    } catch (err) {
      console.log('Could not query releases table:', err.message);
    }

    return { 
      success: true, 
      message: 'Database connection successful', 
      tables: tablesResult.rows.map(row => row.table_name)
    };
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (client) {
      try {
        client.release();
        console.log('Database client released');
      } catch (err) {
        console.error('Error releasing client:', err.message);
      }
    }
    
    try {
      await pool.end();
      console.log('Connection pool ended');
    } catch (err) {
      console.error('Error ending pool:', err.message);
    }
  }
}

// For serverless environment
module.exports = async (req, res) => {
  const result = await testConnection();
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  res.status(result.success ? 200 : 500).json(result);
};

// For local testing
if (require.main === module) {
  testConnection()
    .then(result => {
      console.log('Test completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}
