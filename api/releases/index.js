// Serverless API handler for fetching releases
const { Pool } = require('pg');

// CRITICAL: Force Node.js to accept self-signed certificates
// This should only be used in controlled environments with trusted sources
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
    // Force SSL to be disabled to bypass certification issues
    sslmode: 'no-verify'
  }
});

module.exports = async (req, res) => {
  try {
    console.log('Fetching releases');
    
    // Get optional label parameter
    const { label } = req.query;
    console.log('Label parameter:', label);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Log the structure of the tables for thorough debugging
      console.log('Checking database schemas...');
      
      // Check releases table
      let tableInfo = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'releases'
      `);
      const releaseColumns = tableInfo.rows.map(r => r.column_name);
      console.log('Releases table columns:', releaseColumns.join(', '));
      
      // Check artists table
      tableInfo = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'artists'
      `);
      console.log('Artists table columns:', tableInfo.rows.map(r => r.column_name).join(', '));
      
      // Check labels table
      tableInfo = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'labels'
      `);
      console.log('Labels table columns:', tableInfo.rows.map(r => r.column_name).join(', '));
      
      // Check actual labels in the database
      const labelData = await client.query('SELECT id, name FROM labels');
      console.log('Available labels:', labelData.rows.map(l => `${l.id} (${l.name})`).join(', '));
      
      // First get a sample release to understand the structure
      const sampleResult = await client.query(`SELECT * FROM releases LIMIT 1`);
      if (sampleResult.rows.length > 0) {
        console.log('Sample release:', Object.keys(sampleResult.rows[0]).join(', '));
      } else {
        console.log('Sample release: No releases found');
      }
      
      // Based on the schema we found, construct the appropriate query
      let hasLabelId = releaseColumns.includes('label_id');
      let hasPrimaryArtistId = releaseColumns.includes('primary_artist_id');
      let hasArtistId = releaseColumns.includes('artist_id');
      
      console.log(`Release table has: label_id: ${hasLabelId}, primary_artist_id: ${hasPrimaryArtistId}, artist_id: ${hasArtistId}`);
      
      // Let's try different query strategies based on what we found
      let releases = [];
      
      // Strategy 1: Direct label filtering on releases if they have label_id
      if (hasLabelId && label) {
        const normalizedLabelId = label.replace(/-/g, ''); // Remove hyphens
        console.log('Trying direct label_id query on releases table');
        
        // Query directly on releases.label_id
        const directQuery = `
          SELECT r.*, a.name as artist_name
          FROM releases r
          LEFT JOIN artists a ON r.primary_artist_id = a.id
          WHERE r.label_id = $1
             OR r.label_id = $2
             OR r.label_id::text ILIKE $3
          ORDER BY r.release_date DESC
          LIMIT 50
        `;
        
        try {
          const result = await client.query(directQuery, [
            label,
            normalizedLabelId,
            `%${label}%`
          ]);
          
          console.log(`Found ${result.rows.length} releases with direct label_id query`);
          
          if (result.rows.length > 0) {
            releases = result.rows;
          }
        } catch (directErr) {
          console.error('Error with direct label_id query:', directErr.message);
        }
      }
      
      // Strategy 2: Query using primary_artist_id join to artists and then to labels
      if (releases.length === 0 && hasPrimaryArtistId && label) {
        console.log('Trying primary_artist_id join query');
        
        const joinQuery = `
          SELECT r.*, a.name as artist_name
          FROM releases r
          JOIN artists a ON r.primary_artist_id = a.id
          JOIN labels l ON a.label_id = l.id
          WHERE l.id = $1
          ORDER BY r.release_date DESC
          LIMIT 50
        `;
        
        try {
          const result = await client.query(joinQuery, [label]);
          console.log(`Found ${result.rows.length} releases with primary_artist_id join query`);
          
          if (result.rows.length > 0) {
            releases = result.rows;
          }
        } catch (joinErr) {
          console.error('Error with primary_artist_id join query:', joinErr.message);
        }
      }
      
      // Strategy 3: Try using a simple name match if previous strategies failed
      if (releases.length === 0 && label) {
        console.log('Trying label name matching query');
        
        const nameQuery = `
          SELECT r.*, a.name as artist_name
          FROM releases r
          LEFT JOIN artists a ON r.primary_artist_id = a.id
          JOIN labels l ON l.name ILIKE $1
          ORDER BY r.release_date DESC
          LIMIT 50
        `;
        
        try {
          const result = await client.query(nameQuery, [`%${label.replace(/-/g, ' ')}%`]);
          console.log(`Found ${result.rows.length} releases with label name matching query`);
          
          if (result.rows.length > 0) {
            releases = result.rows;
          }
        } catch (nameErr) {
          console.error('Error with label name matching query:', nameErr.message);
        }
      }
      
      // Final strategy: Get all releases if no label filtering or previous queries failed
      if (releases.length === 0) {
        console.log('Trying basic query for all releases');
        
        let basicQuery = '';
        
        // Select appropriate query based on schema
        if (hasPrimaryArtistId) {
          basicQuery = `
            SELECT r.*, a.name as artist_name
            FROM releases r
            LEFT JOIN artists a ON r.primary_artist_id = a.id
            ORDER BY r.release_date DESC
            LIMIT 50
          `;
        } else {
          basicQuery = `
            SELECT r.*
            FROM releases r
            ORDER BY r.release_date DESC
            LIMIT 50
          `;
        }
        
        try {
          const result = await client.query(basicQuery);
          console.log(`Found ${result.rows.length} releases with basic query`);
          
          if (result.rows.length > 0) {
            releases = result.rows;
          }
        } catch (basicErr) {
          console.error('Error with basic query:', basicErr.message);
          
          // Last resort: just get all releases without joins
          try {
            const simpleResult = await client.query(`
              SELECT * FROM releases 
              ORDER BY release_date DESC 
              LIMIT 50
            `);
            
            console.log(`Found ${simpleResult.rows.length} releases with simple query`);
            releases = simpleResult.rows;
          } catch (simpleErr) {
            console.error('Error with simple query:', simpleErr.message);
          }
        }
      }
      
      // Format the response
      const formattedReleases = releases.map(release => ({
        id: release.id,
        title: release.title || 'Unknown Title',
        artistId: release.primary_artist_id || release.artist_id || null,
        artistName: release.artist_name || 'Unknown Artist',
        releaseDate: release.release_date,
        type: release.release_type || release.type || 'single',
        imageUrl: release.artwork_url || release.image_url || '',
        spotifyId: release.spotify_id || '',
        spotifyUrl: release.spotify_url || '',
        catalogNumber: release.catalog_number || '',
        createdAt: release.created_at,
        updatedAt: release.updated_at
      }));
      
      // Return the releases
      return res.status(200).json({ releases: formattedReleases });
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error fetching releases:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
