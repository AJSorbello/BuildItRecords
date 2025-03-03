// Test script to verify Supabase database connection
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables

console.log('Testing database connection with the following settings:');
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_PORT:', process.env.DB_PORT);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_SSL:', process.env.DB_SSL);

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
  } : false
});

async function testConnection() {
  try {
    console.log('Attempting to connect to the database...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Test query
    const result = await client.query('SELECT NOW() as time');
    console.log('Database time:', result.rows[0].time);
    
    // Get artist count
    try {
      const artistResult = await client.query('SELECT COUNT(*) FROM artists');
      console.log('Number of artists in database:', artistResult.rows[0].count);
    } catch (err) {
      console.error('Error querying artists table:', err.message);
    }
    
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to the database:', err.message);
    console.error('Connection details:');
    console.error(JSON.stringify({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      } : false
    }, null, 2));
  } finally {
    await pool.end();
  }
}

testConnection();
