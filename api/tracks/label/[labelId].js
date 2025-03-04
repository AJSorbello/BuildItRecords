// Serverless API handler for fetching tracks by label
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
      // Debug the table schema
      console.log('Inspecting database schemas...');
      
      try {
        // Check labels table schema
        const labelInfo = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'labels'
        `);
        console.log('Labels table columns:', labelInfo.rows.map(r => r.column_name).join(', '));
        
        // Check actual labels in the database
        const labelData = await client.query('SELECT id, name FROM labels');
        console.log('Available labels:', labelData.rows.map(l => `${l.id} (${l.name})`).join(', '));
        
        // Check tracks table schema
        const tracksInfo = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'tracks'
        `);
        console.log('Tracks table columns:', tracksInfo.rows.map(r => r.column_name).join(', '));
      } catch (schemaErr) {
        console.error('Error checking schema:', schemaErr.message);
      }
      
      // Prepare different variations of the label ID to be more flexible
      const normalizedLabelId = labelId.replace(/-/g, ''); // Remove hyphens
      
      // Query for tracks with flexible label matching
      const flexibleQuery = `
        SELECT t.*, 
               a.name as artist_name, 
               r.title as release_title, 
               r.image_url as release_image
        FROM tracks t
        JOIN artists a ON t.artist_id = a.id
        JOIN labels l ON a.label_id = l.id
        LEFT JOIN releases r ON t.release_id = r.id
        WHERE l.id = $1
           OR l.id = $2
           OR l.name ILIKE $3
           OR l.id::text ILIKE $4
        ORDER BY t.created_at DESC
        LIMIT 50
      `;
      
      console.log('Executing flexible query with parameters:', 
        labelId, normalizedLabelId, `%${labelId.replace(/-/g, ' ')}%`, `%${labelId}%`);
      
      const result = await client.query(flexibleQuery, [
        labelId, 
        normalizedLabelId,
        `%${labelId.replace(/-/g, ' ')}%`,  // Replace hyphens with spaces for ILIKE
        `%${labelId}%`                     // Simple partial match
      ]);
      
      console.log(`Found ${result.rows.length} tracks for label ${labelId}`);
      
      // If the flexible query returned no results, try a direct query on the labels table
      if (result.rows.length === 0) {
        console.log('No tracks found with flexible query, checking labels directly...');
        
        const labelCheck = await client.query(`
          SELECT id, name FROM labels 
          WHERE id::text ILIKE $1 
             OR name ILIKE $2
        `, [`%${labelId}%`, `%${labelId.replace(/-/g, ' ')}%`]);
        
        if (labelCheck.rows.length > 0) {
          console.log('Found matching labels:', labelCheck.rows.map(l => `${l.id} (${l.name})`).join(', '));
        } else {
          console.log('No matching labels found in database');
        }
      }
      
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
