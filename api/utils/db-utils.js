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
    // Log masked connection URL for debugging
    const maskedUrl = process.env.POSTGRES_URL
      ? process.env.POSTGRES_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
      : 'none';
    console.log('Connection URL (masked):', maskedUrl);
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
    console.log('Connection params (masked):', {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
      password: '***', 
      ssl: poolConfig.ssl
    });
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
    console.log(`Fetching schema for table: ${tableName}`);
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    if (result.rows.length === 0) {
      console.warn(`Warning: No columns found for table ${tableName}. Verify the table exists.`);
    } else {
      console.log(`Found ${result.rows.length} columns for table ${tableName}`);
    }
    
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
  const exists = schema.some(col => col.column_name === columnName);
  console.log(`Column check: '${columnName}' ${exists ? 'exists' : 'does not exist'} in schema`);
  return exists;
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

/**
 * Get all tables in the database
 * @param {Object} client - Database client
 * @returns {Promise<Array>} Array of table names
 */
async function getAllTables(client) {
  try {
    console.log('Fetching all tables in database');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (result.rows.length === 0) {
      console.warn('Warning: No tables found in database');
    } else {
      console.log(`Found ${result.rows.length} tables in database`);
      console.log('Tables:', result.rows.map(row => row.table_name).join(', '));
    }
    
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Error fetching tables:', error.message);
    return [];
  }
}

// Add CORS headers helper function
function addCorsHeaders(res) {
  // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
}

module.exports = {
  getPool,
  getTableSchema,
  hasColumn,
  logResponse,
  getAllTables,
  addCorsHeaders
};
