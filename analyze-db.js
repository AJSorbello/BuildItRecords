// Database Analysis Script
// This script directly connects to the Supabase PostgreSQL database
// to analyze table structures and data relevant to the API issue

const { Pool } = require('pg');
require('dotenv').config();

// Initialize connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'liuaozuvkmvanmchndzl.supabase.co',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false
});

async function analyzeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connected to database');
    console.log('------------------------------');
    
    // 1. List all tables
    console.log('TABLES IN DATABASE:');
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tableResult.rows.map(row => row.table_name);
    console.log(tables);
    console.log(`Found ${tables.length} tables`);
    console.log('------------------------------');
    
    // 2. Check specific tables structure
    const tablesToCheck = ['artists', 'releases', 'release_artists', 'labels'];
    
    for (const table of tablesToCheck) {
      if (tables.includes(table)) {
        console.log(`COLUMNS IN ${table.toUpperCase()} TABLE:`);
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        columnsResult.rows.forEach(col => {
          console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : ''}`);
        });
        
        // Get count of rows
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`Total rows: ${countResult.rows[0].count}`);
        
        // Get sample data
        const sampleResult = await client.query(`SELECT * FROM ${table} LIMIT 3`);
        console.log('Sample data:');
        sampleResult.rows.forEach((row, i) => {
          console.log(`Sample ${i+1}:`, row);
        });
        
        console.log('------------------------------');
      } else {
        console.log(`Table '${table}' does not exist in the database`);
        console.log('------------------------------');
      }
    }
    
    // 3. Specifically analyze the label_id field
    const tables_with_label_id = ['artists', 'releases'];
    
    for (const table of tables_with_label_id) {
      if (tables.includes(table)) {
        // Check if label_id column exists
        const columnsResult = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'label_id'
        `, [table]);
        
        if (columnsResult.rows.length > 0) {
          console.log(`LABEL_ID ANALYSIS FOR ${table.toUpperCase()}:`);
          
          // Count null and non-null values
          const nullCountResult = await client.query(`
            SELECT 
              COUNT(*) AS total,
              COUNT(label_id) AS non_null,
              COUNT(*) - COUNT(label_id) AS null_count
            FROM ${table}
          `);
          
          console.log(`Total rows: ${nullCountResult.rows[0].total}`);
          console.log(`With label_id: ${nullCountResult.rows[0].non_null}`);
          console.log(`Without label_id: ${nullCountResult.rows[0].null_count}`);
          
          // Get distinct label_id values and counts
          const distinctResult = await client.query(`
            SELECT label_id, COUNT(*) AS count
            FROM ${table}
            WHERE label_id IS NOT NULL
            GROUP BY label_id
            ORDER BY COUNT(*) DESC
            LIMIT 10
          `);
          
          console.log('Top 10 label_id values:');
          distinctResult.rows.forEach((row, i) => {
            console.log(`${i+1}. '${row.label_id}': ${row.count} ${table}`);
          });
          
          // Check specifically for buildit-records
          const builditResult = await client.query(`
            SELECT COUNT(*) AS exact_match
            FROM ${table}
            WHERE label_id = 'buildit-records'
          `);
          
          const builditLikeResult = await client.query(`
            SELECT label_id, COUNT(*) AS count
            FROM ${table}
            WHERE label_id ILIKE '%buildit%' OR label_id ILIKE '%build it%'
            GROUP BY label_id
          `);
          
          console.log(`Exact 'buildit-records' matches: ${builditResult.rows[0].exact_match}`);
          console.log('Fuzzy matches:');
          builditLikeResult.rows.forEach(row => {
            console.log(`- '${row.label_id}': ${row.count}`);
          });
          
          console.log('------------------------------');
        } else {
          console.log(`Table '${table}' does not have a label_id column`);
          console.log('------------------------------');
        }
      }
    }
    
    // 4. Analyze the relationship between artists and releases
    if (tables.includes('artists') && tables.includes('releases') && tables.includes('release_artists')) {
      console.log('ARTIST-RELEASE RELATIONSHIP ANALYSIS:');
      
      const relQuery = await client.query(`
        SELECT 
          COUNT(DISTINCT ra.artist_id) AS unique_artists,
          COUNT(DISTINCT ra.release_id) AS unique_releases,
          COUNT(*) AS total_relationships
        FROM release_artists ra
      `);
      
      console.log(`Unique artists in relationships: ${relQuery.rows[0].unique_artists}`);
      console.log(`Unique releases in relationships: ${relQuery.rows[0].unique_releases}`);
      console.log(`Total artist-release relationships: ${relQuery.rows[0].total_relationships}`);
      
      // Check for BuildIt Records releases and their artists
      const builditReleasesQuery = await client.query(`
        SELECT COUNT(DISTINCT r.id) AS release_count
        FROM releases r
        WHERE r.label_id ILIKE '%buildit%' OR r.label_id ILIKE '%build it%'
      `);
      
      console.log(`Releases with BuildIt-like label: ${builditReleasesQuery.rows[0].release_count}`);
      
      const builditArtistsQuery = await client.query(`
        SELECT COUNT(DISTINCT a.id) AS direct_artists
        FROM artists a
        WHERE a.label_id ILIKE '%buildit%' OR a.label_id ILIKE '%build it%'
      `);
      
      console.log(`Artists with direct BuildIt-like label: ${builditArtistsQuery.rows[0].direct_artists}`);
      
      const builditRelArtistsQuery = await client.query(`
        SELECT COUNT(DISTINCT a.id) AS rel_artists
        FROM artists a
        JOIN release_artists ra ON a.id = ra.artist_id
        JOIN releases r ON ra.release_id = r.id
        WHERE r.label_id ILIKE '%buildit%' OR r.label_id ILIKE '%build it%'
      `);
      
      console.log(`Artists associated with BuildIt releases: ${builditRelArtistsQuery.rows[0].rel_artists}`);
      
      console.log('------------------------------');
    }
    
    console.log('Database analysis complete');
    
  } catch (error) {
    console.error('Error during database analysis:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the analysis
analyzeDatabase();
