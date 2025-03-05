const { Pool } = require('pg');
const { getPool, getAllTables, getTableSchema, addCorsHeaders } = require('./utils/db-utils');

module.exports = async (req, res) => {
  console.log('Running database diagnostic');
  
  // Add CORS headers
  addCorsHeaders(res);
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  let client;
  let diagnosticResults = {};
  
  try {
    // Environment info
    diagnosticResults.environment = process.env.NODE_ENV || 'development';
    
    // Get database connection
    console.log('Environment:', diagnosticResults.environment);
    const connection = {
      host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
      database: process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'builditrecords',
      port: process.env.POSTGRES_PORT || process.env.DB_PORT || '5432',
      ssl: process.env.DB_SSL || 'false',
      connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || 'none'
    };
    console.log('Database connection params:', {
      ...connection,
      connectionString: connection.connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
    });
    
    const pool = getPool();
    diagnosticResults.database = connection.database;
    client = await pool.connect();
    console.log('Connected to database');
    
    // Get all tables in database
    console.log('Fetching all tables in database');
    const tables = await getAllTables(client);
    diagnosticResults.tables = tables;
    console.log(`Found ${tables.length} tables in database`);
    console.log('Tables:', tables.join(', '));
    
    // Check artists table
    diagnosticResults.artistsInfo = {};
    if (tables.includes('artists')) {
      console.log('Fetching schema for table: artists');
      const artistsSchema = await getTableSchema(client, 'artists');
      diagnosticResults.artistsInfo.schema = artistsSchema;
      console.log(`Found ${artistsSchema.length} columns for table artists`);
      
      // Check total artists count
      const artistsCount = await client.query('SELECT COUNT(*) FROM artists');
      diagnosticResults.artistsInfo.totalCount = parseInt(artistsCount.rows[0].count);
      
      // Check if label_id column exists
      const hasLabelId = artistsSchema.some(col => col.column_name === 'label_id');
      diagnosticResults.artistsInfo.hasLabelId = hasLabelId;
      
      if (hasLabelId) {
        // Check buildit-records count
        const builditCount = await client.query(`
          SELECT COUNT(*) FROM artists WHERE label_id = 'buildit-records'
        `);
        diagnosticResults.artistsInfo.builditRecordsCount = parseInt(builditCount.rows[0].count);
        
        // Check case-insensitive
        const caseInsensitiveCount = await client.query(`
          SELECT COUNT(*) FROM artists WHERE label_id ILIKE 'buildit-records'
        `);
        diagnosticResults.artistsInfo.caseInsensitiveCount = parseInt(caseInsensitiveCount.rows[0].count);
        
        // Get unique label values and counts
        const labelValues = await client.query(`
          SELECT label_id, COUNT(*) FROM artists
          WHERE label_id IS NOT NULL
          GROUP BY label_id
          ORDER BY COUNT(*) DESC
        `);
        diagnosticResults.artistsInfo.labelValues = labelValues.rows;
      }
      
      // Check artists via relationships
      const artistsViaRelationships = await client.query(`
        SELECT COUNT(DISTINCT a.id) AS count
        FROM artists a
        JOIN release_artists ra ON a.id = ra.artist_id
        JOIN releases r ON ra.release_id = r.id
        WHERE r.label_id = 'buildit-records'
      `);
      diagnosticResults.artistsInfo.artistsViaRelationshipsCount = parseInt(artistsViaRelationships.rows[0].count);
    } else {
      diagnosticResults.artistsInfo.error = 'Artists table not found';
    }
    
    // Check releases table
    diagnosticResults.releasesInfo = {};
    if (tables.includes('releases')) {
      console.log('Fetching schema for table: releases');
      const releasesSchema = await getTableSchema(client, 'releases');
      diagnosticResults.releasesInfo.schema = releasesSchema;
      console.log(`Found ${releasesSchema.length} columns for table releases`);
      
      // Check total releases count
      const releasesCount = await client.query('SELECT COUNT(*) FROM releases');
      diagnosticResults.releasesInfo.totalCount = parseInt(releasesCount.rows[0].count);
      
      // Check if label_id column exists
      const hasLabelId = releasesSchema.some(col => col.column_name === 'label_id');
      diagnosticResults.releasesInfo.hasLabelId = hasLabelId;
      
      if (hasLabelId) {
        // Check buildit-records count
        const builditCount = await client.query(`
          SELECT COUNT(*) FROM releases WHERE label_id = 'buildit-records'
        `);
        diagnosticResults.releasesInfo.builditRecordsCount = parseInt(builditCount.rows[0].count);
        
        // Check case-insensitive
        const caseInsensitiveCount = await client.query(`
          SELECT COUNT(*) FROM releases WHERE label_id ILIKE 'buildit-records'
        `);
        diagnosticResults.releasesInfo.caseInsensitiveCount = parseInt(caseInsensitiveCount.rows[0].count);
        
        // Get unique label values and counts
        const labelValues = await client.query(`
          SELECT label_id, COUNT(*) FROM releases
          WHERE label_id IS NOT NULL
          GROUP BY label_id
          ORDER BY COUNT(*) DESC
        `);
        diagnosticResults.releasesInfo.labelValues = labelValues.rows;
        
        // Get releases with label_id like %buildit%
        const likeBuilditCount = await client.query(`
          SELECT label_id, COUNT(*) FROM releases
          WHERE label_id ILIKE '%buildit%'
          GROUP BY label_id
          ORDER BY COUNT(*) DESC
        `);
        diagnosticResults.releasesInfo.likeBuilditCount = likeBuilditCount.rows;
      }
    } else {
      diagnosticResults.releasesInfo.error = 'Releases table not found';
    }
    
    // Check release_artists table
    diagnosticResults.releaseArtistsInfo = {};
    if (tables.includes('release_artists')) {
      console.log('Fetching schema for table: release_artists');
      const releaseArtistsSchema = await getTableSchema(client, 'release_artists');
      diagnosticResults.releaseArtistsInfo.schema = releaseArtistsSchema;
      console.log(`Found ${releaseArtistsSchema.length} columns for table release_artists`);
      
      // Check total relationships count
      const relationshipsCount = await client.query('SELECT COUNT(*) FROM release_artists');
      diagnosticResults.releaseArtistsInfo.totalCount = parseInt(relationshipsCount.rows[0].count);
      
      // Check unique artists
      const uniqueArtists = await client.query('SELECT COUNT(DISTINCT artist_id) FROM release_artists');
      diagnosticResults.releaseArtistsInfo.uniqueArtistsCount = parseInt(uniqueArtists.rows[0].count);
      
      // Check unique releases
      const uniqueReleases = await client.query('SELECT COUNT(DISTINCT release_id) FROM release_artists');
      diagnosticResults.releaseArtistsInfo.uniqueReleasesCount = parseInt(uniqueReleases.rows[0].count);
    } else {
      diagnosticResults.releaseArtistsInfo.error = 'Release_artists table not found';
    }
    
    // Check labels table and info
    diagnosticResults.labelInfo = {};
    if (tables.includes('labels')) {
      // Check for buildit-records label
      const builditLabel = await client.query(`
        SELECT * FROM labels WHERE id = 'buildit-records'
      `);
      diagnosticResults.labelInfo.builditRecords = builditLabel.rows[0] || null;
      
      // Get all possible BuildIt labels
      const possibleBuilditLabels = await client.query(`
        SELECT * FROM labels WHERE id ILIKE '%buildit%'
      `);
      diagnosticResults.labelInfo.possibleBuilditLabels = possibleBuilditLabels.rows;
    } else {
      diagnosticResults.labelInfo.error = 'Labels table not found';
    }
    
    console.log('Database connection released');
    
  } catch (error) {
    console.log('Diagnostic error:', error);
    diagnosticResults.error = error.message;
    diagnosticResults.stack = error.stack;
  } finally {
    if (client) client.release();
  }
  
  // Send response - handle both Express.js and plain Node.js HTTP response objects
  try {
    if (typeof res.status === 'function') {
      // Express-style response
      res.status(200).json({ diagnosticResults });
    } else {
      // Node.js HTTP module response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ diagnosticResults }));
    }
  } catch (error) {
    console.error('Error sending response:', error);
    if (typeof res.status === 'function') {
      res.status(500).json({ error: error.message });
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }
};
