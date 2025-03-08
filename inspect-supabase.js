// Script to inspect the Supabase database schema and count records
// This helps diagnose if data exists in Supabase after migration
const { Pool } = require('pg') // eslint-disable-line @typescript-eslint/no-var-requires;

// Connection parameters for Supabase
const config = {
  connectionString: process.env.POSTGRES_URL_NON_POOLING || 'postgres://postgres:postgres@db.liuaozuvkmvanmchndzl.supabase.co:5432/postgres?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('Connecting to Supabase database with connection string (masked):');
const maskedConnectionString = config.connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log(maskedConnectionString);

// Create a new connection pool
const pool = new Pool(config);

async function main() {
  const client = await pool.connect();
  try {
    console.log('Connected to Supabase database successfully');
    
    // Get list of all tables
    console.log('\n📊 Available tables:');
    const tablesResult = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    
    const tables = tablesResult.rows.map(row => row.tablename);
    for (const table of tables) {
      console.log(`- ${table}`);
    }
    
    // Print record counts for important tables
    console.log('\n📈 Record counts:');
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      const count = countResult.rows[0].count;
      console.log(`- ${table}: ${count} records`);
    }
    
    // Sample data from artists and releases
    if (tables.includes('artists')) {
      console.log('\n👨‍🎤 Sample artists (up to 3):');
      const artistsResult = await client.query('SELECT * FROM artists LIMIT 3');
      console.log(JSON.stringify(artistsResult.rows, null, 2));
    }
    
    if (tables.includes('releases')) {
      console.log('\n💿 Sample releases (up to 3):');
      const releasesResult = await client.query('SELECT * FROM releases LIMIT 3');
      console.log(JSON.stringify(releasesResult.rows, null, 2));
    }
    
    // Check column structure for important tables
    console.log('\n🏗️ Table schemas:');
    for (const table of ['artists', 'releases', 'labels'].filter(t => tables.includes(t))) {
      console.log(`\n- ${table} schema:`);
      const schemaResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(schemaResult.rows.map(col => 
        `  - ${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' [nullable]' : ''}`
      ).join('\n'));
    }

  } catch (err) {
    console.error('Error inspecting database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
