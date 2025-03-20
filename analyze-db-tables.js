/**
 * Database tables analysis script
 * Examines all tables, counts, and relations in the database
 * Shows detailed distribution of artists and releases by label
 */
require('dotenv').config();
const { Pool } = require('pg');

async function analyzeDatabase() {
  console.log('Connecting to database...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/builditrecords'
  });

  try {
    // Test connection
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', connectionTest.rows[0].now);
    
    // Get table names - only check the tables we need for our app
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('artists', 'releases', 'labels', 'release_artists', 'artist_labels')
      ORDER BY table_name
    `);
    
    // Create a set of tables that exist
    const existingTables = new Set(tablesResult.rows.map(row => row.table_name));
    
    console.log('\n=== DATABASE TABLES ===');
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
      console.log(`- ${tableName}: ${countResult.rows[0].count} rows`);
      
      // Show table schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log('  Columns:');
      for (const col of schemaResult.rows) {
        console.log(`    - ${col.column_name} (${col.data_type}${col.is_nullable === 'YES' ? ', nullable' : ''})`);
      }
      
      // Sample data from each table
      const sampleResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 1`);
      if (sampleResult.rows.length > 0) {
        console.log('  Sample data:');
        console.log('    ', JSON.stringify(sampleResult.rows[0]).substring(0, 100) + '...');
      }
      
      console.log('');
    }
    
    // Check if we need to create tables
    const missingTables = ['artists', 'releases', 'labels', 'release_artists', 'artist_labels']
      .filter(table => !existingTables.has(table));
    
    if (missingTables.length > 0) {
      console.log('\n=== MISSING TABLES ===');
      console.log(`The following tables need to be created: ${missingTables.join(', ')}`);
      console.log('You can run the reimport-data.js script with dropTablesFirst=true to create them');
      return;
    }
    
    // Analyze labels table if it exists
    if (existingTables.has('labels')) {
      console.log('\n=== LABELS ANALYSIS ===');
      const labelsResult = await pool.query('SELECT * FROM labels ORDER BY id');
      
      for (const label of labelsResult.rows) {
        console.log(`\nLabel: ${label.name || label.display_name} (ID: ${label.id})`);
        
        // Count releases per label if the releases table exists
        if (existingTables.has('releases')) {
          try {
            const releasesResult = await pool.query(`
              SELECT COUNT(*) AS release_count
              FROM releases 
              WHERE label_id = $1 OR label_id::text = $1
            `, [label.id]);
            
            console.log(`- Releases: ${releasesResult.rows[0].release_count}`);
            
            // Check for release_type column
            const hasReleaseType = schemaResult.rows.some(col => col.column_name === 'release_type');
            if (hasReleaseType) {
              const typeDistResult = await pool.query(`
                SELECT release_type, COUNT(*) 
                FROM releases 
                WHERE label_id = $1 OR label_id::text = $1
                GROUP BY release_type
              `, [label.id]);
              
              console.log('- Release Types:');
              typeDistResult.rows.forEach(row => {
                console.log(`  * ${row.release_type || 'Unknown'}: ${row.count}`);
              });
            }
          } catch (error) {
            console.log(`- Error counting releases: ${error.message}`);
          }
        }
        
        // Count artists per label through artist_labels if the table exists
        if (existingTables.has('artist_labels') && existingTables.has('artists')) {
          try {
            const artistLabelsResult = await pool.query(`
              SELECT COUNT(DISTINCT artist_id) AS artist_count
              FROM artist_labels
              WHERE label_id = $1 OR label_id::text = $1
            `, [label.id]);
            
            console.log(`- Artists (via artist_labels): ${artistLabelsResult.rows[0].artist_count}`);
          } catch (error) {
            console.log(`- Error counting artists via artist_labels: ${error.message}`);
          }
        }
        
        // Count unique artists who have releases with this label
        if (existingTables.has('release_artists') && existingTables.has('releases')) {
          try {
            const artistsViaReleasesResult = await pool.query(`
              SELECT COUNT(DISTINCT ra.artist_id) AS artist_count
              FROM release_artists ra
              JOIN releases r ON ra.release_id = r.id
              WHERE r.label_id = $1 OR r.label_id::text = $1
            `, [label.id]);
            
            console.log(`- Artists (via releases): ${artistsViaReleasesResult.rows[0].artist_count}`);
          } catch (error) {
            console.log(`- Error counting artists via releases: ${error.message}`);
          }
        }
        
        // List some sample artists
        if (existingTables.has('artists') && existingTables.has('artist_labels')) {
          try {
            const sampleArtistsResult = await pool.query(`
              SELECT a.id, a.name
              FROM artists a
              JOIN artist_labels al ON a.id = al.artist_id
              WHERE al.label_id = $1 OR al.label_id::text = $1
              ORDER BY a.name
              LIMIT 5
            `, [label.id]);
            
            if (sampleArtistsResult.rows.length > 0) {
              console.log('- Sample Artists:');
              sampleArtistsResult.rows.forEach(artist => {
                console.log(`  * ${artist.name} (${artist.id})`);
              });
            }
          } catch (error) {
            console.log(`- Error getting sample artists: ${error.message}`);
          }
        }
        
        // List some sample releases
        if (existingTables.has('releases')) {
          try {
            const sampleReleasesResult = await pool.query(`
              SELECT id, title, release_date, release_type
              FROM releases
              WHERE label_id = $1 OR label_id::text = $1
              ORDER BY release_date DESC NULLS LAST
              LIMIT 5
            `, [label.id]);
            
            if (sampleReleasesResult.rows.length > 0) {
              console.log('- Sample Releases:');
              sampleReleasesResult.rows.forEach(release => {
                const releaseType = release.release_type ? `${release.release_type}` : 'unknown type';
                const releaseDate = release.release_date ? `${release.release_date}` : 'no date';
                console.log(`  * ${release.title} (${release.id}, ${releaseType}, ${releaseDate})`);
              });
            }
          } catch (error) {
            console.log(`- Error getting sample releases: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n=== SUMMARY ===');
    // Get total counts for existing tables
    if (existingTables.has('releases')) {
      const totalReleasesResult = await pool.query('SELECT COUNT(*) FROM releases');
      console.log(`- Total Releases: ${totalReleasesResult.rows[0].count}`);
    }
    
    if (existingTables.has('artists')) {
      const totalArtistsResult = await pool.query('SELECT COUNT(*) FROM artists');
      console.log(`- Total Artists: ${totalArtistsResult.rows[0].count}`);
    }
    
    if (existingTables.has('labels')) {
      const totalLabelsResult = await pool.query('SELECT COUNT(*) FROM labels');
      console.log(`- Total Labels: ${totalLabelsResult.rows[0].count}`);
    }
    
  } catch (error) {
    console.error('Database analysis error:', error);
  } finally {
    await pool.end();
    console.log('\nDatabase analysis complete');
  }
}

analyzeDatabase().catch(console.error);
