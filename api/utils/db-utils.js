// Common database utilities for serverless API endpoints
const { Pool } = require('pg') // eslint-disable-line @typescript-eslint/no-var-requires;

// Configure SSL based on environment
if (process.env.NODE_ENV !== 'production' || process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('Warning: TLS certificate validation disabled for development');
}

// Create a single pool instance for all database connections
let pool;

/**
 * Get a pool connection to the database
 * @returns {Pool} PostgreSQL connection pool
 */
function getPool() {
  if (pool) {
    return pool;
  }

  // Determine which connection string to use
  let connectionString;
  
  // If POSTGRES_URL_NON_POOLING is set, prefer that (Vercel production format)
  if (process.env.POSTGRES_URL_NON_POOLING) {
    console.log('Using Vercel POSTGRES_URL_NON_POOLING connection string');
    connectionString = process.env.POSTGRES_URL_NON_POOLING;
  }
  // Fall back to explicit connection parameters
  else if (process.env.POSTGRES_HOST) {
    // Build connection string from individual parameters
    const ssl = process.env.POSTGRES_SSL ? 'sslmode=require' : '';
    connectionString = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DATABASE}?${ssl}`;
    console.log(`Using explicit PostgreSQL connection parameters: ${process.env.POSTGRES_HOST}`);
  } else {
    console.error('No PostgreSQL connection parameters found');
    throw new Error('Database connection parameters missing');
  }

  // Create the pool with the connection string
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 10000, // How long to wait before timing out when connecting a new client
  });

  // Add error handler to the pool
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't terminate the process, just log the error and continue
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
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `;
    const result = await client.query(schemaQuery, [tableName]);
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
 * Get all tables in the database
 * @param {Object} client - Database client
 * @returns {Promise<Array>} Array of table names
 */
async function getAllTables(client) {
  try {
    console.log('Attempting to query all tables in the database');
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    const result = await client.query(query);
    console.log(`Found ${result.rows.length} tables in the database`);
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Error fetching tables:', error.message);
    return [];
  }
}

/**
 * Log response details for debugging
 * @param {*} data - Response data
 * @param {string} endpoint - API endpoint
 */
function logResponse(data, endpoint) {
  const timestamp = new Date().toISOString();
  const sample = Array.isArray(data) ? 
    (data.length > 0 ? data.slice(0, 2) : []) : 
    data;
  
  // Format response for logging
  const logData = {
    endpoint,
    timestamp,
    count: Array.isArray(data) ? data.length : (typeof data === 'object' ? 1 : 0),
    sample: typeof sample === 'object' ? JSON.stringify(sample).substring(0, 500) : sample
  };
  
  console.log(`[${timestamp}] Response from ${endpoint}:`, logData);
}

/**
 * Format a standardized API response
 * @param {boolean} success - Was the operation successful
 * @param {string} message - Human-readable message
 * @param {any} data - Response data
 * @returns {Object} Formatted response object
 */
function formatResponse(success, message, data) {
  // Log detailed information about the response for debugging
  console.log(`API Response: success=${success}, message=${message}, data=${data ? 'present' : 'null'}`);
  if (data && typeof data === 'object') {
    console.log(`Data type: ${Array.isArray(data) ? 'array' : 'object'}, length: ${Array.isArray(data) ? data.length : Object.keys(data).length}`);
  }
  
  return {
    success,
    message,
    data
  };
}

/**
 * Add CORS headers to a response
 * @param {Object} res - Express response object
 */
function addCorsHeaders(res) {
  // Define allowed origins
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://build-it-records.vercel.app',
    'https://builditrecords.com',
    'https://www.builditrecords.com'
  ];
  
  // Get the origin from the request
  const origin = res.req.headers.origin;
  
  // Set the appropriate CORS headers
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For non-matching origins or when origin is not present
    res.setHeader('Access-Control-Allow-Origin', 'https://builditrecords.com');
  }
  
  // Allow credentials (cookies, authorization headers)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Allow specific methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  
  // Allow specific headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Cache preflight response for 10 minutes (600 seconds)
  res.setHeader('Access-Control-Max-Age', '600');
}

/**
 * Handle preflight OPTIONS requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleOptions(req, res) {
  addCorsHeaders(res);
  return res.status(200).end();
}

module.exports = {
  getPool,
  getAllTables,
  getTableSchema,
  hasColumn,
  formatResponse,
  addCorsHeaders,
  handleOptions
};
