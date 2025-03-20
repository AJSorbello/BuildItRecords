/**
 * analyze-db-schema.js
 * 
 * Script to analyze the database schema and understand relationships
 * between artists and labels.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables if needed
try {
  require('dotenv').config();
} catch (error) {
  console.log('Dotenv not available, using environment variables directly');
}

// Set up database connection from environment
const createPool = () => {
  const connectionString = process.env.DATABASE_URL || 
                         process.env.VITE_DATABASE_URL || 
                         process.env.NEXT_PUBLIC_DATABASE_URL;
                         
  if (connectionString) {
    console.log('Using connection string from environment');
    // Only use SSL for remote connections, not for localhost
    const sslConfig = connectionString.includes('localhost') ? false : 
      { rejectUnauthorized: false };
    
    return new Pool({ 
      connectionString,
      ssl: sslConfig
    });
  }
  
  // Fallback to direct parameters
  console.log('Using direct connection parameters');
  const host = process.env.DB_HOST || process.env.VITE_DB_HOST || 'localhost';
  // Only use SSL for non-localhost connections
  const sslConfig = (host === 'localhost' || host === '127.0.0.1') ? false : 
    { rejectUnauthorized: false };
  
  return new Pool({
    host,
    port: process.env.DB_PORT || process.env.VITE_DB_PORT || 5432,
    database: process.env.DB_NAME || process.env.VITE_DB_NAME || 'postgres',
    user: process.env.DB_USER || process.env.VITE_DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.VITE_DB_PASSWORD || 'postgres',
    ssl: sslConfig
  });
};

// Main function
async function analyzeSchema() {
  const outputPath = path.join(__dirname, 'db-schema-analysis.json');
  let pool;
  
  try {
    console.log('Connecting to database...');
    pool = createPool();
    
    // Test the connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', testResult.rows[0].now);
    
    // Get list of all tables
    console.log('Fetching list of tables...');
    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tableResult.rows.map(row => row.table_name);
    console.log('Found tables:', tables);
    
    // Collect detailed schema for each table
    const schema = {};
    for (const table of tables) {
      console.log(`Analyzing table: ${table}`);
      
      // Get columns
      const columnResult = await pool.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      // Get foreign keys
      const fkResult = await pool.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
      `, [table]);
      
      schema[table] = {
        columns: columnResult.rows,
        foreignKeys: fkResult.rows
      };
    }
    
    // Check specifically for artist-label relationships
    console.log('\nAnalyzing artist-label relationships...');
    
    // Check if there's a join table between artists and labels
    const joinTables = tables.filter(table => 
      table.includes('artist') && table.includes('label') ||
      table.includes('label') && table.includes('artist')
    );
    
    // Check direct relationships in artists table
    let artistLabelRelationship = 'Unknown';
    if (schema.artists) {
      const labelIdColumn = schema.artists.columns.find(col => col.column_name === 'label_id');
      if (labelIdColumn) {
        artistLabelRelationship = 'Direct (artists.label_id)';
      }
      
      const labelsColumn = schema.artists.columns.find(col => col.column_name === 'labels');
      if (labelsColumn) {
        artistLabelRelationship = 'Array/JSON (artists.labels)';
      }
    }
    
    // Check for join table
    if (joinTables.length > 0) {
      artistLabelRelationship = `Join table (${joinTables.join(', ')})`;
    }
    
    // Count artists by label using different queries
    const artistCounts = {};
    
    // Method 1: Direct label_id
    try {
      const directQuery = `
        SELECT l.id, l.name, COUNT(a.id) as artist_count
        FROM artists a
        JOIN labels l ON a.label_id = l.id
        GROUP BY l.id, l.name
      `;
      const directResult = await pool.query(directQuery);
      artistCounts.directLabelId = directResult.rows;
    } catch (error) {
      console.error('Error counting artists by direct label_id:', error.message);
      artistCounts.directLabelId = { error: error.message };
    }
    
    // Method 2: Using labels array/json field if it exists
    try {
      // Only run this if the column exists
      if (schema.artists?.columns.some(col => col.column_name === 'labels')) {
        const jsonQuery = `
          SELECT l.id, l.name, COUNT(a.id) as artist_count
          FROM artists a, jsonb_array_elements(a.labels) as labels
          JOIN labels l ON labels->>'id' = l.id::text
          GROUP BY l.id, l.name
        `;
        const jsonResult = await pool.query(jsonQuery);
        artistCounts.labelsJsonArray = jsonResult.rows;
      }
    } catch (error) {
      console.error('Error counting artists by labels json array:', error.message);
      artistCounts.labelsJsonArray = { error: error.message };
    }
    
    // Method 3: Using join table if it exists
    if (joinTables.length > 0) {
      try {
        const joinTable = joinTables[0];
        const joinQuery = `
          SELECT l.id, l.name, COUNT(DISTINCT a.id) as artist_count
          FROM artists a
          JOIN ${joinTable} al ON a.id = al.artist_id
          JOIN labels l ON l.id = al.label_id
          GROUP BY l.id, l.name
        `;
        const joinResult = await pool.query(joinQuery);
        artistCounts.joinTable = joinResult.rows;
      } catch (error) {
        console.error('Error counting artists using join table:', error.message);
        artistCounts.joinTable = { error: error.message };
      }
    }
    
    // Write analysis to file
    const analysis = {
      tables,
      schema,
      artistLabelRelationship,
      joinTables,
      artistCounts,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\nAnalysis complete! Results written to ${outputPath}`);
    
    // Print summary findings
    console.log('\n===== ARTIST LABEL RELATIONSHIP ANALYSIS =====');
    console.log(`Relationship type: ${artistLabelRelationship}`);
    
    console.log('\nArtist counts by label:');
    Object.entries(artistCounts).forEach(([method, counts]) => {
      if (Array.isArray(counts)) {
        console.log(`\n  ${method}:`);
        counts.forEach(row => {
          console.log(`    Label ${row.id} (${row.name}): ${row.artist_count} artists`);
        });
      } else {
        console.log(`\n  ${method}: Error - ${counts.error}`);
      }
    });
    
  } catch (error) {
    console.error('Database analysis failed:', error);
  } finally {
    if (pool) {
      console.log('Closing database connection');
      await pool.end();
    }
  }
}

// Run the analysis
analyzeSchema().catch(console.error);
