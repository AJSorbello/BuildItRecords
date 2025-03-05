// Test database connectivity for deployment
const { getPool, getTableSchema } = require('./utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  console.log('Testing database connection');
  
  try {
    // Try to connect
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database!');
    
    try {
      // Inspect the main tables
      console.log('\n🔍 Inspecting database schema...');
      
      // Check releases table
      const releasesSchema = await getTableSchema(client, 'releases');
      
      console.log(`\nReleases table has ${releasesSchema.length} columns:`);
      releasesSchema.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      
      // Count of releases
      const releasesCount = await client.query('SELECT COUNT(*) FROM releases');
      console.log(`\nTotal releases: ${releasesCount.rows[0].count}`);
      
      // Check release_artists junction table
      try {
        const junctionSchema = await getTableSchema(client, 'release_artists');
        
        console.log(`\nRelease-Artists junction table has ${junctionSchema.length} columns:`);
        junctionSchema.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // Count of junction entries
        const junctionCount = await client.query('SELECT COUNT(*) FROM release_artists');
        console.log(`\nTotal release-artist relationships: ${junctionCount.rows[0].count}`);
      } catch (err) {
        console.log('\n❌ Could not find release_artists junction table');
      }
      
      // Try one sample query with a label
      const sampleLabel = 'buildit-records';
      const labelTest = await client.query(`
        SELECT r.id, r.title, r.label_id
        FROM releases r 
        WHERE r.label_id = $1 
        LIMIT 5
      `, [sampleLabel]);
      
      console.log(`\nSample query for label '${sampleLabel}' returned ${labelTest.rows.length} results:`);
      console.log(JSON.stringify(labelTest.rows, null, 2));
      
    } finally {
      client.release();
      console.log('\nDatabase client released');
    }
    
    if (res) {
      return res.status(200).json({ 
        success: true, 
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('✅ Test completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    if (res) {
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Test failed with error:', error);
      process.exit(1);
    }
  }
};

// If run directly (not as a serverless function)
if (require.main === module) {
  module.exports();
}
