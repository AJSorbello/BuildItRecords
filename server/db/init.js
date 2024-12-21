const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const initializeDatabase = async () => {
  const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    
    console.log('Creating database schema...');
    await pool.query(schemaSql);
    console.log('Database schema created successfully');

    // Insert default data if needed
    console.log('Inserting default data...');
    await pool.query(`
      INSERT INTO labels (name, slug) 
      VALUES 
        ('Build It Records', 'buildit-records'),
        ('Build It Tech', 'buildit-tech'),
        ('Build It Deep', 'buildit-deep')
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log('Default data inserted successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run the initialization if this script is run directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
