// db-schema-inspect.js
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const { Client } = pg;

// Database connection parameters
const dbConfig = {
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// If no connection string is available, use individual parameters
if (!dbConfig.connectionString) {
  dbConfig.host = process.env.DB_HOST;
  dbConfig.port = process.env.DB_PORT;
  dbConfig.database = process.env.DB_NAME;
  dbConfig.user = process.env.DB_USER;
  dbConfig.password = process.env.DB_PASSWORD;
}

console.log('Connecting with config:', {
  host: dbConfig.host || '(from connection string)',
  port: dbConfig.port || '(from connection string)',
  database: dbConfig.database || '(from connection string)',
  user: dbConfig.user || '(from connection string)',
  usingConnectionString: !!dbConfig.connectionString
});

async function inspectSchema() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('\n=== TABLES ===');
    console.log(tables);
    
    // Inspect each table schema
    for (const table of tables) {
      console.log(`\n=== TABLE: ${table} ===`);
      
      // Get columns for this table
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      
      console.log('COLUMNS:');
      columnsResult.rows.forEach(column => {
        console.log(`  ${column.column_name} (${column.data_type})${column.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}${column.column_default ? ' DEFAULT ' + column.column_default : ''}`);
      });
      
      // Sample data
      try {
        const sampleResult = await client.query(`
          SELECT * FROM ${table} LIMIT 1;
        `);
        
        if (sampleResult.rows.length > 0) {
          console.log('SAMPLE ROW:');
          console.log(sampleResult.rows[0]);
        } else {
          console.log('NO DATA');
        }
      } catch (err) {
        console.error(`Error getting sample data for ${table}:`, err.message);
      }
      
      // Foreign keys
      try {
        const fkResult = await client.query(`
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1;
        `, [table]);
        
        if (fkResult.rows.length > 0) {
          console.log('FOREIGN KEYS:');
          fkResult.rows.forEach(fk => {
            console.log(`  ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        }
      } catch (err) {
        console.error(`Error getting foreign keys for ${table}:`, err.message);
      }
    }
    
    // Special focus on releases, artists, labels
    const targetTables = ['releases', 'artists', 'labels'];
    for (const table of targetTables) {
      if (!tables.includes(table)) continue;
      
      console.log(`\n=== EXAMINING ${table.toUpperCase()} TABLE IN DETAIL ===`);
      
      // Count records
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table};`);
      console.log(`Total records: ${countResult.rows[0].count}`);
      
      // Get sample with most columns filled
      try {
        const sampleResult = await client.query(`
          SELECT * FROM ${table} 
          ORDER BY (SELECT COUNT(*) FROM jsonb_object_keys(to_jsonb(${table}.*))) DESC
          LIMIT 1;
        `);
        
        if (sampleResult.rows.length > 0) {
          console.log('MOST COMPLETE RECORD:');
          console.log(JSON.stringify(sampleResult.rows[0], null, 2));
        }
      } catch (err) {
        console.error(`Error getting detailed sample for ${table}:`, err.message);
        
        // Fallback to regular sample
        try {
          const fallbackResult = await client.query(`SELECT * FROM ${table} LIMIT 1;`);
          if (fallbackResult.rows.length > 0) {
            console.log('SAMPLE RECORD:');
            console.log(JSON.stringify(fallbackResult.rows[0], null, 2));
          }
        } catch (innerErr) {
          console.error(`Fallback sample failed:`, innerErr.message);
        }
      }
    }
    
    // Test specific joins that might be problematic
    if (tables.includes('releases') && tables.includes('artists')) {
      console.log('\n=== TESTING RELEASES-ARTISTS JOIN ===');
      try {
        const joinQuery = `
          SELECT r.id as release_id, a.id as artist_id, a.name as artist_name
          FROM releases r
          LEFT JOIN artists a ON r.primary_artist_id = a.id
          LIMIT 5;
        `;
        const joinResult = await client.query(joinQuery);
        console.log('JOIN RESULT:');
        console.log(joinResult.rows);
      } catch (err) {
        console.error('Error testing releases-artists join:', err.message);
        
        // Try alternative join if available
        try {
          const altJoinQuery = `
            SELECT r.id as release_id, a.id as artist_id, a.name as artist_name
            FROM releases r
            LEFT JOIN artists a ON r.artist_id = a.id
            LIMIT 5;
          `;
          const altJoinResult = await client.query(altJoinQuery);
          console.log('ALTERNATIVE JOIN RESULT (using artist_id):');
          console.log(altJoinResult.rows);
        } catch (altErr) {
          console.error('Error testing alternative releases-artists join:', altErr.message);
        }
      }
    }
    
    if (tables.includes('releases') && tables.includes('labels')) {
      console.log('\n=== TESTING RELEASES-LABELS JOIN ===');
      try {
        const labelJoinQuery = `
          SELECT r.id as release_id, l.id as label_id, l.name as label_name
          FROM releases r
          LEFT JOIN labels l ON r.label_id = l.id
          LIMIT 5;
        `;
        const labelJoinResult = await client.query(labelJoinQuery);
        console.log('JOIN RESULT:');
        console.log(labelJoinResult.rows);
      } catch (err) {
        console.error('Error testing releases-labels join:', err.message);
      }
    }
    
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Create a file to store results
const outputFile = 'db-schema-results.txt';
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  originalConsoleLog(...args);
  fs.appendFileSync(outputFile, args.join(' ') + '\n');
};

console.error = function(...args) {
  originalConsoleError(...args);
  fs.appendFileSync(outputFile, 'ERROR: ' + args.join(' ') + '\n');
};

// Initialize output file
fs.writeFileSync(outputFile, `=== DATABASE SCHEMA INSPECTION ===\nDate: ${new Date().toISOString()}\n\n`);

inspectSchema().catch(err => {
  console.error('Unhandled error:', err);
});
