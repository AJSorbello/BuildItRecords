// Script to inspect database data for troubleshooting
const { Pool } = require('pg');
require('dotenv').config();

// CRITICAL: Force Node.js to accept self-signed certificates
// This should only be used in controlled environments with trusted sources
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Initialize database connection - use the exact same connection string and SSL settings as the working API endpoints
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/builditrecords',
  ssl: {
    rejectUnauthorized: false,
    // Force SSL to be disabled to bypass certification issues
    sslmode: 'no-verify'
  }
});

async function inspectDatabase() {
  console.log('Attempting to connect to database...');
  console.log('Using connection string:', process.env.POSTGRES_URL ? 'Valid connection string found' : 'No connection string available');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database');
  
    // 1. Check if the 'buildit-records' label exists
    console.log('\n=== CHECKING LABELS ===');
    const labelQuery = `SELECT * FROM labels`;
    const labelResult = await client.query(labelQuery);
    console.log(`Found ${labelResult.rowCount} labels:`);
    labelResult.rows.forEach(label => {
      console.log(`- Label ID: ${label.id}, Name: ${label.name}`);
    });
    
    // 2. Check if there are any artists
    console.log('\n=== CHECKING ARTISTS ===');
    const artistQuery = `SELECT a.*, l.name as label_name FROM artists a JOIN labels l ON a.label_id = l.id`;
    try {
      const artistResult = await client.query(artistQuery);
      console.log(`Found ${artistResult.rowCount} artists:`);
      artistResult.rows.forEach(artist => {
        console.log(`- Artist ID: ${artist.id}, Name: ${artist.name}, Label: ${artist.label_name}`);
      });
    } catch (err) {
      console.error('Error querying artists:', err.message);
      
      // Try alternative query
      console.log('Trying alternative artist query...');
      const altArtistQuery = `SELECT * FROM artists`;
      const altArtistResult = await client.query(altArtistQuery);
      console.log(`Found ${altArtistResult.rowCount} artists (using alternative query):`);
      altArtistResult.rows.forEach(artist => {
        console.log(`- Artist ID: ${artist.id}, Name: ${artist.name}, Label ID: ${artist.label_id}`);
      });
    }
    
    // 3. Check if there are any releases
    console.log('\n=== CHECKING RELEASES ===');
    const releaseQuery = `SELECT * FROM releases`;
    const releaseResult = await client.query(releaseQuery);
    console.log(`Found ${releaseResult.rowCount} releases:`);
    releaseResult.rows.slice(0, 5).forEach(release => {
      console.log(`- Release ID: ${release.id}, Title: ${release.title}`);
    });
    
    // 4. Check how labels are referenced (by name or id)
    console.log('\n=== CHECKING HOW LABEL IDS ARE STRUCTURED ===');
    try {
      const labelStructureQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'labels'
      `;
      const labelStructure = await client.query(labelStructureQuery);
      console.log('Labels table columns:');
      labelStructure.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
    } catch (err) {
      console.error('Error checking label structure:', err.message);
    }
    
    // 5. Specific test for buildit-records
    console.log('\n=== CHECKING SPECIFICALLY FOR BUILDIT-RECORDS ===');
    // Try different ways of matching the label
    const labelTests = [
      `SELECT * FROM labels WHERE id = 'buildit-records'`,
      `SELECT * FROM labels WHERE id iLIKE 'buildit-records'`,
      `SELECT * FROM labels WHERE name iLIKE '%buildit%'`
    ];
    
    for (const test of labelTests) {
      try {
        console.log(`Running: ${test}`);
        const testResult = await client.query(test);
        console.log(`Result: ${testResult.rowCount} rows found`);
        if (testResult.rowCount > 0) {
          testResult.rows.forEach(row => {
            console.log(JSON.stringify(row));
          });
        }
      } catch (err) {
        console.error(`Error with test "${test}":`, err.message);
      }
    }
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
  }
}

// Run the inspection
inspectDatabase()
  .then(() => console.log('Database inspection complete'))
  .catch(err => console.error('Error during database inspection:', err))
  .finally(() => {
    pool.end();
    console.log('Connection pool ended');
  });
