// Diagnostic endpoint to directly check database setup and content
const { getPool, getAllTables, getTableSchema } = require('./utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  try {
    console.log('Running database diagnostic');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database connection params:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL
    });
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    let diagnosticResults = {
      environment: process.env.NODE_ENV || 'unknown',
      database: process.env.DB_NAME || 'unknown',
      tables: [],
      artistsInfo: {},
      releasesInfo: {},
      labelInfo: {}
    };
    
    try {
      // Get all tables
      const tables = await getAllTables(client);
      diagnosticResults.tables = tables;
      
      // Check artists table
      if (tables.includes('artists')) {
        // Get artists count
        const artistsCount = await client.query('SELECT COUNT(*) FROM artists');
        diagnosticResults.artistsInfo.totalCount = parseInt(artistsCount.rows[0].count);
        
        // Get artists schema
        const artistsSchema = await getTableSchema(client, 'artists');
        diagnosticResults.artistsInfo.columns = artistsSchema.map(col => col.column_name);
        
        // Check if label_id exists
        const hasLabelId = artistsSchema.some(col => col.column_name === 'label_id');
        diagnosticResults.artistsInfo.hasLabelIdColumn = hasLabelId;
        
        if (hasLabelId) {
          // Check label values
          const labelValues = await client.query(`
            SELECT label_id, COUNT(*) 
            FROM artists 
            WHERE label_id IS NOT NULL 
            GROUP BY label_id
          `);
          diagnosticResults.artistsInfo.labelValues = labelValues.rows;
          
          // Check buildit-records specifically
          const builditArtists = await client.query(`
            SELECT COUNT(*) FROM artists WHERE label_id = 'buildit-records'
          `);
          diagnosticResults.artistsInfo.builditRecordsCount = parseInt(builditArtists.rows[0].count);
          
          // Check case-insensitive
          const caseInsensitiveCheck = await client.query(`
            SELECT COUNT(*) FROM artists WHERE LOWER(label_id) = LOWER('buildit-records')
          `);
          diagnosticResults.artistsInfo.caseInsensitiveCount = parseInt(caseInsensitiveCheck.rows[0].count);
          
          // Sample 5 artists
          const sampleArtists = await client.query('SELECT id, name, label_id FROM artists LIMIT 5');
          diagnosticResults.artistsInfo.sampleArtists = sampleArtists.rows;
        }
      }
      
      // Check releases table
      if (tables.includes('releases')) {
        // Get releases count
        const releasesCount = await client.query('SELECT COUNT(*) FROM releases');
        diagnosticResults.releasesInfo.totalCount = parseInt(releasesCount.rows[0].count);
        
        // Get releases schema
        const releasesSchema = await getTableSchema(client, 'releases');
        diagnosticResults.releasesInfo.columns = releasesSchema.map(col => col.column_name);
        
        // Check if label_id exists
        const hasLabelId = releasesSchema.some(col => col.column_name === 'label_id');
        diagnosticResults.releasesInfo.hasLabelIdColumn = hasLabelId;
        
        if (hasLabelId) {
          // Check label values
          const labelValues = await client.query(`
            SELECT label_id, COUNT(*) 
            FROM releases 
            WHERE label_id IS NOT NULL 
            GROUP BY label_id
          `);
          diagnosticResults.releasesInfo.labelValues = labelValues.rows;
          
          // Check buildit-records specifically
          const builditReleases = await client.query(`
            SELECT COUNT(*) FROM releases WHERE label_id = 'buildit-records'
          `);
          diagnosticResults.releasesInfo.builditRecordsCount = parseInt(builditReleases.rows[0].count);
          
          // Check case-insensitive
          const caseInsensitiveCheck = await client.query(`
            SELECT COUNT(*) FROM releases WHERE LOWER(label_id) = LOWER('buildit-records')
          `);
          diagnosticResults.releasesInfo.caseInsensitiveCount = parseInt(caseInsensitiveCheck.rows[0].count);
          
          // Sample 5 releases
          const sampleReleases = await client.query('SELECT id, title, label_id FROM releases LIMIT 5');
          diagnosticResults.releasesInfo.sampleReleases = sampleReleases.rows;
          
          // Check for any label containing "buildit"
          const likeCheck = await client.query(`
            SELECT label_id, COUNT(*) 
            FROM releases 
            WHERE label_id LIKE '%buildit%' 
            GROUP BY label_id
          `);
          diagnosticResults.releasesInfo.likeBuilditCount = likeCheck.rows;
        }
      }
      
      // Check junction table
      if (tables.includes('release_artists')) {
        const junctionCount = await client.query('SELECT COUNT(*) FROM release_artists');
        diagnosticResults.junctionTableCount = parseInt(junctionCount.rows[0].count);
        
        const junctionSchema = await getTableSchema(client, 'release_artists');
        diagnosticResults.junctionTableColumns = junctionSchema.map(col => col.column_name);
      }
      
      // Check labels directly
      try {
        const labelCount = await client.query(`
          SELECT label_id, COUNT(*) as release_count 
          FROM releases 
          GROUP BY label_id 
          ORDER BY COUNT(*) DESC 
          LIMIT 10
        `);
        diagnosticResults.labelInfo.topLabels = labelCount.rows;
        
        // Try to find what the actual label ID is for BuildIt Records
        const possibleLabels = await client.query(`
          SELECT DISTINCT label_id 
          FROM releases 
          WHERE label_id ILIKE '%build%' OR label_id ILIKE '%bit%'
        `);
        diagnosticResults.labelInfo.possibleBuilditLabels = possibleLabels.rows;
      } catch (labelError) {
        diagnosticResults.labelInfo.error = labelError.message;
      }
      
      // Return diagnostic results
      return res.status(200).json({
        success: true,
        diagnosticResults,
        timestamp: new Date().toISOString()
      });
    } finally {
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Diagnostic error:', error);
    return res.status(500).json({
      success: false,
      error: 'Diagnostic error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
