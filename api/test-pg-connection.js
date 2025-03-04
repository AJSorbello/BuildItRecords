// Direct test of pg module and database connection
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Starting PostgreSQL connection test');

// Environment variables for debugging
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_PORT:', process.env.DB_PORT);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_USER exists:', !!process.env.DB_USER);
console.log('- DB_SSL:', process.env.DB_SSL);

// Test pg module version
try {
  console.log('pg version:', require('pg/package.json').version);
} catch (e) {
  console.error('Error loading pg package.json:', e.message);
}

// Test connection
async function testConnection() {
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable is not set');
    process.exit(1);
  }
  
  console.log('Testing connection to PostgreSQL...');
  
  // Create a pool with disabled SSL verification to handle self-signed certs
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
      // Force SSL to be disabled to bypass certification issues
      sslmode: 'no-verify'
    }
  });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database!');
    
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Query executed successfully. Server time:', result.rows[0].time);
    
    await client.release();
    console.log('Connection released');
    
    await pool.end();
    console.log('Pool ended');
    
    console.log('🎉 PostgreSQL connection test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    process.exit(1);
  }
}

// Run the test
testConnection();
