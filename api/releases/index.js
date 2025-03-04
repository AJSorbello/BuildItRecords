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
      let query;
      let params = [];
      
      // Log the structure of the tables for debugging
      console.log('Checking database schema...');
      
      try {
        // First, let's check the columns in the releases table
        const tableInfo = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'releases'
        `);
        console.log('Releases table columns:', tableInfo.rows.map(r => r.column_name).join(', '));
      } catch (schemaErr) {
        console.error('Error checking schema:', schemaErr.message);
      }
      
      // If label is provided, fetch releases for that label
      if (label) {
        query = `
          SELECT r.*, a.name as artist_name
          FROM releases r
          LEFT JOIN artists a ON r.artist_id = a.id
          LEFT JOIN labels l ON a.label_id = l.id
          WHERE l.id = $1
          ORDER BY r.release_date DESC
          LIMIT 50
        `;
        params = [label];
      } else {
        // Query for all releases
        query = `
          SELECT r.*, a.name as artist_name
          FROM releases r
          LEFT JOIN artists a ON r.artist_id = a.id
          ORDER BY r.release_date DESC
          LIMIT 50
        `;
      }
      
      console.log('Executing query:', query);
      console.log('Parameters:', params);
      
      const result = await client.query(query, params);
      
      console.log(`Found ${result.rows.length} releases`);
      
      // Format the response
      const releases = result.rows.map(release => ({
        id: release.id,
        title: release.title,
        artistId: release.artist_id,
        artistName: release.artist_name,
        releaseDate: release.release_date,
        type: release.type || 'single',
        imageUrl: release.image_url || '',
        spotifyId: release.spotify_id || '',
        catalogNumber: release.catalog_number || '',
        createdAt: release.created_at,
        updatedAt: release.updated_at
      }));
      
      // Return the releases
      return res.status(200).json({ releases });
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
