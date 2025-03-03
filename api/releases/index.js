// Serverless API handler for fetching releases
const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  try {
    console.log('Fetching releases');
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Query for releases
      const query = `
        SELECT r.*, a.name as artist_name
        FROM releases r
        LEFT JOIN artists a ON r.artist_id = a.id
        ORDER BY r.release_date DESC
        LIMIT 50
      `;
      
      const result = await client.query(query);
      
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
