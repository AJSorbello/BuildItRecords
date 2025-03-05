// Serverless API handler for fetching artists by label
const { getPool, getTableSchema } = require('../../utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
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
      // Debug the table schema
      console.log('Inspecting database schemas...');
      
      // Check labels table schema
      const labelSchema = await getTableSchema(client, 'labels');
      console.log('Labels table columns:', labelSchema.map(r => r.column_name).join(', '));
      
      // Check actual labels in the database
      const labelData = await client.query('SELECT * FROM labels');
      console.log('Available labels:', labelData.rows.map(l => `${l.id} (${l.name})`).join(', '));
      console.log('Sample label data:', JSON.stringify(labelData.rows[0]));
      
      // Check artists table schema
      const artistsSchema = await getTableSchema(client, 'artists');
      console.log('Artists table columns:', artistsSchema.map(r => r.column_name).join(', '));
      
      // Examine relationships
      console.log('Examining label-artist relationships...');
      
      // Get sample artist to examine
      const sampleArtist = await client.query('SELECT * FROM artists LIMIT 1');
      if (sampleArtist.rows.length > 0) {
        console.log('Sample artist data:', JSON.stringify(sampleArtist.rows[0]));
      } else {
        console.log('No artists found in the database');
      }
      
      // Prepare different variations of the label ID to be more flexible
      const normalizedLabelId = labelId.replace(/-/g, ''); // Remove hyphens
      
      // Check if we're using the correct field for label_id
      let isUsingId = true;
      try {
        // Try to query with label.id
        const testQuery = await client.query(`
          SELECT l.id, l.name FROM labels l
          WHERE l.id = $1
        `, [labelId]);
        console.log(`Test query for label.id found ${testQuery.rows.length} matches`);
        
        // If no results, check if we should use a different field
        if (testQuery.rows.length === 0) {
          const altTestQuery = await client.query(`
            SELECT l.id, l.name, l.slug FROM labels l
            WHERE l.slug = $1 OR l.id::text = $1
          `, [labelId]);
          console.log(`Test query for label.slug/text found ${altTestQuery.rows.length} matches`);
          
          if (altTestQuery.rows.length > 0) {
            isUsingId = false;
            console.log('Label matches using slug/text field instead of id');
          }
        }
      } catch (testErr) {
        console.error('Error testing label queries:', testErr.message);
      }
      
      // Build a flexible query to find artists
      const queries = [];
      
      // Direct ID match query
      queries.push(`
        SELECT a.* 
        FROM artists a
        JOIN labels l ON a.label_id = l.id
        WHERE l.id = $1
      `);
      
      // Normalized ID match query
      queries.push(`
        SELECT a.* 
        FROM artists a
        JOIN labels l ON a.label_id = l.id
        WHERE l.id = $1
      `);
      
      // Name match query
      queries.push(`
        SELECT a.* 
        FROM artists a
        JOIN labels l ON a.label_id = l.id
        WHERE l.name ILIKE $1
      `);
      
      // Slug match query (if slug exists in labels)
      if (labelSchema.some(col => col.column_name === 'slug')) {
        queries.push(`
          SELECT a.* 
          FROM artists a
          JOIN labels l ON a.label_id = l.id
          WHERE l.slug = $1
        `);
      }
      
      // Try each query until we find artists
      let artists = [];
      const queryParams = [
        labelId,
        normalizedLabelId,
        `%${labelId.replace(/-/g, ' ')}%`
      ];
      
      console.log('Executing flexible query with parameters:', queryParams);
      
      for (let i = 0; i < queries.length && artists.length === 0; i++) {
        try {
          const query = queries[i];
          const param = queryParams[Math.min(i, queryParams.length - 1)];
          
          console.log(`Trying query variation ${i+1}:`, query.replace(/\s+/g, ' '));
          const result = await client.query(query, [param]);
          
          if (result.rows.length > 0) {
            console.log(`Found ${result.rows.length} artists with query variation ${i+1}`);
            artists = result.rows;
            break;
          }
        } catch (queryErr) {
          console.error(`Error with query variation ${i+1}:`, queryErr.message);
        }
      }
      
      // If still no artists, try a last-ditch approach with a simplified query
      if (artists.length === 0) {
        console.log('No artists found with flexible queries, trying direct simple query...');
        
        // Check if there are any artists at all
        const countQuery = await client.query('SELECT COUNT(*) FROM artists');
        console.log(`Total artists in database: ${countQuery.rows[0].count}`);
        
        // Check if there are any artists with the matching label_id directly
        try {
          const directQuery = await client.query(`
            SELECT * FROM artists
            WHERE label_id::text = $1
          `, [labelId]);
          
          console.log(`Direct query found ${directQuery.rows.length} artists`);
          if (directQuery.rows.length > 0) {
            artists = directQuery.rows;
          }
        } catch (directErr) {
          console.error('Error with direct query:', directErr.message);
        }
      }
      
      // Format the artists for the response
      const formattedArtists = artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        bio: artist.bio || '',
        imageUrl: artist.image_url || '',
        labelId: artist.label_id,
        spotifyUrl: artist.spotify_url || '',
        createdAt: artist.created_at,
        updatedAt: artist.updated_at
      }));
      
      // Return the artists
      return res.status(200).json({ artists: formattedArtists });
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error fetching artists by label:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
