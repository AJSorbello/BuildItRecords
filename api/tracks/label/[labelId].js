// Serverless API handler for fetching tracks by label
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
    // Get label ID from the URL
    const { labelId } = req.query;
    
    if (!labelId) {
      return res.status(400).json({ error: 'Missing labelId parameter' });
    }
    
    console.log(`Fetching tracks for label: ${labelId}`);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Query for tracks with the specified label
      const query = `
        SELECT t.*, 
               a.name as artist_name, 
               r.title as release_title, 
               r.image_url as release_image
        FROM tracks t
        JOIN artists a ON t.artist_id = a.id
        JOIN labels l ON a.label_id = l.id
        LEFT JOIN releases r ON t.release_id = r.id
        WHERE l.label_id = $1
        ORDER BY t.created_at DESC
        LIMIT 50
      `;
      
      const result = await client.query(query, [labelId]);
      
      console.log(`Found ${result.rows.length} tracks for label ${labelId}`);
      
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
    console.error('Error fetching tracks by label:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
