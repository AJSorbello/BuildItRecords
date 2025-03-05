// Common database utilities for serverless API endpoints
const { Pool } = require('pg');

// Configure SSL based on environment
if (process.env.NODE_ENV !== 'production' || process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('Warning: TLS certificate validation disabled for development');
}

// Create a single pool instance for all database connections
let pool;

/**
 * Get or create a database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
function getPool() {
  if (pool) {
    return pool;
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
    console.log('Using individual connection parameters');
  }

  // Add common options
  poolConfig.connectionTimeoutMillis = 10000;
  poolConfig.idleTimeoutMillis = 30000;
  poolConfig.max = 20; // Maximum number of clients in the pool

  // Initialize database connection
  pool = new Pool(poolConfig);
  
  // Log pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  
  return pool;
}

/**
 * Get the table schema with column names and types
 * @param {Object} client - Database client
 * @param {string} tableName - Table name to inspect
 * @returns {Promise<Array>} Array of column definitions
 */
async function getTableSchema(client, tableName) {
  try {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    return result.rows;
  } catch (error) {
    console.error(`Error fetching schema for ${tableName}:`, error.message);
    return [];
  }
}

/**
 * Check if a column exists in a table
 * @param {Array} schema - Array of column definitions from getTableSchema
 * @param {string} columnName - Column name to check
 * @returns {boolean} True if column exists
 */
function hasColumn(schema, columnName) {
  return schema.some(col => col.column_name === columnName);
}

/**
 * Log response details for debugging
 * @param {Object} data - Response data
 * @param {string} endpoint - API endpoint
 */
function logResponse(data, endpoint) {
  // For large datasets, only log summary information
  let summary;
  
  if (Array.isArray(data)) {
    summary = `Array with ${data.length} items`;
    if (data.length > 0) {
      const sampleItem = typeof data[0] === 'object' 
        ? { ...data[0], _sample: true }
        : data[0];
      console.log(`Sample item:`, sampleItem);
    }
  } else if (typeof data === 'object' && data !== null) {
    summary = {};
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        summary[key] = `Array[${data[key].length}]`;
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        summary[key] = 'Object';
      } else {
        summary[key] = data[key];
      }
    });
  } else {
    summary = data;
  }
  
  console.log(`[${endpoint}] Response summary:`, summary);
}

module.exports = {
  getPool,
  getTableSchema,
  hasColumn,
  logResponse
};
