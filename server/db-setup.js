const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function setupDatabase() {
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf8'
    );

    // Execute the migration
    await pool.query(migrationSQL);
    console.log('Database schema created successfully');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().then(() => {
  console.log('Database setup complete');
  process.exit(0);
});
