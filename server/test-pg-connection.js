// Direct test of pg module and database connection
require('dotenv').config();
const { Client } = require('pg');

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

// Test function using connection string
async function testConnectionWithString() {
  console.log('\n🧪 Testing connection with connection string');
  
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ No connection string found in environment variables');
    return false;
  }
  
  console.log('Connection string available (masked for security)');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully with connection string!');
    
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Query executed successfully. Server time:', result.rows[0].time);
    
    await client.end();
    console.log('Connection closed');
    return true;
  } catch (err) {
    console.error('❌ Connection failed with connection string:', err.message);
    try {
      await client.end();
    } catch (e) {
      // Ignore
    }
    return false;
  }
}

// Test function using individual parameters
async function testConnectionWithParams() {
  console.log('\n🧪 Testing connection with individual parameters');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully with individual parameters!');
    
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Query executed successfully. Server time:', result.rows[0].time);
    
    await client.end();
    console.log('Connection closed');
    return true;
  } catch (err) {
    console.error('❌ Connection failed with individual parameters:', err.message);
    try {
      await client.end();
    } catch (e) {
      // Ignore
    }
    return false;
  }
}

// Run tests
async function runTests() {
  try {
    console.log('🧪 Verifying pg module installation');
    console.log('- pg version:', require('pg/package.json').version);
    
    let success = false;
    
    // First try with connection string
    if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
      success = await testConnectionWithString();
    } else {
      console.log('No connection string found, skipping this test');
    }
    
    // Then try with individual parameters
    if (!success && process.env.DB_HOST) {
      success = await testConnectionWithParams();
    } else if (!process.env.DB_HOST) {
      console.log('No DB_HOST found, skipping individual parameters test');
    }
    
    if (success) {
      console.log('\n🎉 SUCCESS: PostgreSQL connection works!');
      process.exit(0);
    } else {
      console.error('\n❌ FAILED: Could not connect to PostgreSQL database');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
