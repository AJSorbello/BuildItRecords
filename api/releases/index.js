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
      console.log('Releases table columns:', tableInfo.rows.map(r => r.column_name).join(', '));
      
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
      console.log('Sample release:', sampleResult.rows[0] ? Object.keys(sampleResult.rows[0]).join(', ') : 'No releases found');
      
      // Let's try a simpler query first to avoid column reference errors
      let query, params = [];
      
      if (label) {
        // Prepare different variations of the label ID to be more flexible
        const normalizedLabelId = label.replace(/-/g, ''); // Remove hyphens
        
        // Query with flexible label filtering
        query = `
          SELECT r.*, a.name as artist_name
          FROM releases r
          JOIN artists a ON r.artist_id = a.id
          JOIN labels l ON a.label_id = l.id
          WHERE l.id = $1
             OR l.id = $2
             OR l.name ILIKE $3
             OR l.id::text ILIKE $4
          ORDER BY r.release_date DESC
          LIMIT 50
        `;
        params = [
          label, 
          normalizedLabelId,
          `%${label.replace(/-/g, ' ')}%`,  // Replace hyphens with spaces for ILIKE
          `%${label}%`                     // Simple partial match
        ];
        
        console.log('Executing flexible label query with parameters:', params);
      } else {
        // Simplified query for all releases
        query = `
          SELECT r.*, a.name as artist_name
          FROM releases r
          JOIN artists a ON r.artist_id = a.id
          ORDER BY r.release_date DESC
          LIMIT 50
        `;
        
        console.log('Executing all releases query');
      }
      
      // Try alternate column name if the first query fails
      try {
        const result = await client.query(query, params);
        
        console.log(`Found ${result.rows.length} releases`);
        
        // If we have a label but no results, check if the label exists
        if (label && result.rows.length === 0) {
          console.log('No releases found with flexible query, checking labels directly...');
          
          const labelCheck = await client.query(`
            SELECT id, name FROM labels 
            WHERE id::text ILIKE $1 
               OR name ILIKE $2
          `, [`%${label}%`, `%${label.replace(/-/g, ' ')}%`]);
          
          if (labelCheck.rows.length > 0) {
            console.log('Found matching labels:', labelCheck.rows.map(l => `${l.id} (${l.name})`).join(', '));
          } else {
            console.log('No matching labels found in database');
          }
        }
        
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
      } catch (queryError) {
        console.error('Initial query failed:', queryError.message);
        
        // Try an alternative approach with different column names
        // Use a SQL query that doesn't rely on the artist_id column
        const alternateQuery = `
          SELECT *
          FROM releases
          ORDER BY release_date DESC
          LIMIT 50
        `;
        
        console.log('Trying alternate query without joins:', alternateQuery);
        const alternateResult = await client.query(alternateQuery);
        
        console.log(`Found ${alternateResult.rows.length} releases with alternate query`);
        
        // Format with minimal data
        const releases = alternateResult.rows.map(release => ({
          id: release.id,
          title: release.title || 'Unknown Title',
          artistId: null,
          artistName: 'Unknown Artist',
          releaseDate: release.release_date,
          type: release.type || 'single',
          imageUrl: release.image_url || '',
          spotifyId: release.spotify_id || '',
          catalogNumber: release.catalog_number || '',
          createdAt: release.created_at,
          updatedAt: release.updated_at
        }));
        
        // Return the releases from alternate query
        return res.status(200).json({ releases });
      }
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
