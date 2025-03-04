// Serverless API handler for artists
const { Pool } = require('pg');

// CRITICAL: Force Node.js to accept self-signed certificates
// This should only be used in controlled environments with trusted sources
if (process.env.NODE_ENV !== 'production' || process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Create connection options
let poolConfig;

if (process.env.POSTGRES_URL) {
  // Use connection string if available
  poolConfig = {
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
  };
  console.log('Using connection string from POSTGRES_URL');
} else {
  // Use individual parameters
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'builditrecords',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    // Only use SSL if explicitly set to true
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false
  };
  console.log('Using individual connection parameters:', JSON.stringify({
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    ssl: !!poolConfig.ssl
  }));
}

// Add common options
poolConfig.connectionTimeoutMillis = 10000;
poolConfig.idleTimeoutMillis = 10000;

// Initialize database connection
const pool = new Pool(poolConfig);

module.exports = async (req, res) => {
  try {
    console.log('Processing artists request', req.query);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // First check the schema to understand artist columns
      const schemaResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'artists' 
        ORDER BY ordinal_position
      `);
      
      // Log the schema for debugging
      console.log(`Artists table has ${schemaResult.rows.length} columns:`);
      const columnNames = schemaResult.rows.map(row => row.column_name);
      console.log('Available columns:', columnNames.join(', '));
      
      // Build the query based on parameters
      let query = '';
      let queryParams = [];
      const { label } = req.query;
      
      try {
        if (label) {
          console.log(`Fetching artists for label: ${label}`);
          
          // Determine if we should use 'id' or 'label_id' 
          const hasLabelId = columnNames.includes('label_id');
          const labelColumn = hasLabelId ? 'label_id' : 'id';
          
          query = `
            SELECT * 
            FROM artists 
            WHERE ${labelColumn} = $1 
            ORDER BY name 
            LIMIT 50
          `;
          queryParams = [label];
        } else {
          query = `
            SELECT * 
            FROM artists 
            ORDER BY name 
            LIMIT 50
          `;
        }
        
        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);
        
        const result = await client.query(query, queryParams);
        console.log(`Found ${result.rows.length} artists`);
        
        // Return the results in the format expected by the frontend
        return res.status(200).json({ 
          success: true,
          data: {
            artists: result.rows,
          },
          _meta: {
            count: result.rows.length,
            query: { label },
            timestamp: new Date().toISOString()
          }
        });
      } catch (queryError) {
        console.error('Query error:', queryError.message);
        
        // Try a fallback query if there was an error
        try {
          console.log('Attempting fallback query without WHERE clause');
          const fallbackQuery = `
            SELECT * 
            FROM artists 
            ORDER BY name 
            LIMIT 50
          `;
          
          const fallbackResult = await client.query(fallbackQuery);
          console.log(`Fallback found ${fallbackResult.rows.length} artists`);
          
          return res.status(200).json({ 
            success: true,
            data: {
              artists: fallbackResult.rows,
            },
            _meta: {
              count: fallbackResult.rows.length,
              fallback: true,
              error: queryError.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (fallbackError) {
          // If even the fallback fails, return the error
          console.error('Fallback query error:', fallbackError.message);
          return res.status(500).json({ 
            success: false,
            error: 'Database query error', 
            details: fallbackError.message,
            originalError: queryError.message
          });
        }
      }
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      details: error.message
    });
  }
};
