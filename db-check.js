// Load environment variables
require('dotenv').config();

// Get PostgreSQL client
const { Pool } = require('pg') // eslint-disable-line @typescript-eslint/no-var-requires;

// Force accept self-signed certificates (for development only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkDatabase() {
  console.log('Database Connection Test');
  console.log('-----------------------');
  console.log('Environment Variables:');
  console.log('- POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET (value hidden)' : 'NOT SET');
  console.log('- DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.log('- DB_USER:', process.env.DB_USER ? 'SET (value hidden)' : 'NOT SET');
  console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET (value hidden)' : 'NOT SET');
  console.log('- DB_NAME:', process.env.DB_NAME || 'NOT SET');
  console.log('- DB_PORT:', process.env.DB_PORT || 'NOT SET');
  console.log('- DB_SSL:', process.env.DB_SSL || 'NOT SET');
  
  // Create connection options
  let poolConfig;
  
  if (process.env.POSTGRES_URL) {
    // Use connection string if available
    poolConfig = {
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'no-verify'
      }
    };
    console.log('\nUsing connection string from POSTGRES_URL');
  } else {
    // Use individual parameters
    poolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'builditrecords',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      // Only use SSL if explicitly set to true
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false,
        sslmode: 'no-verify'
      } : false
    };
    console.log('\nUsing individual connection parameters:', JSON.stringify({
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
      ssl: !!poolConfig.ssl
    }));
  }
  
  // Add common options
  poolConfig.connectionTimeoutMillis = 10000;
  poolConfig.idleTimeoutMillis = 10000;
  
  const pool = new Pool(poolConfig);
  
  console.log('\nAttempting database connection...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✓ Successfully connected to database!');
    
    // Check for tables
    console.log('\nQuerying database tables...');
    
    // Check releases table
    try {
      const tableInfo = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `);
      
      // Group results by table
      const tables = {};
      tableInfo.rows.forEach(row => {
        if (!tables[row.table_name]) {
          tables[row.table_name] = [];
        }
        tables[row.table_name].push({
          column: row.column_name,
          type: row.data_type
        });
      });
      
      // Display results
      console.log(`\nFound ${Object.keys(tables).length} tables in database:`);
      for (const [tableName, columns] of Object.entries(tables)) {
        console.log(`\nTable: ${tableName} (${columns.length} columns)`);
        columns.forEach(col => {
          console.log(`- ${col.column}: ${col.type}`);
        });
      }
      
      // Check for labels
      const labels = await client.query('SELECT id, name FROM labels');
      console.log('\nLabels in database:');
      if (labels.rows.length === 0) {
        console.log('NO LABELS FOUND - This is likely the root cause of the issue!');
      } else {
        labels.rows.forEach(label => {
          console.log(`- ${label.name} (ID: ${label.id})`);
        });
      }
      
      // Check for releases
      const releases = await client.query('SELECT COUNT(*) as count FROM releases');
      console.log(`\nTotal releases: ${releases.rows[0].count}`);
      
      // Check releases by label
      if (labels.rows.length > 0) {
        console.log('\nReleases by label:');
        for (const label of labels.rows) {
          const releaseCount = await client.query(
            'SELECT COUNT(*) as count FROM releases WHERE label_id = $1',
            [label.id]
          );
          console.log(`- ${label.name}: ${releaseCount.rows[0].count} releases`);
        }
      }
      
    } catch (tableError) {
      console.error('Error querying database schema:', tableError.message);
    }
    
    // Release client back to pool
    client.release();
  } catch (error) {
    console.error('✗ Database connection error:', error.message);
    console.error('Error details:', error);
  } finally {
    // Close pool
    await pool.end();
    console.log('\nDatabase connection pool closed');
  }
}

// Run the check
checkDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
