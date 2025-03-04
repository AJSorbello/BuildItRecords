// Serverless API handler for fetching an artist by ID
const { Pool } = require('pg');

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
    // Get artist ID from the URL
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing id parameter' });
    }
    
    console.log(`Fetching artist with ID: ${id}`);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      let query, params;
      
      // Check if ID is a UUID format or Spotify ID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        // UUID format
        query = 'SELECT * FROM artists WHERE id = $1';
        params = [id];
      } else {
        // Spotify ID format
        query = 'SELECT * FROM artists WHERE spotify_id = $1';
        params = [id];
      }
      
      const result = await client.query(query, params);
      
      if (result.rows.length === 0) {
        console.log(`No artist found with ID: ${id}`);
        return res.status(404).json({ error: 'Artist not found' });
      }
      
      console.log(`Found artist: ${result.rows[0].name}`);
      
      // Format the artist object
      const artist = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        bio: result.rows[0].bio || '',
        spotifyId: result.rows[0].spotify_id || '',
        imageUrl: result.rows[0].image_url || '',
        labelId: result.rows[0].label_id,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
      
      // Return the artist
      return res.status(200).json(artist);
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error fetching artist:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
