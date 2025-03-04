// Serverless API handler for fetching artists by label
const { Pool } = require('pg');

// CRITICAL: Force Node.js to accept self-signed certificates
// This should only be used in controlled environments with trusted sources
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Initialize database connection using environment variables
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
    // Force SSL to be disabled to bypass certification issues
    sslmode: 'no-verify'
  }
});

// Function to log environment values without exposing sensitive data
function logEnvironment() {
  console.log('API Environment:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
  console.log('- DB_HOST exists:', !!process.env.DB_HOST);
  console.log('- NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
}

module.exports = async (req, res) => {
  // Log environment for debugging
  logEnvironment();
  
  try {
    // Get label ID from the URL
    const { labelId } = req.query;
    
    if (!labelId) {
      return res.status(400).json({ error: 'Missing labelId parameter' });
    }
    
    console.log(`Fetching artists for label: ${labelId}`);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Query for artists with the specified label
      const query = `
        SELECT a.* 
        FROM artists a
        JOIN labels l ON a.label_id = l.id
        WHERE l.id = $1
        ORDER BY a.name ASC
      `;
      
      const result = await client.query(query, [labelId]);
      
      console.log(`Found ${result.rows.length} artists for label ${labelId}`);
      
      // Format response to match expected structure
      const response = {
        artists: result.rows.map(artist => ({
          id: artist.id,
          name: artist.name,
          bio: artist.bio || '',
          spotifyId: artist.spotify_id || '',
          imageUrl: artist.image_url || '',
          labelId: artist.label_id,
          createdAt: artist.created_at,
          updatedAt: artist.updated_at
        }))
      };
      
      // Return the artists
      return res.status(200).json(response);
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error fetching artists:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
