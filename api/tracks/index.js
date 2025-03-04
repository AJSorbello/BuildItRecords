// Serverless API handler for fetching tracks
const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'no-verify'
  }
});

module.exports = async (req, res) => {
  try {
    console.log('Fetching tracks');
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Query for tracks
      const query = `
        SELECT t.*, 
               a.name as artist_name, 
               r.title as release_title, 
               r.image_url as release_image
        FROM tracks t
        LEFT JOIN artists a ON t.artist_id = a.id
        LEFT JOIN releases r ON t.release_id = r.id
        ORDER BY t.created_at DESC
        LIMIT 50
      `;
      
      const result = await client.query(query);
      
      console.log(`Found ${result.rows.length} tracks`);
      
      // Format the response to match expected structure
      const tracks = result.rows.map(track => ({
        id: track.id,
        title: track.title,
        artistId: track.artist_id,
        artistName: track.artist_name,
        releaseId: track.release_id,
        releaseTitle: track.release_title || 'Unknown Release',
        releaseImageUrl: track.release_image || '',
        audioUrl: track.audio_url || '',
        spotifyId: track.spotify_id || '',
        duration: track.duration || 0,
        isrc: track.isrc || '',
        createdAt: track.created_at,
        updatedAt: track.updated_at
      }));
      
      // Return the tracks
      return res.status(200).json({ tracks });
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
